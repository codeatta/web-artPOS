// app/admin/products/categories/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CategoryManager from '@/components/CategoryManager';
import { ArrowLeft, Package, Tags } from 'lucide-react';

export const revalidate = 0;

// Sesuai standar Next.js 15: searchParams harus di-await (Promise) meskipun tidak wajib dipakai
export default async function CategoriesPage(props) {
  await props.searchParams; // Selesaikan promise untuk standar Next.js 15
  
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

  // Mengambil daftar kategori dan mengurutkannya secara alfabet (A-Z)
  const { data: categories, error } = await supabase
    .from('categories')
    .select('category_id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error("Gagal mengambil data kategori:", error);
  }

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2.5 bg-gray-50 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Manajemen Kategori
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Atur pengelompokan produk toko Anda.</p>
          </div>
        </div>
        
        <Link href="/admin/products" className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition flex items-center gap-2">
          <Package size={16} /> Kembali ke Produk
        </Link>
      </div>

      {/* PANGGIL KOMPONEN MANAGER */}
      <CategoryManager initialCategories={categories || []} />

    </div>
  );
}