// app/admin/settings/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import SettingsForm from '@/components/SettingsForm';
import { Settings } from 'lucide-react';

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();
  
  // Mengambil baris pengaturan toko (ID 1)
  const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();

  // Fallback data kosong jika tabel terhapus/belum terisi
  const settingsData = data || {
    store_name: '', store_phone: '', store_address: '', tax_percentage: 0,
    payment_methods: '', couriers: ''
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
          <p className="text-gray-500 mt-1 text-sm">Kelola informasi utama yang akan tampil di aplikasi dan cetakan invoice.</p>
        </div>
      </div>

      {/* PANGGIL KOMPONEN FORM */}
      <SettingsForm initialData={settingsData} />
      
    </div>
  );
}