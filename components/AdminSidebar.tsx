// components/AdminSidebar.tsx
'use client'; 

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; 
import NewOrderNotification from '@/components/NewOrderNotification';
import { 
  LayoutDashboard, ShoppingCart, Package, Users,
  BarChart3, LogOut, Shield, Settings, Tags, Bell,
  Menu, X // <-- Tambahkan ikon Menu dan X
} from 'lucide-react';

export default function AdminSidebar({ 
  role, 
  userName, 
  initial, 
  children 
}: { 
  role: string; 
  userName: string; 
  initial: string; 
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  // State untuk mengontrol buka/tutup sidebar di Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tutup sidebar otomatis setiap kali pindah halaman di Mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const allNavItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pesanan', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Produk', href: '/admin/products', icon: Package },
    { name: 'Kategori', href: '/admin/products/categories', icon: Tags },
    { name: 'Pelanggan', href: '/admin/customers', icon: Users },
    { name: 'Staff', href: '/admin/staff', icon: Shield },
    { name: 'Voucher', href: '/admin/vouchers', icon: Tags },
    { name: 'Pengadaan', href: '/admin/procurement', icon: Package },
    { name: 'Notifikasi', href: '/admin/notifications', icon: Bell },
    { name: 'Laporan', href: '/admin/reports', icon: BarChart3 },
    { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
  ];

  // Filter menu berdasarkan hak akses
  const navItems = role === 'admin' 
    ? allNavItems 
    : allNavItems.filter(item => !['Laporan', 'Pengaturan', 'Staff', 'Pengadaan', 'Notifikasi'].includes(item.name));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh(); 
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* OVERLAY GELAP (Hanya muncul di Mobile saat sidebar terbuka) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-blue-600">POS System</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Halo, {userName} <span className="font-bold text-gray-700">({role.toUpperCase()})</span>
            </p>
          </div>
          {/* Tombol Tutup (Hanya di Mobile) */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin' 
              ? pathname === '/admin' 
              : pathname.startsWith(item.href);

            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition ${
                  isActive 
                    ? 'text-blue-700 bg-blue-50' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
      <main className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-10">
          
          <div className="flex items-center gap-4">
            {/* Tombol Menu Hamburger (Hanya di Mobile) */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">Panel Manajemen</h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium hidden sm:block">{userName}</span>
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              {initial}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
          <NewOrderNotification />
          {children}
        </div>
      </main>
      
    </div>
  );
}