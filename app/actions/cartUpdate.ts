// app/actions/cartUpdate.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCartItem(cartId: string, action: 'increase' | 'decrease' | 'remove', currentQty: number) {
  const supabase = await createClient();

  try {
    if (action === 'remove' || (action === 'decrease' && currentQty <= 1)) {
      // Hapus barang jika user menekan tombol hapus atau mengurangi saat qty = 1
      await supabase.from('carts').delete().eq('cart_id', cartId);
    } else {
      // Tambah atau kurangi quantity
      const newQty = action === 'increase' ? currentQty + 1 : currentQty - 1;
      await supabase.from('carts').update({ quantity: newQty }).eq('cart_id', cartId);
    }

    // Refresh halaman beranda dan keranjang
    revalidatePath('/cart');
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Gagal update keranjang:', error);
    return { success: false };
  }
}