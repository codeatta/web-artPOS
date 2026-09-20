// app/actions/order.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const supabase = await createClient(); // Next.js 15 butuh await

    // 1. Verifikasi Keamanan: Pastikan yang mengakses adalah Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { success: false, message: 'Akses ditolak' };
    }

    // 2. Update status pesanan di database
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('order_id', orderId);

    if (error) throw error;

    // 3. Revalidasi halaman agar UI Admin langsung ter-refresh
    revalidatePath('/admin/orders');
    revalidatePath('/admin'); // Refresh dashboard juga

    return { success: true, message: 'Status berhasil diperbarui' };
  } catch (error: any) {
    console.error('Gagal update status:', error);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
}