// app/actions/product.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Helper internal untuk validasi akses Staf (Admin / Kasir)
async function verifyStaffAccess() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const role = (profile?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'kasir') {
    throw new Error('Akses ditolak: Hanya staf internal yang dapat melakukan aksi ini.');
  }

  // Kembalikan Admin Client (Bypass RLS untuk mutasi data yang aman)
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function addProductAction(formData: FormData) {
  // 1. Validasi Keamanan & Dapatkan Kunci Admin
  const adminDb = await verifyStaffAccess();

  // 2. Ekstrak data dari Form
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  
  const price_retail = parseInt(formData.get('price_retail') as string) || 0;
  const price_reseller = parseInt(formData.get('price_reseller') as string) || 0;
  const stock = parseInt(formData.get('stock') as string) || 0;
  const weight = parseInt(formData.get('weight') as string) || 0;
  
  const imageFile = formData.get('image') as File;

  // 3. Simpan Data ke tabel `products` menggunakan adminDb
  const { data: product, error: productError } = await adminDb
    .from('products')
    .insert({
      name,
      sku,
      description,
      category_id: category_id || null,
      price_retail,
      price_reseller,
      stock,
      weight_actual_gram: weight,
      weight_volumetric_gram: weight,
      is_active: true
    })
    .select('product_id')
    .single();

  if (productError) {
    console.error("Gagal simpan produk:", productError);
    throw new Error('Gagal menyimpan produk ke database: ' + productError.message);
  }

  // 4. Upload Foto ke Supabase Storage (Jika ada)
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${product.product_id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await adminDb.storage
      .from('product_images') 
      .upload(fileName, imageFile);

    if (!uploadError) {
      const { data: publicUrlData } = adminDb.storage
        .from('product_images')
        .getPublicUrl(fileName);

      await adminDb.from('product_images').insert({
        product_id: product.product_id,
        image_path: publicUrlData.publicUrl,
        is_primary: true
      });
    } else {
      console.error("Gagal upload gambar:", uploadError);
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  redirect('/admin/products');
}

export async function editProductAction(formData: FormData) {
  // 1. Validasi Keamanan & Dapatkan Kunci Admin
  const adminDb = await verifyStaffAccess();

  const productId = formData.get('product_id') as string;
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  const is_active = formData.get('is_active') === 'on';
  
  const price_retail = parseInt(formData.get('price_retail') as string) || 0;
  const price_reseller = parseInt(formData.get('price_reseller') as string) || 0;
  const stock = parseInt(formData.get('stock') as string) || 0;
  const weight = parseInt(formData.get('weight') as string) || 0;
  
  const imageFile = formData.get('image') as File;

  // 2. Update data teks ke database
  const { error: updateError } = await adminDb
    .from('products')
    .update({
      name, sku, description, 
      category_id: category_id || null, 
      price_retail, price_reseller, stock,
      weight_actual_gram: weight, weight_volumetric_gram: weight,
      is_active
    })
    .eq('product_id', productId);

  if (updateError) {
    console.error("Gagal update produk:", updateError);
    throw new Error('Gagal update produk: ' + updateError.message);
  }

  // 3. Upload foto baru jika ada
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await adminDb.storage
      .from('product_images')
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error("GAGAL UPLOAD FOTO KE STORAGE:", uploadError);
      throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);
    }

    const { data: publicUrlData } = adminDb.storage.from('product_images').getPublicUrl(fileName);
    
    const { data: existingImg } = await adminDb.from('product_images').select('image_id').eq('product_id', productId).single();
    
    if (existingImg) {
      await adminDb.from('product_images').update({ image_path: publicUrlData.publicUrl }).eq('image_id', existingImg.image_id);
    } else {
      await adminDb.from('product_images').insert({ product_id: productId, image_path: publicUrlData.publicUrl, is_primary: true });
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  redirect(`/admin/products/edit/${productId}?success=true`);
}

export async function deleteProductAction(productId: string) {
  // 1. Validasi Keamanan & Dapatkan Kunci Admin
  const adminDb = await verifyStaffAccess();

  // 2. Hapus atau Soft Delete
  const { error } = await adminDb.from('products').delete().eq('product_id', productId);
  
  if (error && error.code === '23503') {
    await adminDb.from('products').update({ is_active: false }).eq('product_id', productId);
  } else if (error) {
    console.error("Gagal menghapus produk:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  return { success: true };
}