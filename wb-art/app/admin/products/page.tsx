// app/admin/products/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Plus, Edit, Image as ImageIcon } from 'lucide-react';
import DeleteProductButton from '@/components/DeleteProductButton';
import AdminSearchBar from '@/components/AdminSearchBar'; // Import fitur pencarian baru

export const revalidate = 0; 

// Tambahkan searchParams Promise untuk menerima input pencarian
export default async function AdminProductsPage(props: { searchParams: Promise<{ search?: string }> }) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || '';

  const supabase = await createClient();

  // 1. Buat Query Dasar
  let query = supabase
    .from('products')
    .select(`
      product_id,
      name,
      sku,
      price_retail,
      stock,
      is_active,
      categories (name)
    `)
    .order('created_at', { ascending: false });

  // 2. Terapkan Filter Pencarian (Nama ATAU SKU)
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data: products, error } = await query;

  if (error) console.error("Gagal mengambil data produk admin:", error);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER & TOMBOL TAMBAH/IMPORT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola stok, harga, dan katalog gerabah Anda.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/products/import" 
            className="bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2.5 px-4 rounded-lg flex items-center gap-2 transition border border-green-200"
          >
            Import CSV
          </Link>
          <Link 
            href="/admin/products/add" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition shadow-sm"
          >
            <Plus size={18} /> Tambah Produk
          </Link>
        </div>
      </div>

      {/* SEARCH BAR ADMIN (LIVE SEARCH) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <AdminSearchBar />
        
        {/* Info jika sedang memfilter */}
        {search && (
          <span className="text-sm text-gray-500 font-medium">
            Menemukan {products?.length || 0} hasil untuk "{search}"
          </span>
        )}
      </div>

      {/* TABEL PRODUK */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium w-16">Foto</th>
                <th className="px-6 py-4 font-medium">Info Produk</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium">Harga (Retail)</th>
                <th className="px-6 py-4 font-medium text-center">Stok</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {!products || products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {search ? 'Produk atau SKU tidak ditemukan.' : 'Belum ada produk. Silakan tambah produk baru.'}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const catName = Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name;
                  
                  return (
                    <tr key={product.product_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3">
                        <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400">
                          <ImageIcon size={20} />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-bold text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku || '-'}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                          {catName || 'Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-800">
                        {formatRupiah(product.price_retail)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-sm font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right space-x-2 whitespace-nowrap">
                        <Link href={`/admin/products/edit/${product.product_id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition inline-flex items-center justify-center" title="Edit Produk">
                          <Edit size={18} />
                        </Link>
                        <DeleteProductButton productId={product.product_id} />
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}