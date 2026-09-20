// app/actions/procurement.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addSupplier(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;

  const { error } = await supabase
    .from('suppliers')
    .insert({ name, phone, address });

  if (error) {
    console.error("Gagal menambah suplier:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/procurement');
  return { success: true };
}

export async function recordStockIn(formData: FormData) {
  const supabase = await createClient();
  const product_id = formData.get('product_id') as string;
  const supplier_id = formData.get('supplier_id') as string;
  const quantity = parseInt(formData.get('quantity') as string || '0', 10);
  const buy_price = parseFloat(formData.get('buy_price') as string || '0');
  const notes = formData.get('notes') as string;

  if (!product_id || quantity <= 0) {
    return { success: false, message: 'Pilih produk dan jumlah stok dengan benar.' };
  }

  // 1. Simpan ke riwayat log masuk
  const { error: logError } = await supabase
    .from('stock_in_logs')
    .insert({
      product_id,
      supplier_id: supplier_id || null,
      quantity,
      buy_price,
      notes
    });

  if (logError) {
    console.error("Gagal mencatat log restock:", logError);
    return { success: false, message: logError.message };
  }

  // 2. Ambil stok produk saat ini
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('stock')
    .eq('product_id', product_id)
    .single();

  if (fetchError) {
    return { success: false, message: 'Produk tidak ditemukan.' };
  }

  const newStock = (currentProduct.stock || 0) + quantity;

  // 3. Update stok di tabel produk
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('product_id', product_id);

  if (updateError) {
    console.error("Gagal memperbarui stok produk:", updateError);
    return { success: false, message: updateError.message };
  }

  revalidatePath('/admin/procurement');
  revalidatePath('/admin/products');
  return { success: true };
}