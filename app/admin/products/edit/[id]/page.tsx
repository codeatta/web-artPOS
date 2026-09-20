// app/admin/products/edit/[id]/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { editProductAction } from '@/app/actions/product';
import SubmitFormButton from '@/components/SubmitFormButton';
import ImagePreviewInput from '@/components/ImagePreviewInput'; // Import fitur baru
import { ArrowLeft, FileText, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';

export const revalidate = 0;

// Tambahkan searchParams untuk menangkap notifikasi dari Server Action
export default async function EditProductPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ success?: string }> 
}) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  
  const resolvedSearchParams = await searchParams;
  const isSuccess = resolvedSearchParams.success === 'true'; // Cek apakah ada notif sukses
  
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
  
  const { data: product, error } = await supabase
    .from('products')
    .select('*, product_images!product_images_product_id_fkey (image_path)')
    .eq('product_id', productId)
    .single();

  if (error) console.error("Gagal menarik data produk untuk diedit:", error);
  if (!product) notFound();

  const { data: categories } = await supabase.from('categories').select('*').order('name');
  
  const images = product.product_images || [];
  const currentImage = Array.isArray(images) ? images[0]?.image_path : (images as any)?.image_path;

  return (
    <div className="space-y-6 font-sans max-w-4xl">
      
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
          <p className="text-gray-500 mt-1 text-sm">Perbarui informasi barang atau ubah foto.</p>
        </div>
      </div>

      {/* BANNER NOTIFIKASI SUKSES */}
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
          <CheckCircle2 size={24} className="text-green-600" />
          <div>
            <p className="font-bold text-green-800">Berhasil Disimpan!</p>
            <p className="text-sm text-green-600">Perubahan data produk dan foto telah berhasil diperbarui di sistem.</p>
          </div>
        </div>
      )}

      <form action={editProductAction} className="space-y-6">
        <input type="hidden" name="product_id" value={product.product_id} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h2 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <FileText size={18} className="text-blue-500"/> Info Dasar
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                <input type="text" name="name" defaultValue={product.name} required className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                  <select name="category_id" defaultValue={product.category_id} required className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    {categories?.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Kode Barang)</label>
                  <input type="text" name="sku" defaultValue={product.sku} className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
                <textarea name="description" defaultValue={product.description} rows={4} className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h2 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <DollarSign size={18} className="text-green-500"/> Harga & Stok
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Retail (Rp) *</label>
                  <input type="number" name="price_retail" defaultValue={product.price_retail} required className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Reseller (Rp) *</label>
                  <input type="number" name="price_reseller" defaultValue={product.price_reseller} required className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Tersedia *</label>
                  <input type="number" name="stock" defaultValue={product.stock} required className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berat Aktual (Gram) *</label>
                  <input type="number" name="weight" defaultValue={product.weight_actual_gram} required className="w-full p-2.5 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
            
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="font-bold text-gray-800 border-b pb-2">Update Foto</h2>
              
              {/* KOMPONEN PRATINJAU FOTO YANG BARU KITA BUAT */}
              <ImagePreviewInput currentImage={currentImage} />
              
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
               <h2 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <AlertCircle size={18} className="text-orange-500"/> Status Produk
              </h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="text-gray-700 font-medium">Tampilkan di Katalog Pelanggan</span>
              </label>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <SubmitFormButton label="Simpan Perubahan" />
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}