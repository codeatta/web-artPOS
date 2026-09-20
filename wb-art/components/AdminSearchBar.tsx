// components/AdminSearchBar.tsx
'use client';

import React, { useState, useEffect, Suspense, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

function AdminSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('search') || '');
  
  // LOGIKA BARU: Menggunakan transition agar tidak freeze
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
      
      if (keyword.trim()) {
        currentParams.set('search', keyword.trim());
      } else {
        currentParams.delete('search'); 
      }
      
      // Bungkus router.push dengan startTransition!
      startTransition(() => {
        router.push(`/admin/products?${currentParams.toString()}`);
      });
      
    }, 400);

    return () => clearTimeout(timer);
  }, [keyword, router, searchParams]);

  return (
    <div className="relative flex-1 max-w-md">
      <input 
        type="text" 
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Cari nama produk atau kode SKU..." 
        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
      />
      
      {/* Ubah ikon menjadi spinner biru jika sedang mencari di latar belakang */}
      {isPending ? (
        <Loader2 className="absolute left-3 top-2.5 text-blue-500 animate-spin" size={18} />
      ) : (
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      )}
    </div>
  );
}

export default function AdminSearchBar() {
  return (
    <Suspense fallback={<div className="flex-1 max-w-md h-9 bg-gray-100 rounded-lg animate-pulse"></div>}>
      <AdminSearchInput />
    </Suspense>
  );
}