// components/VoucherManager.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { addVoucher, deleteVoucher } from '@/app/actions/vouchers';
import { Ticket, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

type Voucher = {
  voucher_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  is_active: boolean;
};

export default function VoucherManager({ initialVouchers }: { initialVouchers: Voucher[] }) {
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addVoucher(formData);
      if (result.success) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        (e.target as HTMLFormElement).reset();
      } else {
        alert("Gagal membuat voucher: " + result.message);
      }
    });
  };

  const handleDelete = (id: string, code: string) => {
    if (!window.confirm(`Yakin ingin menghapus voucher "${code}"?`)) return;

    startTransition(async () => {
      const result = await deleteVoucher(id);
      if (!result.success) alert(result.message);
    });
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* FORM TAMBAH VOUCHER */}
      <div className="bg-white p-6 rounded-2xl text-gray-700 shadow-sm border border-gray-100 h-fit">
        <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Ticket size={18} className="text-blue-500"/> Buat Voucher Baru
        </h2>

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kode Voucher</label>
            <input 
              type="text" 
              name="code" 
              required 
              placeholder="Contoh: PROMO50" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl uppercase text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipe Diskon</label>
            <select 
              name="discount_type" 
              required 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="percentage">Persentase (%)</option>
              <option value="fixed">Nominal Tetap (Rp)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nilai Diskon</label>
            <input 
              type="number" 
              step="any" 
              name="discount_value" 
              required 
              placeholder="Contoh: 10 (untuk 10%) atau 50000 (untuk Rp 50rb)" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Minimum Belanja (Opsional)</label>
            <input 
              type="number" 
              name="min_purchase" 
              defaultValue={0} 
              placeholder="0" 
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Simpan Voucher
          </button>
        </form>
      </div>

      {/* DAFTAR VOUCHER */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Daftar Voucher Aktif</h2>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4 font-bold">Kode</th>
              <th className="px-6 py-4 font-bold">Nilai Diskon</th>
              <th className="px-6 py-4 font-bold">Min. Belanja</th>
              <th className="px-6 py-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialVouchers.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada voucher tersedia.</td></tr>
            ) : (
              initialVouchers.map((v) => (
                <tr key={v.voucher_id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg tracking-wider">{v.code}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">
                    {v.discount_type === 'percentage' ? `${v.discount_value}%` : formatRupiah(v.discount_value)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {v.min_purchase > 0 ? formatRupiah(v.min_purchase) : 'Tanpa Minimum'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(v.voucher_id, v.code)} 
                      disabled={isPending}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition"
                      title="Hapus Voucher"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={24} />
          <div>
            <p className="text-sm font-extrabold tracking-wide">Voucher Berhasil Dibuat!</p>
          </div>
        </div>
      )}
    </div>
  );
}