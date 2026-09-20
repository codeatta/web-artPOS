// app/admin/vouchers/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import VoucherManager from '@/components/VoucherManager';
import { Ticket } from 'lucide-react';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function VouchersPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  await props.searchParams; // Standar Next.js 15
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) redirect('/login');
    
        // 1. CEK ROLE PENGGUNA (Apakah Admin?)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user?.id)
          .single();
      
        const isAdmin = profile?.role === 'admin' || profile?.role === 'kasir';
      
        if (!isAdmin) {
          redirect('/unauthorized');
        }

  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
          <Ticket size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Promo & Diskon</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola kode voucher dan potongan harga untuk kasir dan pelanggan.</p>
        </div>
      </div>

      <VoucherManager initialVouchers={vouchers || []} />

    </div>
  );
}