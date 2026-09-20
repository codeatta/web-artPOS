// app/actions/payment.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function simulatePayment(orderId: string, invoiceNumber: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    // 1. Simulasi jeda waktu API Bank (1.5 detik)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Update status Pesanan menjadi Lunas (paid)
    await supabase
      .from('orders')
      .update({ order_status: 'paid' })
      .eq('order_id', orderId)
      .eq('user_id', user.id); // Pastikan hanya pemilik pesanan yg bisa update

    // 3. Update status di tabel Payments
    await supabase
      .from('payments')
      .update({ status: 'success' })
      .eq('order_id', orderId);

    // 4. Refresh halaman
    revalidatePath(`/invoice/${invoiceNumber}`);
    revalidatePath('/orders');
    
    return { success: true };
  } catch (error) {
    console.error('Gagal verifikasi pembayaran:', error);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
}