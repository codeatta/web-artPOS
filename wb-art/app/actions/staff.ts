// app/actions/staff.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Gunakan Service Role Key untuk bypass keamanan (HANYA BOLEH DI SERVER)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

export async function addStaff(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const phone = formData.get('phone') as string || '-';

  // 1. Buat user di sistem Auth Supabase (Bypass konfirmasi email)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Langsung aktif
  });

  if (authError) {
    console.error("Gagal buat auth:", authError);
    return { success: false, message: authError.message };
  }

  // 2. Simpan atau Timpa (Upsert) profil dan role-nya ke tabel user_profiles
  if (authData.user) {
    // PERBAIKAN: Gunakan UPSERT. Jika baris sudah dibuat oleh Trigger Supabase, 
    // sistem akan otomatis mengubah mode menjadi UPDATE tanpa menyebabkan error duplikat.
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: authData.user.id,
        name: name,
        phone: phone,
        role: role
      }, { onConflict: 'user_id' }); // Cegah duplikat pada kolom user_id

    if (profileError) {
      // Fallback cerdas jika nama kolom Anda ternyata 'id'
      if (profileError.code === '42703' || profileError.code === '42P10') {
        const { error: retryError } = await supabaseAdmin
          .from('user_profiles')
          .upsert({
            id: authData.user.id,
            name: name,
            phone: phone,
            role: role
          }, { onConflict: 'id' });

        if (retryError) {
          // Rollback: Hapus akun Auth jika benar-benar gagal
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          return { success: false, message: retryError.message };
        }
      } else {
        // Rollback: Hapus akun Auth jika benar-benar gagal
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.error("Gagal buat profil:", profileError);
        return { success: false, message: profileError.message };
      }
    }
  }

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function deleteStaff(userId: string) {
  // 1. Coba hapus dari sistem Auth (Mesin Login)
  await supabaseAdmin.auth.admin.deleteUser(userId);
  
  // 2. PAKSA hapus dari tabel profil agar namanya hilang dari layar Dashboard
  let { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('user_id', userId);

  // 3. Fallback cerdas jika nama kolom Anda ternyata 'id'
  if (profileError && profileError.code === '42703') {
    const { error: retryError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId);
      
    profileError = retryError;
  }

  if (profileError) {
    console.error("Gagal menghapus dari tabel profil:", profileError);
    return { success: false, message: profileError.message };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function updateStaff(userId: string, name: string, role: string) {
  // 1. Percobaan Pertama
  let { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ name: name, role: role })
    .eq('user_id', userId);

  // 2. Percobaan Kedua: Jika gagal karena nama kolom berbeda (Error 42703)
  if (error && error.code === '42703') {
    const { error: retryError } = await supabaseAdmin
      .from('user_profiles')
      .update({ name: name, role: role })
      .eq('id', userId); // Diperbaiki: Ubah jadi 'id' bukan 'user_id' lagi
      
    error = retryError;
  }

  if (error) {
    console.error("Gagal update staf:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function resetStaffPassword(userId: string, newPass: string) {
  if (!newPass || newPass.length < 6) {
    return { success: false, message: 'Password baru minimal harus 6 karakter.' };
  }

  // Paksa ubah password pengguna berdasarkan ID-nya
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPass,
  });

  if (error) {
    console.error("Gagal mereset password:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}