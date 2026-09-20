// app/profile/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { User, MapPin, LogOut, Package, Store, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect ke login jika belum masuk
  if (!user) redirect('/login');

  // Ambil data profil pelanggan
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Server Action untuk tombol Logout
  const signOutAction = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="text-orange-600 flex items-center gap-2 font-bold text-xl mr-auto">
            <Store size={24} /> TokoGerabah
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kolom Kiri: Menu Profil & Logout */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                <User size={40} />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">{profile?.name || 'Pelanggan'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              
              <div className="w-full h-px bg-gray-100 my-4"></div>
              
              <form action={signOutAction} className="w-full">
                <button type="submit" className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2 rounded-lg font-medium transition">
                  <LogOut size={18} /> Keluar Akun
                </button>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Detail & Alamat */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Info Pribadi */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <User className="text-orange-500" size={20} /> Informasi Akun
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Nama Lengkap</p>
                  <p className="font-medium text-gray-900">{profile?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Nomor Telepon</p>
                  <p className="font-medium text-gray-900">{profile?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Tipe Akun</p>
                  <p className="font-medium text-orange-600 uppercase text-xs font-bold px-2 py-1 bg-orange-50 inline-block rounded">
                    {profile?.role || 'Customer'}
                  </p>
                </div>
              </div>
            </div>

            {/* TOMBOL KHUSUS ADMIN (Hanya muncul jika role === 'admin') */}
            {profile?.role === 'admin' && (
              <Link href="/admin" className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 rounded-xl shadow-sm border border-blue-500 hover:shadow-md transition flex items-center justify-between group cursor-pointer text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Store size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Masuk ke Panel Admin</h3>
                    <p className="text-sm text-blue-100">Kelola pesanan, tambah produk, dan pantau statistik toko.</p>
                  </div>
                </div>
                <ArrowRight className="text-blue-200 group-hover:text-white transition group-hover:translate-x-1" />
              </Link>
            )}

            {/* Riwayat Belanja (Shortcut) */}
            <Link href="/orders" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-orange-300 transition flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Daftar Pesanan Saya</h3>
                  <p className="text-sm text-gray-500">Lacak status pengiriman dan riwayat belanja</p>
                </div>
              </div>
              <ArrowRight className="text-gray-400 group-hover:text-orange-500 transition" />
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}