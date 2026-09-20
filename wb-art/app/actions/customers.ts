// app/actions/customers.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// =========================================================================
// 1. FUNGSI BARU: TARIK DATA PELANGGAN & PESANAN BYPASS RLS UNTUK ADMIN
// =========================================================================
export async function getAdminCustomersData() {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Ambil semua pesanan dan alamatnya tanpa terblokir RLS
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select(`
      order_id, grand_total, created_at,
      user_addresses (recipient_name, phone_number, city, street_address)
    `)
    .order('created_at', { ascending: false });

  // Ambil semua profil pelanggan
  const { data: profiles } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('role', 'customer');

  return { 
    orders: orders || [], 
    profiles: profiles || [] 
  };
}

// =========================================================================
// 2. TAMBAH PELANGGAN MANUAL
// =========================================================================
export async function addCustomer(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;

  // Menggunakan crypto.randomUUID() untuk menghasilkan ID unik tabel
  const { error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: crypto.randomUUID(), 
      name: name,
      phone: phone,
      role: 'customer'
    });

  if (error) {
    // Fallback jika kolom primary key bernama 'id'
    const { error: retryError } = await supabase
      .from('user_profiles')
      .insert({
        id: crypto.randomUUID(),
        name: name,
        phone: phone,
        role: 'customer'
      });

    if (retryError) {
      console.error("Gagal menambah pelanggan:", retryError);
      return { success: false, message: retryError.message };
    }
  }

  revalidatePath('/admin/customers');
  return { success: true };
}

// =========================================================================
// 3. UPDATE PELANGGAN
// =========================================================================
export async function updateCustomer(userId: string, name: string, phone: string) {
  const supabase = await createClient();

  // Coba update dengan kolom 'user_id'
  let { error } = await supabase
    .from('user_profiles')
    .update({ name, phone })
    .eq('user_id', userId);

  // Fallback jika kolom primary key bernama 'id'
  if (error && error.code === '42703') {
    const { error: retryError } = await supabase
      .from('user_profiles')
      .update({ name, phone })
      .eq('id', userId);
    error = retryError;
  }

  if (error) {
    console.error("Gagal update pelanggan:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/customers');
  return { success: true };
}

// =========================================================================
// 4. HAPUS PELANGGAN
// =========================================================================
export async function deleteCustomer(userId: string) {
  const supabase = await createClient();

  let { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', userId);

  if (error && error.code === '42703') {
    const { error: retryError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);
    error = retryError;
  }

  if (error) {
    console.error("Gagal menghapus pelanggan:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/customers');
  return { success: true };
}

// =========================================================================
// 5. MANAJEMEN AUTENTIKASI PELANGGAN (RESET PASSWORD / VERIFIKASI)
// =========================================================================
export async function adminManageCustomerAuth(userId: string, newPassword?: string, verifyEmail?: boolean) {
  if (!userId) {
    return { success: false, message: 'ID Pelanggan tidak valid atau belum terdaftar sebagai akun sistem.' };
  }

  const updateData: { password?: string; email_confirm?: boolean } = {};

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Jika admin memasukkan password baru (min. 6 karakter)
  if (newPassword && newPassword.trim().length > 0) {
    if (newPassword.length < 6) {
      return { success: false, message: 'Password baru minimal harus 6 karakter.' };
    }
    updateData.password = newPassword;
  }

  // Jika opsi verifikasi email dicentang
  if (verifyEmail) {
    updateData.email_confirm = true;
  }

  // Eksekusi pembaruan ke Supabase Auth
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);

  if (error) {
    console.error("Gagal mengelola akun auth pelanggan:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/customers');
  return { success: true };
}