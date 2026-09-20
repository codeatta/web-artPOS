// components/AdminSearchBar.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

function AdminSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('search') || '');

  // Logika Debounce: Update URL otomatis saat admin berhenti mengetik (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
      
      if (keyword.trim()) {
        currentParams.set('search', keyword.trim());
      } else {
        currentParams.delete('search'); // Hapus param jika kotak kosong
      }
      
      // Dorong ke URL baru (Tabel server akan otomatis memuat ulang data)
      router.push(`/admin/products?${currentParams.toString()}`);
    }, 400);

    return () => clearTimeout(timer); // Reset timer jika admin masih mengetik
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
      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
    </div>
  );
}

// Dibungkus Suspense untuk keamanan build Next.js
export default function AdminSearchBar() {
  return (
    <Suspense fallback={<div className="flex-1 max-w-md h-9 bg-gray-100 rounded-lg animate-pulse"></div>}>
      <AdminSearchInput />
    </Suspense>
  );
}