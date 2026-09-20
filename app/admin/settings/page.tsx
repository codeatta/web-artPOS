// app/admin/settings/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import SettingsForm from '@/components/SettingsForm';
import { Settings } from 'lucide-react';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();
  
  // Proteksi Halaman Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Mengambil baris pengaturan toko (ID 1)
  const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();

  // Fallback data kosong jika tabel terhapus/belum terisi
  const settingsData = data || {
    store_name: '', 
    store_phone: '', 
    store_address: '', 
    tax_percentage: 0,
    payment_methods: '', 
    couriers: '',
    theme_color: 'blue',        // Tema bawaan
    receipt_size: '80mm',       // Kertas POS bawaan
    receipt_footer: ''
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gray-900 text-white rounded-xl shadow-sm">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pengaturan Konfigurasi</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola informasi toko, tampilan aplikasi, dan cetakan struk POS.</p>
        </div>
      </div>

      {/* PANGGIL KOMPONEN FORM */}
      <SettingsForm initialData={settingsData} />
      
    </div>
  );
}