// app/admin/products/add/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { addProductAction } from '@/app/actions/product';
import SubmitFormButton from '@/components/SubmitFormButton';
import { ArrowLeft, Package, Image as ImageIcon, FileText, DollarSign } from 'lucide-react';

export default async function AddProductPage() {
  const supabase = await createClient();
  
  // Mengambil daftar kategori untuk pilihan Dropdown
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-gray-500 mt-1 text-sm">Lengkapi detail barang untuk ditambahkan ke katalog toko.</p>
        </div>
      </div>

      {/* FORM UPLOAD MENGGUNAKAN SERVER ACTION */}
      <form action={addProductAction} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI (Informasi Utama) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h2 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <FileText size={18} className="text-blue-500"/> Info Dasar
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                <input type="text" name="name" required placeholder="Contoh: Panci Tanah Liat 20cm" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                  <select name="category_id" required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Pilih Kategori...</option>
                    {categories?.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Kode Barang)</label>
                  <input type="text" name="sku" placeholder="Contoh: GRB-PNC-20" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
                <textarea name="description" rows={4} placeholder="Jelaskan keunggulan produk ini..." className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h2 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <DollarSign size={18} className="text-green-500"/> Harga & Stok
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Retail (Rp) *</label>
                  <input type="number" name="price_retail" required min="0" placeholder="50000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Reseller (Rp) *</label>
                  <input type="number" name="price_reseller" required min="0" placeholder="45000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal *</label>
                  <input type="number" name="stock" required min="0" placeholder="100" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berat (Gram) *</label>
                  <input type="number" name="weight" required min="1" placeholder="1000" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (Foto & Submit) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <ImageIcon size={18} className="text-purple-500"/> Foto Utama
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer relative overflow-hidden h-48">
                <input 
                  type="file" 
                  name="image" 
                  accept="image/png, image/jpeg, image/webp" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <ImageIcon size={32} className="text-gray-400 mb-2" />
                <p className="text-sm font-bold text-gray-700">Pilih Foto Produk</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <SubmitFormButton label="Simpan Produk Baru" />
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}