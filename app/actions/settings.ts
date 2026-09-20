// app/actions/settings.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateStoreSettings(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('store_settings')
    .upsert({
      id: 1, // Kita selalu menimpa baris ID 1 karena ini pengaturan global tunggal
      store_name: formData.get('store_name'),
      store_phone: formData.get('store_phone'),
      store_address: formData.get('store_address'),
      tax_percentage: parseFloat(String(formData.get('tax_percentage') || 0)),
      payment_methods: formData.get('payment_methods'),
      couriers: formData.get('couriers'),
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Gagal menyimpan pengaturan:", error);
    return { success: false, message: error.message };
  }

  // Refresh halaman pengaturan agar data terbaru langsung muncul
  revalidatePath('/admin/settings');
  return { success: true };
}