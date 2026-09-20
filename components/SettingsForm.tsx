// components/SettingsForm.jsx
'use client';

import React, { useState, useTransition } from 'react';
import { updateStoreSettings } from '@/app/actions/settings';
import { Store, MapPin, Phone, Percent, CreditCard, Truck, CheckCircle2, Loader2, Save } from 'lucide-react';

export default function SettingsForm({
  initialData,
}: {
  initialData?: Record<string, string | number | null | undefined>;
}) {
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateStoreSettings(formData);
      if (result.success) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert("Gagal menyimpan pengaturan: " + result.message);
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BLOK 1: PROFIL TOKO */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Store size={18} className="text-blue-500"/> Profil Toko (Tampil di Invoice)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Store size={14}/> Nama Toko *</label>
              <input type="text" name="store_name" defaultValue={initialData?.store_name ?? ''} required className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone size={14}/> Nomor Telepon / WA</label>
              <input type="text" name="store_phone" defaultValue={initialData?.store_phone ?? ''} className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><MapPin size={14}/> Alamat Lengkap Toko</label>
            <textarea name="store_address" defaultValue={initialData?.store_address ?? ''} rows={3} className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"></textarea>
          </div>
        </div>

        {/* BLOK 2: PAJAK & PEMBAYARAN */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-green-500"/> Finansial & Pembayaran
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Percent size={14}/> PPN / Pajak (%)</label>
              <input type="number" step="0.1" name="tax_percentage" defaultValue={initialData?.tax_percentage ?? ''} className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" />
              <p className="text-xs text-gray-500 mt-1.5">Isi 0 jika tidak ada pajak.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Metode Pembayaran Tersedia</label>
              <input type="text" name="payment_methods" defaultValue={initialData?.payment_methods ?? ''} placeholder="Pisahkan dengan koma (contoh: Tunai, BCA, OVO)" className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" />
              <p className="text-xs text-gray-500 mt-1.5">Metode ini akan muncul sebagai pilihan saat kasir membuat pesanan.</p>
            </div>
          </div>
        </div>

        {/* BLOK 3: PENGIRIMAN */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Truck size={18} className="text-purple-500"/> Logistik & Pengiriman
          </h2>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Daftar Kurir / Layanan</label>
            <textarea name="couriers" defaultValue={initialData?.couriers ?? ''} rows={2} placeholder="Pisahkan dengan koma (contoh: Kurir Toko, JNE, J&T, Ambil Sendiri)" className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"></textarea>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="flex justify-end sticky bottom-6">
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition shadow-lg shadow-blue-200"
          >
            {isPending ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>

      {/* TOAST NOTIFIKASI */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 border border-green-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300">
          <CheckCircle2 size={24} className="text-white drop-shadow-sm" />
          <div>
            <p className="text-sm font-extrabold tracking-wide">Berhasil Disimpan!</p>
            <p className="text-xs text-green-100 mt-0.5">Pengaturan toko telah diperbarui.</p>
          </div>
        </div>
      )}
    </>
  );
}