// app/admin/customers/page.jsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { deleteCustomer, getAdminCustomersData } from '@/app/actions/customers';
import CustomerModal from '@/components/CustomerModal';
import CustomerAuthModal from '@/components/CustomerAuthModal';
import { 
  Users, Home, Search, Phone, MapPin, ShoppingBag, 
  TrendingUp, MessageCircle, KeyRound, Clock, UserPlus, Edit2, Trash2
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ totalCustomers: 0, avgSpent: 0, activeCustomers: 0 });
  const [loading, setLoading] = useState(true);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isPending, startTransition] = useTransition();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTargetCustomer, setAuthTargetCustomer] = useState(null);

  // KODE PENGECEKAN ROLE TELAH DIHAPUS DARI SINI
  // Keamanan sudah dijamin 100% oleh app/admin/layout.tsx di latar belakang!

  // Fungsi untuk mengambil dan menggabungkan data dari server
  const fetchData = async () => {
    setLoading(true);

    try {
      // PANGGIL SERVER ACTION (Bypass RLS otomatis)
      const { orders, profiles: registeredCustomers } = await getAdminCustomersData();

      const customersMap = new Map();
      let totalRevenue = 0;

      // Masukkan dari tabel profil dulu
      registeredCustomers?.forEach(cust => {
        const key = cust.phone || cust.name;
        if (key) {
          customersMap.set(key, {
            user_id: cust.user_id || cust.id,
            name: cust.name || 'Tanpa Nama',
            phone: cust.phone || '-',
            city: '-',
            address: '-',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: cust.created_at || new Date().toISOString()
          });
        }
      });

      // Gabungkan dengan riwayat pesanan
      orders?.forEach(order => {
        const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
        if (!address) return;

        const customerKey = address.phone_number || address.recipient_name;
        if (!customerKey) return;

        if (!customersMap.has(customerKey)) {
          customersMap.set(customerKey, {
            user_id: null, // Pelanggan dari checkout langsung
            name: address.recipient_name || 'Pelanggan Offline',
            phone: address.phone_number || '-',
            city: address.city || 'Tidak diketahui',
            address: address.street_address || '-',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.created_at
          });
        }

        const customer = customersMap.get(customerKey);
        customer.totalOrders += 1;
        customer.totalSpent += (Number(order.grand_total) || 0); // Diubah ke Number() agar aman
        totalRevenue += (Number(order.grand_total) || 0);

        if (address.city) customer.city = address.city;
        if (address.street_address) customer.address = address.street_address;
        
        if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
          customer.lastOrderDate = order.created_at;
        }
      });

      let list = Array.from(customersMap.values());
      list.sort((a, b) => b.totalSpent - a.totalSpent);

      setCustomers(list);

      // Statistik
      const totalC = list.length;
      const avgS = totalC > 0 ? totalRevenue / totalC : 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeC = list.filter(c => new Date(c.lastOrderDate) >= thirtyDaysAgo).length;

      setStats({ totalCustomers: totalC, avgSpent: avgS, activeCustomers: activeC });
    } catch (error) {
      console.error("Gagal memuat data pelanggan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler Hapus
  const handleDelete = (userId, name) => {
    if (!userId) {
      alert("Pelanggan ini berasal dari riwayat pesanan otomatis dan tidak memiliki profil terdaftar untuk dihapus.");
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus pelanggan "${name}"?`)) return;

    startTransition(async () => {
      const result = await deleteCustomer(userId);
      if (result.success) {
        fetchData(); // Refresh data
      } else {
        alert("Gagal menghapus: " + result.message);
      }
    });
  };

  // Filter pencarian
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) || 
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Pelanggan</h1>
          <p className="text-gray-500 mt-1 text-sm">Pantau loyalitas pelanggan, riwayat transaksi, dan kelola data member.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600 transition" title="Kembali ke Dashboard">
             <Home size={20} />
          </Link>
          <button 
            onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition shadow-sm text-sm"
          >
             <UserPlus size={18} /> Tambah Pelanggan
          </button>
        </div>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Total Pelanggan</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalCustomers}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Rata-Rata Belanja</p>
            <p className="text-2xl font-black text-gray-900">{formatRupiah(stats.avgSpent)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl"><Clock size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-0.5">Aktif (30 Hari)</p>
            <p className="text-2xl font-black text-gray-900">{stats.activeCustomers} <span className="text-sm font-medium text-gray-500">orang</span></p>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor HP, atau kota..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium text-gray-800"
          />
        </div>
        <div className="text-sm font-semibold text-gray-500">
          Menampilkan <span className="text-blue-600">{filteredCustomers.length}</span> pelanggan
        </div>
      </div>

      {/* TABEL PELANGGAN */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-bold">Informasi Pelanggan</th>
                <th className="px-6 py-4 font-bold">Lokasi</th>
                <th className="px-6 py-4 font-bold text-center">Total Transaksi</th>
                <th className="px-6 py-4 font-bold text-right">Total Belanja</th>
                <th className="px-6 py-4 font-bold">Terakhir Aktif</th>
                <th className="px-6 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Memuat data pelanggan...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-700">Tidak ada pelanggan ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition group">
                    
                    <td className="px-6 py-4">
                      <Link href={`/admin/customers/detail?phone=${encodeURIComponent(customer.phone)}&name=${encodeURIComponent(customer.name)}`} className="font-bold text-blue-600 hover:text-blue-800 transition hover:underline">
                        {customer.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <Phone size={12} /> {customer.phone}
                      </p>
                    </td>
                    
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400"/> {customer.city}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{customer.address}</p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-sm">
                        {customer.totalOrders}x
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="font-black text-gray-900">{formatRupiah(customer.totalSpent)}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-700">{formatDate(customer.lastOrderDate)}</p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Tombol WhatsApp */}
                        {customer.phone && customer.phone !== '-' && (
                          <a 
                            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}

                        {/* Tombol Edit (Hanya jika terdaftar di profil) */}
                        {customer.user_id && (
                          <button 
                            onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }}
                            className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition"
                            title="Edit Pelanggan"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        {/* Tombol Kelola Auth */}
                        {customer.user_id && (
                        <button 
                            onClick={() => { setAuthTargetCustomer(customer); setAuthModalOpen(true); }}
                            className="p-2 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg transition"
                            title="Kelola Akun (Reset Password / Verifikasi Email)"
                        >
                            <KeyRound size={16} />
                        </button>
                        )}

                        {/* Tombol Hapus */}
                        {customer.user_id && (
                          <button 
                            onClick={() => handleDelete(customer.user_id, customer.name)}
                            disabled={isPending}
                            className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                    
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* MODAL KELOLA AKUN */}
        <CustomerAuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        customer={authTargetCustomer} 
        />

        {/* MODAL TAMBAH / EDIT */}
        <CustomerModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); fetchData(); }} 
            customerToEdit={selectedCustomer} 
        />
      
    </div>
  );
}