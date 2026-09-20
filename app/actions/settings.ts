// app/actions/settings.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function updateStoreSettings(payload: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: 'Tidak terotentikasi' };

  // Verifikasi role (opsional, pastikan hanya admin)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin') {
    return { success: false, message: 'Hanya Admin yang dapat mengubah pengaturan.' };
  }

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await adminDb
    .from('store_settings')
    .upsert({ 
      id: 1, 
      store_name: payload.store_name,
      store_phone: payload.store_phone,
      store_address: payload.store_address,
      tax_percentage: payload.tax_percentage,
      payment_methods: payload.payment_methods || '',
      couriers: payload.couriers || '',
      theme_color: payload.theme_color,
      receipt_size: payload.receipt_size,
      receipt_footer: payload.receipt_footer
    });

  if (error) {
    console.error("Gagal simpan pengaturan:", error);
    return { success: false, message: error.message };
  }

  // Refresh semua path agar tema dan nama toko terbaru langsung teraplikasi
  revalidatePath('/', 'layout');
  
  return { success: true };
}