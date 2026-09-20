// app/actions/product.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function addProductAction(formData: FormData) {
  const supabase = await createClient();

  // 1. Ekstrak data dari Form
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  
  const price_retail = parseInt(formData.get('price_retail') as string);
  const price_reseller = parseInt(formData.get('price_reseller') as string);
  const stock = parseInt(formData.get('stock') as string);
  const weight = parseInt(formData.get('weight') as string);
  
  const imageFile = formData.get('image') as File;

  // 2. Simpan Data ke tabel `products`
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name,
      sku,
      description,
      category_id,
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
    throw new Error('Gagal menyimpan produk ke database.');
  }

  // 3. Upload Foto ke Supabase Storage (Jika ada)
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${product.product_id}-${Date.now()}.${fileExt}`;

    // Upload ke bucket bernama 'product_images'
    const { error: uploadError } = await supabase.storage
      .from('product_images') 
      .upload(fileName, imageFile);

    if (!uploadError) {
      // Dapatkan Public URL
      const { data: publicUrlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(fileName);

      // Simpan URL gambar ke tabel `product_images`
      await supabase.from('product_images').insert({
        product_id: product.product_id,
        image_path: publicUrlData.publicUrl,
        is_primary: true
      });
    } else {
      console.error("Gagal upload gambar:", uploadError);
    }
  }

  // 4. Refresh Cache & Kembali ke halaman produk admin
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  redirect('/admin/products');
}

// Tambahkan di bagian bawah file app/actions/product.ts
export async function editProductAction(formData: FormData) {
  const supabase = await createClient();

  const productId = formData.get('product_id') as string;
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const description = formData.get('description') as string;
  const category_id = formData.get('category_id') as string;
  const is_active = formData.get('is_active') === 'on'; // Checkbox status aktif
  
  const price_retail = parseInt(formData.get('price_retail') as string);
  const price_reseller = parseInt(formData.get('price_reseller') as string);
  const stock = parseInt(formData.get('stock') as string);
  const weight = parseInt(formData.get('weight') as string);
  
  const imageFile = formData.get('image') as File;

  // 1. Update data teks ke database
  const { error: updateError } = await supabase
    .from('products')
    .update({
      name, sku, description, category_id, 
      price_retail, price_reseller, stock,
      weight_actual_gram: weight, weight_volumetric_gram: weight,
      is_active
    })
    .eq('product_id', productId);

  if (updateError) throw new Error('Gagal update produk');

  // 2. Jika Admin mengunggah foto baru, timpa foto lama
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;

    await supabase.storage.from('product_images').upload(fileName, imageFile);
    const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(fileName);
    
    // Cek apakah produk sudah punya foto sebelumnya
    const { data: existingImg } = await supabase.from('product_images').select('image_id').eq('product_id', productId).single();
    
    if (existingImg) {
      await supabase.from('product_images').update({ image_path: publicUrlData.publicUrl }).eq('image_id', existingImg.image_id);
    } else {
      await supabase.from('product_images').insert({ product_id: productId, image_path: publicUrlData.publicUrl, is_primary: true });
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  redirect('/admin/products');
}

export async function deleteProductAction(productId: string) {
  const supabase = await createClient();

  // Coba hapus secara permanen (Hard Delete)
  const { error } = await supabase.from('products').delete().eq('product_id', productId);
  
  // Jika gagal karena produk ini terikat dengan pesanan (Foreign Key Violation kode 23503)
  if (error && error.code === '23503') {
    // Lakukan Soft Delete (Ubah status jadi tidak aktif agar hilang dari katalog pelanggan)
    await supabase.from('products').update({ is_active: false }).eq('product_id', productId);
  } else if (error) {
    console.error("Gagal menghapus produk:", error);
    return { success: false };
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  return { success: true };
}