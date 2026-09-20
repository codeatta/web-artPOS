// app/admin/page.tsx
import React from 'react';
import { TrendingUp, PackageSearch, Users, Clock, ShoppingCart } from 'lucide-react';
// 1. PERBAIKAN IMPORT: Gunakan createClient dari file server
import { createClient } from '@/utils/supabase/server';

export const revalidate = 0; // Agar halaman selalu mengambil data terbaru (tidak di-cache)

export default async function DashboardPage() {
  // 2. INISIALISASI SUPABASE: Wajib menggunakan await di Next.js 15
  const supabase = await createClient();

  // FUNGSI FORMATTING
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }).format(date) + ' WIB';
  };

  // FETCH DATA DARI SUPABASE
  // Mengambil 5 pesanan terbaru beserta nama pelanggan (JOIN ke tabel user_profiles)
  const { data: recentOrders, error } = await supabase
    .from('orders')
    .select(`
      order_id,
      invoice_number,
      grand_total,
      order_status,
      created_at,
      user_profiles ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Gagal mengambil data pesanan:", error);
  }

  // Mengambil hitungan jumlah pesanan (Statistik Dasar)
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ringkasan Bisnis</h1>
        <p className="text-gray-500 mt-1">Pantau aktivitas toko gerabah Anda hari ini.</p>
      </div>

      {/* STAT CARDS (Hanya Jumlah Pesanan yang dikonversi jadi dinamis, sisanya dummy visual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Pendapatan (Dummy)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(15450000)}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pesanan</p>
              {/* Data Dinamis dari Database */}
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalOrders || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Produk</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">128</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <PackageSearch size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pelanggan</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">1,042</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Users size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* TABEL PESANAN TERBARU (Data Asli dari Database) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Pesanan Terbaru</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Lihat Semua</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Invoice</th>
                <th className="px-6 py-4 font-medium">Pelanggan</th>
                <th className="px-6 py-4 font-medium">Waktu</th>
                <th className="px-6 py-4 font-medium text-right">Total Nominal</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* Jika data kosong */}
              {!recentOrders || recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              ) : (
                /* Looping data asli dari Supabase */
                recentOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{order.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {/* Mengatasi inferensi tipe Array dari TypeScript */}
                      {Array.isArray(order.user_profiles) 
                        ? order.user_profiles[0]?.name 
                        : (order.user_profiles as any)?.name || 'User Tidak Diketahui'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm flex items-center gap-1">
                      <Clock size={14} /> {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">
                      {formatRupiah(order.grand_total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${order.order_status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                        ${order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' : ''}
                        ${order.order_status === 'pending_payment' ? 'bg-orange-100 text-orange-700' : ''}
                        ${order.order_status === 'delivered' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {order.order_status === 'paid' && 'Lunas (Perlu Kirim)'}
                        {order.order_status === 'shipped' && 'Dikirim'}
                        {order.order_status === 'pending_payment' && 'Menunggu Bayar'}
                        {order.order_status === 'delivered' && 'Selesai'}
                      </span>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}