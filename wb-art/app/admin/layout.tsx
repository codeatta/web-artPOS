// app/admin/layout.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server'; 
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // 1. CEK LOGIN
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. CEK PROFIL & HAK AKSES (Menggunakan kolom 'user_id' dan 'name' yang valid)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, name')
    .eq('user_id', user.id)
    .single();

  const fetchedRole = profile?.role || user.user_metadata?.role || 'customer';
  const role = fetchedRole.toLowerCase();

  // Jika bukan admin dan bukan kasir, usir ke unauthorized
  if (role !== 'admin' && role !== 'kasir') {
    redirect('/unauthorized');
  }

  // 3. SIAPKAN DATA VISUAL UNTUK SIDEBAR
  const userName = profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staf Toko';
  const initial = userName.charAt(0).toUpperCase();

  // 4. KIRIM DATA KE KOMPONEN KLIEN
  return (
    <AdminSidebar role={role} userName={userName} initial={initial}>
      {children}
    </AdminSidebar>
  );
}