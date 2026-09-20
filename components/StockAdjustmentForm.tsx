// components/StockAdjustmentForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { adjustStock } from '@/app/actions/inventory';
import { Save, Loader2, X, Plus, Minus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockAdjustmentForm({ products }: { products: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  // Form State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [type, setType] = useState<'in' | 'out'>('out');
  const [reason, setReason] = useState('Barang Rusak');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const filteredProducts = search.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error('Pilih produk terlebih dahulu');
    if (!quantity || Number(quantity) <= 0) return toast.error('Jumlah harus lebih dari 0');

    startTransition(async () => {
      const result = await adjustStock({
        product_id: selectedProduct.product_id,
        type, reason, quantity: Number(quantity), notes
      });

      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
        resetForm();
      } else {
        toast.error(result.message);
      }
    });
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSearch('');
    setQuantity('');
    setNotes('');
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm shadow-sm transition">
        <Plus size={18} /> Penyesuaian Stok (Opname)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Form Stok Opname</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-800 hover:bg-gray-100 p-1.5 rounded-lg"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              
              {/* Cari Produk */}
              {!selectedProduct ? (
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Cari Produk</label>
                  <div className="relative">
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ketik nama atau SKU..." className="w-full pl-9 pr-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                  </div>
                  {filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {filteredProducts.map(p => (
                        <div key={p.product_id} onClick={() => { setSelectedProduct(p); setSearch(''); }} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-800">{p.name}</span>
                          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">Stok: {p.stock}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs text-blue-600 font-bold mb-0.5">Produk Terpilih:</p>
                    <p className="text-sm font-bold text-gray-900">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-500">Stok Saat Ini: {selectedProduct.stock}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedProduct(null)} className="text-xs font-bold text-red-600 hover:underline">Ganti</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Jenis Penyesuaian</label>
                  <select value={type} onChange={(e) => setType(e.target.value as 'in' | 'out')} className="w-full p-2.5 text-gray-700 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer font-bold">
                    <option value="out">(-) Kurangi Stok</option>
                    <option value="in">(+) Tambah Stok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Alasan</label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2.5 text-gray-700 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer">
                    {type === 'out' ? (
                      <>
                        <option value="Barang Rusak">Barang Rusak</option>
                        <option value="Barang Hilang">Barang Hilang</option>
                        <option value="Kadaluarsa">Kadaluarsa / Expired</option>
                        <option value="Selisih Opname">Selisih Opname (Kurang)</option>
                      </>
                    ) : (
                      <>
                        <option value="Retur Pelanggan">Retur Pelanggan (Barang Baik)</option>
                        <option value="Selisih Opname">Selisih Opname (Lebih)</option>
                        <option value="Bonus Supplier">Bonus Supplier</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Jumlah Barang</label>
                <div className="relative">
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="Masukkan angka..." className="w-full pl-10 pr-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" required />
                  <div className="absolute left-3 top-3 text-gray-500">
                    {type === 'out' ? <Minus size={16} className="text-red-500"/> : <Plus size={16} className="text-green-500"/>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Catatan Khusus (Opsional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Misal: Ditemukan rusak di gudang blok A" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isPending || !selectedProduct} className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm">
                  {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Simpan Penyesuaian
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}