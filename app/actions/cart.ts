// app/actions/cart.ts
'use server';

// Pastikan path import sesuai (kita sudah pindahkan ke folder utils/supabase/server)
import { createClient } from '@/utils/supabase/server'; 
import { revalidatePath } from 'next/cache';

export async function addToCart(productId: string) {
  // PERBAIKAN: Tambahkan kata 'await' di sini!
  const supabase = await createClient();

  // 1. Cek Autentikasi User
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { 
      success: false, 
      message: 'Silakan masuk (login) terlebih dahulu untuk mulai belanja.',
      requireAuth: true
    };
  }

  try {
    // 2. Cek apakah barang ini sudah ada di keranjang user
    const { data: existingCartItem } = await supabase
      .from('carts')
      .select('cart_id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single();

    if (existingCartItem) {
      // 3A. Jika SUDAH ADA: Update quantity (Jumlah + 1)
      const { error: updateError } = await supabase
        .from('carts')
        .update({ quantity: existingCartItem.quantity + 1 })
        .eq('cart_id', existingCartItem.cart_id);

      if (updateError) throw updateError;

    } else {
      // 3B. Jika BELUM ADA: Insert baris baru ke tabel carts
      const { error: insertError } = await supabase
        .from('carts')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1
        });

      if (insertError) throw insertError;
    }

    // 4. Perbarui cache halaman agar jumlah keranjang di Navbar/Beranda ikut ter-refresh
    revalidatePath('/');
    revalidatePath('/cart');

    return { success: true, message: 'Barang berhasil ditambahkan ke keranjang!' };
    
  } catch (error: any) {
    console.error('Gagal tambah keranjang:', error);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}