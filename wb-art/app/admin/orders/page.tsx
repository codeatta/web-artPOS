// app/admin/orders/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Search, ShoppingBag, Eye, Calendar } from 'lucide-react';
import OrderStatusSelect from '@/components/OrderStatusSelect';

export const revalidate = 0; // Pastikan data tidak di-cache

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  // Fetch daftar pesanan, diurutkan dari yang terbaru
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      order_id,
      invoice_number,
      total_weight_gram,
      grand_total,
      order_status,
      created_at,
      user_profiles ( name, phone )
    `)
    .order('created_at', { ascending: false });

  if (error) console.error('Gagal mengambil pesanan:', error);

  // Fungsi Format Utilities
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateString)) + ' WIB';
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER HALAMAN */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pesanan</h1>
        <p className="text-gray-500 mt-1">Pantau dan kelola proses pengiriman pesanan pelanggan.</p>
      </div>

      {/* 2. FILTER & PENCARIAN */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Cari No. Invoice atau Nama Pelanggan..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg block w-full p-2.5 outline-none">
            <option value="">Semua Status</option>
            <option value="paid">Lunas (Perlu Dikirim)</option>
            <option value="shipped">Sedang Dikirim</option>
          </select>
        </div>
      </div>

      {/* 3. TABEL PESANAN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Invoice & Tanggal</th>
                <th className="px-6 py-4 font-medium">Pelanggan</th>
                <th className="px-6 py-4 font-medium">Total Harga</th>
                <th className="px-6 py-4 font-medium text-center">Status Pesanan</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingBag size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-600">Belum ada pesanan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  // Mengatasi masalah array/object dari relasi Supabase
                  const customerProfile = Array.isArray(order.user_profiles) 
                    ? order.user_profiles[0] 
                    : (order.user_profiles as any);

                  return (
                    <tr key={order.order_id} className="hover:bg-gray-50 transition">
                      
                      {/* Invoice & Tanggal */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-blue-600">{order.invoice_number}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar size={12} /> {formatDate(order.created_at)}
                        </p>
                      </td>
                      
                      {/* Pelanggan */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-800">{customerProfile?.name || 'Anonim'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{customerProfile?.phone || '-'}</p>
                      </td>
                      
                      {/* Grand Total */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{formatRupiah(order.grand_total)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Berat: {(order.total_weight_gram / 1000).toFixed(1)} kg</p>
                      </td>
                      
                      {/* Status Pesanan (Interaktif Component) */}
                      <td className="px-6 py-4">
                        <OrderStatusSelect 
                          orderId={order.order_id} 
                          currentStatus={order.order_status} 
                        />
                      </td>
                      
                      {/* Aksi */}
                      <td className="px-6 py-4 text-center">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition">
                          <Eye size={14} /> Detail
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}