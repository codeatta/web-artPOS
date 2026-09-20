// app/admin/products/add/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { addProductAction } from '@/app/actions/product';
import { redirect } from 'next/navigation';
import SubmitFormButton from '@/components/SubmitFormButton';
import ImageInput from '@/components/ImageInput'; // <-- Import komponen preview foto
import { ArrowLeft, FileText, DollarSign, Image as ImageIcon } from 'lucide-react';

export default async function AddProductPage() {
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
  
  // Mengambil daftar kategori untuk pilihan Dropdown
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Link href="/admin/products" className="p-2.5 bg-gray-50 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tambah Produk Baru</h1>
          <p className="text-gray-500 text-sm mt-0.5">Lengkapi detail barang untuk ditambahkan ke katalog toko.</p>
        </div>
      </div>

      {/* FORM UPLOAD MENGGUNAKAN SERVER ACTION */}
      <form action={addProductAction} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI (Informasi Utama) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                <FileText size={18} className="text-blue-500"/> Informasi Dasar
              </h2>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Produk *</label>
                <input type="text" name="name" required placeholder="Contoh: Panci Tanah Liat 20cm" className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Kategori *</label>
                  <select name="category_id" required className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
                    <option value="">Pilih Kategori...</option>
                    {categories?.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">SKU (Kode Barang)</label>
                  <input type="text" name="sku" placeholder="Contoh: GRB-PNC-20" className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition uppercase" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Deskripsi Produk</label>
                <textarea name="description" rows={4} placeholder="Jelaskan keunggulan produk ini..." className="w-full text-gray-700 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"></textarea>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                <DollarSign size={18} className="text-green-500"/> Harga & Manajemen Stok
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Harga Retail (Rp) *</label>
                  <input type="number" name="price_retail" required min="0" placeholder="50000" className="w-full text-gray-900 font-medium p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Harga Reseller (Rp) *</label>
                  <input type="number" name="price_reseller" required min="0" placeholder="45000" className="w-full text-gray-900 font-medium p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Stok Awal *</label>
                  <input type="number" name="stock" required min="0" placeholder="100" className="w-full text-gray-900 font-medium p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Berat Aktual (Gram) *</label>
                  <input type="number" name="weight" required min="1" placeholder="1000" className="w-full text-gray-900 font-medium p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (Foto & Submit) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                <ImageIcon size={18} className="text-purple-500"/> Foto Utama
              </h2>
              
              {/* KOMPONEN PREVIEW FOTO DIMASUKKAN DI SINI */}
              <ImageInput />
              
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Pastikan semua data bertanda bintang (*) sudah terisi dengan benar sebelum menyimpan produk.
              </p>
              <SubmitFormButton label="Simpan Produk" />
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}