// components/SettingsForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { updateStoreSettings } from '@/app/actions/settings';
import { Store, Palette, Printer, Save, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsForm({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState(initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateStoreSettings(formData);
      if (result.success) {
        toast.success('Pengaturan berhasil disimpan!');
      } else {
        toast.error(result.message || 'Gagal menyimpan pengaturan');
      }
    });
  };

  // Pilihan Tema Warna
  const themes = [
    { id: 'blue', name: 'Biru Profesional', colorCode: 'bg-blue-600' },
    { id: 'orange', name: 'Jingga (TokoART)', colorCode: 'bg-orange-600' },
    { id: 'green', name: 'Hijau Segar', colorCode: 'bg-green-600' },
    { id: 'purple', name: 'Ungu Elegan', colorCode: 'bg-purple-600' }
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* SEKSI 1: INFORMASI TOKO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b pb-3">
          <Store className="text-blue-500" size={20} /> Informasi Dasar Toko
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Toko</label>
            <input type="text" name="store_name" value={formData.store_name} onChange={handleChange} required className="w-full p-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">No. Telepon / WhatsApp</label>
            <input type="text" name="store_phone" value={formData.store_phone} onChange={handleChange} required className="w-full p-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-gray-50 focus:bg-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Alamat Lengkap (Tampil di Struk)</label>
            <textarea name="store_address" value={formData.store_address} onChange={handleChange} rows={3} required className="w-full p-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 resize-none bg-gray-50 focus:bg-white"></textarea>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SEKSI 2: PENGATURAN STRUK POS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b pb-3">
            <Printer className="text-purple-500" size={20} /> Pengaturan Struk & Kasir
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Ukuran Kertas Printer Thermal</label>
              <select name="receipt_size" value={formData.receipt_size} onChange={handleChange} className="w-full p-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-500 cursor-pointer">
                <option value="58mm">Thermal 58mm (Kecil)</option>
                <option value="80mm">Thermal 80mm (Besar/Standar)</option>
                <option value="A4">A4 / Invoice Web</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Pesan Penutup di Bawah Struk</label>
              <textarea name="receipt_footer" value={formData.receipt_footer} onChange={handleChange} rows={2} placeholder="Misal: Barang yang sudah dibeli tidak dapat ditukar." className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-500 resize-none"></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Pajak (PPN %)</label>
              <input type="number" name="tax_percentage" value={formData.tax_percentage} onChange={handleChange} min="0" max="100" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-purple-500" />
            </div>
          </div>
        </div>

        {/* SEKSI 3: TEMA & TAMPILAN */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b pb-3">
            <Palette className="text-orange-500" size={20} /> Tema Aplikasi Utama
          </h2>
          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-700">Pilih Warna Aksen</label>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <div 
                  key={theme.id}
                  onClick={() => setFormData({ ...formData, theme_color: theme.id })}
                  className={`border-2 rounded-xl p-3 cursor-pointer flex items-center gap-3 transition-all ${formData.theme_color === theme.id ? 'border-gray-900 bg-gray-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-6 h-6 rounded-full shadow-sm ${theme.colorCode}`}></div>
                  <span className="text-xs font-bold text-gray-800">{theme.name}</span>
                  {formData.theme_color === theme.id && <CheckCircle2 size={16} className="text-gray-900 ml-auto" />}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              Perubahan tema akan otomatis diterapkan ke tombol, navigasi, dan elemen interaktif lainnya di aplikasi sisi Pelanggan maupun Admin setelah Anda menyimpan.
            </p>
          </div>
        </div>
      </div>

      {/* TOMBOL SIMPAN */}
      <div className="sticky bottom-6 z-10 flex justify-end bg-white p-4 rounded-xl border border-gray-200 shadow-xl">
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition disabled:bg-gray-400"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
          Simpan Pengaturan
        </button>
      </div>

    </form>
  );
}