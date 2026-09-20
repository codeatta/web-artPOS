// app/admin/layout.tsx
'use client'; // Wajib untuk interaktivitas tombol dan membaca rute URL aktif

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // Menggunakan client browser
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  LogOut
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Daftar menu navigasi agar lebih mudah di-loop dan dikelola
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pesanan', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Produk', href: '/admin/products', icon: Package },
    { name: 'Pelanggan', href: '/admin/customers', icon: Users },
  ];

  // Fungsi Logika Keluar (Logout)
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    
    // Alihkan ke halaman login dan refresh state aplikasi
    router.push('/login');
    router.refresh(); 
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-700">
            Gerabah<span className="text-gray-800">Admin</span>
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Cek apakah menu ini sedang aktif (berada di halaman yang tepat)
            // Logika khusus untuk '/admin' agar tidak selalu menyala di sub-rute lain
            const isActive = item.href === '/admin' 
              ? pathname === '/admin' 
              : pathname.startsWith(item.href);

            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition ${
                  isActive 
                    ? 'text-blue-700 bg-blue-50' // Style saat Aktif
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Style Inaktif
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} /> 
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 rounded-lg font-medium transition text-left"
          >
            <LogOut size={20} /> Keluar
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Panel Manajemen</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium hidden sm:block">Admin Toko</span>
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              A
            </div>
          </div>
        </header>

        {/* Halaman dinamis akan di-render di sini */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}