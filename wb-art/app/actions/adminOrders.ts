// app/actions/adminOrders.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient();
  
  // Keamanan ekstra: Pastikan yang melakukan ini adalah admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Unauthorized' };
  
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin') return { success: false, message: 'Unauthorized' };

  // Update status pesanan di database
  const { error } = await supabase
    .from('orders')
    .update({ order_status: newStatus })
    .eq('order_id', orderId);

  if (error) {
    console.error('Gagal update status pesanan:', error);
    return { success: false, message: 'Gagal memperbarui status.' };
  }

  // Refresh tampilan halaman
  revalidatePath('/admin/orders');
  return { success: true };
}