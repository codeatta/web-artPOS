// app/admin/products/page.tsx
import React from 'react';
import Link from 'next/link';
import { checkAdminAccess } from '@/utils/adminGuard'; 
import { Plus } from 'lucide-react';
import AdminProductTable from '@/components/AdminProductTable'; 

export const revalidate = 0; 

export default async function AdminProductsPage() {
  // 1. Panggil penjaga terpusat untuk mendapatkan queryClient (Bypass RLS)
  const { queryClient } = await checkAdminAccess();

  // 2. Tarik produk dengan kueri relasi yang lebih bersih dan aman dari error nama foreign key
  const { data: products, error } = await queryClient
    .from('products')
    .select(`
      product_id,
      name,
      sku,
      price_retail,
      stock,
      is_active,
      categories (name),
      product_images (image_path, is_primary)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Gagal mengambil data produk admin:", JSON.stringify(error, null, 2));
  }

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

      {/* RENDER TABEL DENGAN PENCARIAN INSTAN */}
      <AdminProductTable initialProducts={products || []} />

    </div>
  );
}