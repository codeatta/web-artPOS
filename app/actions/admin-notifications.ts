// app/actions/admin-notifications.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function sendBroadcastNotification(title: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Belum login' };

  // Verifikasi role admin/kasir
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'kasir') {
    return { success: false, message: 'Akses ditolak' };
  }

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // 1. Ambil semua ID pengguna dari tabel user_profiles / auth
  const { data: users, error: userError } = await adminDb.from('user_profiles').select('user_id');

  if (userError || !users || users.length === 0) {
    return { success: false, message: 'Tidak ada pelanggan ditemukan untuk dikirimi notifikasi.' };
  }

  // 2. Buat array data notifikasi untuk semua user
  const notificationsToInsert = users.map((u) => ({
    user_id: u.user_id,
    title,
    message,
    type: 'broadcast'
  }));

  // 3. Masukkan secara massal (bulk insert)
  const { error: insertError } = await adminDb.from('notifications').insert(notificationsToInsert);

  if (insertError) {
    return { success: false, message: insertError.message };
  }

  revalidatePath('/admin/notifications');
  return { success: true, message: `Berhasil mengirim notifikasi ke ${users.length} pelanggan!` };
}

export async function deleteNotification(notificationId: string) {
  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await adminDb.from('notifications').delete().eq('id', notificationId);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/notifications');
  return { success: true };
}