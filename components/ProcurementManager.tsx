// components/ProcurementManager.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { recordStockIn, addSupplier } from '@/app/actions/procurement';
import { PackagePlus, History, Building2, Plus, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProcurementManager({ products, suppliers, initialLogs }: { products: any[], suppliers: any[], initialLogs: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleStockInSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await recordStockIn(formData);
      if (result.success) {
        triggerToast("Stok barang berhasil ditambah!");
        (e.target as HTMLFormElement).reset();
      } else {
        alert("Gagal: " + result.message);
      }
    });
  };

  const handleSupplierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addSupplier(formData);
      if (result.success) {
        triggerToast("Suplier baru berhasil disimpan!");
        (e.target as HTMLFormElement).reset();
      } else {
        alert("Gagal: " + result.message);
      }
    });
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }).format(new Date(dateStr));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* KOLOM KIRI: FORM RESTOCK & TAMBAH SUPLIER */}
      <div className="space-y-6 text-gray-700 lg:col-span-1">
        
        {/* Form Restock Barang Masuk */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-3 flex items-center gap-2 text-sm">
            <PackagePlus size={18} className="text-blue-500" /> Catat Barang Masuk (Restock)
          </h2>

          <form onSubmit={handleStockInSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Produk *</label>
              <select name="product_id" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="">-- Pilih Barang --</option>
                {products?.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name} (Stok: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Suplier *</label>
              <select name="supplier_id" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="">-- Pilih Suplier --</option>
                {suppliers?.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Masuk *</label>
                <input type="number" name="quantity" min="1" required placeholder="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Harga Beli / Satuan</label>
                <input type="number" name="buy_price" placeholder="Rp 0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan / No. Faktur</label>
              <textarea name="notes" rows={2} placeholder="Contoh: Pembelian tunai nota #123" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
            </div>

            <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm text-sm">
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Tambah Stok Barang
            </button>
          </form>
        </div>

        {/* Form Tambah Suplier Baru */}
        <div className="bg-white p-6 rounded-2xl shadow-sm text-gray-700 border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-3 flex items-center gap-2 text-sm">
            <Building2 size={18} className="text-purple-500" /> Tambah Suplier Baru
          </h2>

          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Suplier / Distributor *</label>
              <input type="text" name="name" required placeholder="Contoh: PT Sumber Pangan" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">No. Telepon / Kontak</label>
              <input type="text" name="phone" placeholder="08123456789" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Suplier</label>
              <textarea name="address" rows={2} placeholder="Kota / Alamat gudang" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 resize-none"></textarea>
            </div>

            <button type="submit" disabled={isPending} className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm text-sm">
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Building2 size={18} />} Simpan Suplier
            </button>
          </form>
        </div>

      </div>

      {/* KOLOM KANAN: RIWAYAT BARANG MASUK */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
              <History size={18} className="text-blue-500" /> Riwayat Restock (Barang Masuk Terakhir)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Waktu & Produk</th>
                  <th className="px-6 py-4 font-bold">Suplier</th>
                  <th className="px-6 py-4 font-bold text-center">Jumlah Masuk</th>
                  <th className="px-6 py-4 font-bold text-right">Harga Beli</th>
                  <th className="px-6 py-4 font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!initialLogs || initialLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                      Belum ada riwayat barang masuk dari suplier.
                    </td>
                  </tr>
                ) : (
                  initialLogs.map((log: any) => (
                    <tr key={log.log_id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{log.products?.name || 'Produk Dihapus'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(log.created_at)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                          {log.suppliers?.name || 'Suplier Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 bg-green-50 text-green-700 font-black rounded-lg text-sm">
                          +{log.quantity} pcs
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-gray-900">{formatRupiah(log.buy_price)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 size={24} />
          <p className="text-sm font-extrabold tracking-wide">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}