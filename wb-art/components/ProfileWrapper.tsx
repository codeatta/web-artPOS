// components/ProfileWrapper.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { User, MapPin, LogOut, Package, Store, ArrowRight, Plus, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { EditProfileModal, AddAddressModal } from '@/components/ProfileModals';
import { deleteAddress } from '@/app/actions/profile';

export default function ProfileWrapper({ user, profile, addresses, signOutAction }: { user: any; profile: any; addresses: any[]; signOutAction: any }) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDeleteAddress = (addressId: string) => {
    if (!window.confirm("Yakin ingin menghapus alamat ini?")) return;
    startTransition(async () => {
      await deleteAddress(addressId);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
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
              
              <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 py-2 rounded-xl font-bold text-sm transition"
              >
                <Edit size={16} /> Edit Profil
              </button>

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

            {/* Kelola Alamat Pengiriman */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <MapPin className="text-orange-500" size={20} /> Alamat Pengiriman
                </h3>
                <button 
                  onClick={() => setIsAddAddressOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus size={14} /> Tambah Alamat
                </button>
              </div>

              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Belum ada alamat pengiriman tersimpan.</p>
                ) : (
                  addresses.map((addr: any) => (
                    <div key={addr.address_id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-start gap-4">
                      <div className="space-y-1 text-sm">
                        <p className="font-bold text-gray-900">{addr.recipient_name} <span className="text-xs font-normal text-gray-500">({addr.phone_number})</span></p>
                        <p className="text-gray-600 leading-relaxed">{addr.street_address}, {addr.city}, {addr.province} {addr.postal_code}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteAddress(addr.address_id)}
                        disabled={isPending}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        title="Hapus Alamat"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TOMBOL KHUSUS ADMIN dan KASIR */}
            {(profile?.role === 'admin' || profile?.role === 'kasir') && (
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

            {/* Riwayat Belanja */}
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

      {/* Modals */}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} user={user} profile={profile} />
      <AddAddressModal isOpen={isAddAddressOpen} onClose={() => setIsAddAddressOpen(false)} userId={user.id} />
    </div>
  );
}