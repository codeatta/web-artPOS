// app/admin/staff/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import StaffManager from '@/components/StaffManager';
import { ShieldCheck } from 'lucide-react';

export const revalidate = 0;

export default async function StaffPage() {
  const supabase = await createClient();

 // Hanya ambil akun yang jabatannya admin, kasir, atau reseller
  const { data: staffs } = await supabase
    .from('user_profiles')
    .select('*')
    .neq('role', 'customer') // Sembunyikan semua customer dari daftar staf
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Staf & Hak Akses</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola akun karyawan dan batasi akses sesuai jabatan mereka.</p>
        </div>
      </div>

      <StaffManager staffs={staffs || []} />

    </div>
  );
}