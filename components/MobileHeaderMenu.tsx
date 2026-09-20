// components/MobileHeaderMenu.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Bell, Menu, X, Home, ShoppingBag, ShoppingCart, User, MessageCircle, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export default function MobileHeaderMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // State untuk jumlah notifikasi
  const router = useRouter();

  // 1. Kunci scroll saat menu terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  // 2. Ambil Jumlah Notifikasi & Aktifkan Supabase Realtime
  useEffect(() => {
    let realtimeChannel: any;

    async function setupNotifications() {
      if (!isLoggedIn) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // A. Ambil jumlah notifikasi saat halaman pertama kali dimuat
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (count !== null) setUnreadCount(count);

      // B. AKTIFKAN REAL-TIME WEBSOCKET (Mendengarkan data baru secara instan)
      realtimeChannel = supabase
        .channel('realtime-notifs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            // Jika ada notif baru masuk untuk user ini, langsung tambah angkanya!
            setUnreadCount((currentCount) => currentCount + 1);
          }
        )
        .subscribe();
    }
    
    setupNotifications();

    // Bersihkan koneksi websocket saat pindah halaman agar memori tidak bocor
    return () => {
      if (realtimeChannel) {
        const supabase = createClient();
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [isLoggedIn]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    toast.success('Berhasil keluar. Sampai jumpa lagi! 👋', {
      duration: 4000,
      style: {
        background: '#10B981',
        color: '#fff',
        borderRadius: '10px',
        fontWeight: '500',
      },
    });
    router.refresh();
  };

  return (
    <>
      {/* 3 Ikon Utama di Header */}
      <div className="flex items-center gap-4 md:hidden text-gray-500">
        <Link href="https://wa.me/628122240693" target="_blank" title="Hubungi Admin" className="hover:text-orange-600 transition">
          <Mail size={20} />
        </Link>
        
        {/* IKON LONCENG DENGAN BADGE ANGKA */}
        <Link href="/notifications" className="relative hover:text-orange-600 transition">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center min-w-[18px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        
        <button onClick={() => setIsOpen(true)} className="hover:text-orange-600 transition active:scale-95">
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay Gelap & Panel Sidebar Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-end md:hidden">
          
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative w-3/4 max-w-[300px] bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-orange-50">
              <span className="font-extrabold text-orange-600 text-lg">Menu Toko</span>
              <button onClick={() => setIsOpen(false)} className="p-1.5 bg-white rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition shadow-sm border border-gray-100">
                <X size={18} />
              </button>
            </div>

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
                <>
                  <Link href="/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-medium transition">
                    <ShoppingBag size={18} className="text-gray-400" /> Riwayat Pesanan
                  </Link>
                  <Link href="/notifications" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 text-gray-700 hover:text-orange-600 font-medium transition">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-gray-400" /> Notifikasi
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </Link>
                </>
              )}
              
              <div className="my-4 border-t border-gray-100"></div>
              
              <Link href="https://wa.me/628122240693" target="_blank" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 text-gray-700 hover:text-green-600 font-medium transition">
                <MessageCircle size={18} className="text-green-500" /> Hubungi Admin (WA)
              </Link>
            </div>

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
      <style dangerouslySetInnerHTML={{__html: `@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}} />
    </>
  );
}