// app/actions/inventory.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function adjustStock(payload: {
  product_id: string;
  type: 'in' | 'out';
  reason: string;
  quantity: number;
  notes: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Anda belum login' };

  // Pastikan yang mengubah adalah Admin / Kasir
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'kasir') {
    return { success: false, message: 'Akses ditolak' };
  }

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  try {
    // 1. Ambil stok produk saat ini
    const { data: product, error: productError } = await adminDb
      .from('products')
      .select('stock, name')
      .eq('product_id', payload.product_id)
      .single();

    if (productError || !product) throw new Error('Produk tidak ditemukan');

    // 2. Hitung stok baru
    let newStock = product.stock;
    if (payload.type === 'in') {
      newStock += payload.quantity;
    } else if (payload.type === 'out') {
      newStock -= payload.quantity;
      if (newStock < 0) throw new Error(`Stok ${product.name} tidak cukup untuk dikurangi sejumlah ${payload.quantity}`);
    }

    // 3. Update stok di tabel products
    const { error: updateError } = await adminDb
      .from('products')
      .update({ stock: newStock })
      .eq('product_id', payload.product_id);

    if (updateError) throw updateError;

    // 4. Catat riwayat di tabel stock_adjustments
    const { error: logError } = await adminDb.from('stock_adjustments').insert({
      product_id: payload.product_id,
      user_id: user.id,
      type: payload.type,
      reason: payload.reason,
      quantity: payload.quantity,
      notes: payload.notes
    });

    if (logError) throw logError;

    revalidatePath('/admin/inventory');
    revalidatePath('/admin/products');
    
    return { success: true, message: 'Penyesuaian stok berhasil disimpan!' };

  } catch (error: any) {
    console.error('Error Adjust Stock:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}