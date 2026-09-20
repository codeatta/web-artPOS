// components/SearchBar.tsx
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, PackageSearch } from 'lucide-react';
import { liveSearchProducts } from '@/app/actions/search';

function SearchInput({ placeholder, basePath }: { placeholder: string, basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [keyword, setKeyword] = useState(searchParams.get('search') || '');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Format Uang untuk hasil pencarian instan
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // 1. Logika Debounce (Mencari otomatis setelah berhenti mengetik 300ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (keyword.trim().length >= 2) {
        setIsSearching(true);
        const fetchedResults = await liveSearchProducts(keyword);
        setResults(fetchedResults);
        setIsOpen(true);
        setIsSearching(false);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300); // Tunggu 300 milidetik

    return () => clearTimeout(timer); // Hapus timer jika user masih mengetik
  }, [keyword]);

  // 2. Tutup dropdown jika user mengklik di luar area pencarian
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Eksekusi Pencarian (Tekan Enter atau Klik Hasil)
  const executeSearch = (searchQuery: string) => {
    setIsOpen(false);
    const currentParams = new URLSearchParams(Array.from(searchParams.entries()));
    if (searchQuery.trim()) {
      currentParams.set('search', searchQuery.trim());
    } else {
      currentParams.delete('search');
    }
    router.push(`${basePath}?${currentParams.toString()}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(keyword);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* KOTAK INPUT */}
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-gray-100 border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm transition"
          autoComplete="off"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        
        {/* Ikon Loading Berputar saat mencari */}
        {isSearching && (
          <div className="absolute right-3 top-2.5 text-orange-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
      </form>

      {/* KOTAK DROPDOWN HASIL (Melayang) */}
      {isOpen && (keyword.trim().length >= 2) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          
          {results.length === 0 && !isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center gap-1">
              <PackageSearch size={24} className="text-gray-300" />
              <span>Tidak menemukan "{keyword}"</span>
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {results.map((product) => {
                const primaryImg = product.product_images?.find((img: any) => img.is_primary)?.image_path 
                  || product.product_images?.[0]?.image_path 
                  || '/placeholder.jpg';

                return (
                  <li key={product.product_id} className="border-b border-gray-50 last:border-0">
                    <button 
                      type="button"
                      onClick={() => {
                        setKeyword(product.name);
                        executeSearch(product.name);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition text-left"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={primaryImg} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs font-extrabold text-orange-600 mt-0.5">{formatRupiah(product.price_retail)}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
              
              {/* Tombol Lihat Semua Hasil */}
              <li className="bg-gray-50 p-2">
                <button 
                  type="button"
                  onClick={() => executeSearch(keyword)}
                  className="w-full text-center text-xs font-bold text-orange-600 hover:text-orange-700 py-1"
                >
                  Lihat semua hasil untuk "{keyword}" &rarr;
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchBar({ placeholder = "Cari panci, pot bunga, cobek...", basePath = "/products" }) {
  return (
    <Suspense fallback={<div className="w-full h-9 bg-gray-100 rounded-lg animate-pulse"></div>}>
      <SearchInput placeholder={placeholder} basePath={basePath} />
    </Suspense>
  );
}