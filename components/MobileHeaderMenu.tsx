// components/MobileHeaderMenu.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Bell, Menu, X, Home, ShoppingBag, ShoppingCart, User, MessageCircle, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function MobileHeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Mencegah scroll pada background saat menu terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      {/* 3 Ikon Utama di Header */}
      <div className="flex items-center gap-4 md:hidden text-gray-500">
        <Link href="https://wa.me/6281234567890" target="_blank" title="Hubungi Admin" className="hover:text-orange-600 transition">
          <Mail size={20} />
        </Link>
        <Link href="/notifications" className="hover:text-orange-600 transition">
          <Bell size={20} />
        </Link>
        <button onClick={() => setIsOpen(true)} className="hover:text-orange-600 transition active:scale-95">
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay Gelap & Panel Sidebar Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-end md:hidden">
          
          {/* Backdrop Gelap (Bisa diklik untuk menutup) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Panel Menu Putih */}
          <div className="relative w-3/4 max-w-[300px] bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
            
            {/* Header Sidebar */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-orange-50">
              <span className="font-extrabold text-orange-600 text-lg">Menu Toko</span>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 bg-white rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition shadow-sm border border-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* List Navigasi */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-medium transition">
                <Home size={18} className="text-gray-400" /> Beranda
              </Link>
              <Link href="/products" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-medium transition">
                <ShoppingBag size={18} className="text-gray-400" /> Katalog Produk
              </Link>
              <Link href="/cart" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-medium transition">
                <ShoppingCart size={18} className="text-gray-400" /> Keranjang Saya
              </Link>
              
              {isLoggedIn && (
                <Link href="/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-medium transition">
                  <ShoppingBag size={18} className="text-gray-400" /> Riwayat Pesanan
                </Link>
              )}
              
              <div className="my-4 border-t border-gray-100"></div>
              
              <Link href="https://wa.me/6281234567890" target="_blank" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 text-gray-700 hover:text-green-600 font-medium transition">
                <MessageCircle size={18} className="text-green-500" /> Hubungi Admin (WA)
              </Link>
            </div>

            {/* Area Bawah (Tombol Auth) */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
              {isLoggedIn ? (
                <>
                  <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition">
                    <User size={18} /> Profil Saya
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-gray-600 p-3 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">
                    <LogOut size={18} /> Keluar
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white p-3 rounded-xl font-bold shadow-md shadow-orange-200 hover:bg-orange-700 transition">
                  <User size={18} /> Masuk / Daftar
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tambahan animasi CSS khusus untuk komponen ini */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  );
}