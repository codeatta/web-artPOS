// components/MobileBottomNav.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Menu, ShoppingCart, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [cartItemCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sembunyikan menu bawah di halaman khusus
  const hiddenRoutes = ['/admin', '/login', '/register', '/checkout', '/orders/finish'];
  const isHidden = hiddenRoutes.some(route => pathname.startsWith(route));

  // Fungsi untuk mengambil jumlah total item di keranjang
  const fetchCartData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setIsLoggedIn(true);
      const { data } = await supabase.from('carts').select('quantity').eq('user_id', user.id);
      if (data) {
        const total = data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } else {
      setIsLoggedIn(false);
      setCartCount(0);
    }
  }, []);

  // Ambil data saat pertama kali dimuat atau rute berubah
  useEffect(() => {
    if (isHidden) return;
    fetchCartData();
  }, [pathname, isHidden, fetchCartData]);

  // SINKRONISASI REAL-TIME: Mendengarkan perubahan tabel 'carts' di database secara instan
  useEffect(() => {
    if (isHidden) return;
    const supabase = createClient();
    let channel: any;

    async function setupRealtimeCart() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('bottom-nav-cart-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'carts', filter: `user_id=eq.${user.id}` },
          () => {
            // Setiap ada penambahan, pengurangan, atau penghapusan item keranjang, 
            // fungsi fetchCartData akan langsung dipanggil secara otomatis!
            fetchCartData();
          }
        )
        .subscribe();
    }

    setupRealtimeCart();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isHidden, fetchCartData]);

  if (isHidden) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 pb-1 z-[9999] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <Link href="/" className={`flex flex-col items-center transition ${pathname === '/' ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}>
        <Store size={22} />
        <span className="text-[10px] font-bold mt-1">Beranda</span>
      </Link>
      
      <Link href="/products" className={`flex flex-col items-center transition ${pathname.startsWith('/products') ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}>
        <Menu size={22} />
        <span className="text-[10px] mt-1 font-medium">Katalog</span>
      </Link>

      <Link href="/cart" className={`flex flex-col items-center transition relative ${pathname === '/cart' ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}>
          <ShoppingCart size={22} />
            {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-in zoom-in">
               {cartItemCount}
            </span>
          )}
          <span className="text-[10px] mt-1 font-medium">Keranjang</span>
      </Link>
      
      <Link href="/profile" className={`flex flex-col items-center transition ${pathname.startsWith('/profile') || pathname.startsWith('/orders') ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'}`}>
        <User size={22} />
        <span className="text-[10px] mt-1 font-medium">{isLoggedIn ? 'Profil' : 'Masuk'}</span>
      </Link>
    </div>
  );
}