// app/actions/profile.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// 1. Update Informasi Profil (Nama & No Telepon)
export async function updateProfile(userId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  let { error } = await supabase
    .from('user_profiles')
    .update({ name, phone })
    .eq('user_id', userId);

  if (error && error.code === '42703') {
    const { error: retryError } = await supabase
      .from('user_profiles')
      .update({ name, phone })
      .eq('id', userId);
    error = retryError;
  }

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

// 2. Tambah Alamat Pengiriman Baru (Menyesuaikan skema tabel user_addresses)
export async function addAddress(userId: string, formData: FormData) {
  const supabase = await createClient();
  const recipient_name = formData.get('recipient_name') as string;
  const phone_number = formData.get('phone_number') as string;
  const city = formData.get('city') as string || '-';
  const province = formData.get('province') as string || '-';
  const postal_code = formData.get('postal_code') as string;
  const street_address = formData.get('street_address') as string;

  const { error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      recipient_name,
      phone_number,
      city,
      province,
      postal_code,
      street_address,
      is_primary: false // Default false
    });

  if (error) {
    console.error("Gagal menambah alamat:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

// 3. Hapus Alamat Pengiriman (Menggunakan address_id sesuai Primary Key tabel)
export async function deleteAddress(addressId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('address_id', addressId);

  if (error) {
    console.error("Gagal menghapus alamat:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}