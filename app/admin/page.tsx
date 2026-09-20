// app/admin/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Impor client khusus admin
import { redirect } from 'next/navigation';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  Receipt,
  AlertCircle
} from 'lucide-react';

export const revalidate = 0; // Pastikan data selalu up-to-date setiap kali halaman dimuat

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. CEK ROLE PENGGUNA (Apakah Admin?)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'kasir';

  if (!isAdmin) {
    redirect('/unauthorized');
  }

  // 2. SIAPKAN KLIEN DATABASE (Bypass RLS untuk Admin)
  const queryClient = isAdmin 
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    : supabase;

  // 3. AMBIL DATA UNTUK STATISTIK MENGGUNAKAN queryClient
  
  // Ambil total pesanan
  let totalOrdersQuery = queryClient.from('orders').select('*', { count: 'exact', head: true });
  if (!isAdmin) totalOrdersQuery = totalOrdersQuery.eq('user_id', user.id);
  const { count: totalOrders } = await totalOrdersQuery;

  // Ambil pesanan yang perlu diproses (status: paid atau processing)
  let pendingOrdersQuery = queryClient
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('order_status', ['paid', 'processing']);
  if (!isAdmin) pendingOrdersQuery = pendingOrdersQuery.eq('user_id', user.id);
  const { count: pendingOrders } = await pendingOrdersQuery;

  // Ambil total produk (Biasanya katalog publik, tidak perlu filter user)
  const { count: totalProducts } = await queryClient
    .from('products')
    .select('*', { count: 'exact', head: true });

  // Ambil total pendapatan (Hanya dari pesanan yang sudah dikirim/selesai)
  let revenueQuery = queryClient
    .from('orders')
    .select('grand_total')
    .in('order_status', ['shipped', 'delivered']);
  if (!isAdmin) revenueQuery = revenueQuery.eq('user_id', user.id);
  const { data: revenueData } = await revenueQuery;
    
  const totalRevenue = revenueData?.reduce((sum, order) => sum + (Number(order.grand_total) || 0), 0) || 0;

  // 4. AMBIL 5 PESANAN TERBARU UNTUK TABEL MINI
  let recentOrdersQuery = queryClient
    .from('orders')
    .select(`
      order_id, 
      invoice_number, 
      grand_total, 
      order_status, 
      created_at, 
      user_addresses (recipient_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!isAdmin) recentOrdersQuery = recentOrdersQuery.eq('user_id', user.id);
  const { data: recentOrders } = await recentOrdersQuery;

  // 5. FUNGSI FORMATTING
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

  return (
    <div className="space-y-8 font-sans">
      
      {/* HEADER DASHBOARD */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Selamat datang kembali! Berikut adalah ringkasan bisnis Anda hari ini.</p>
      </div>

      {/* 1. KARTU STATISTIK (METRICS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Kartu Pendapatan */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 font-medium mb-1">Total Pendapatan</p>
              <h3 className="text-2xl font-bold">{formatRupiah(totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl"><TrendingUp size={24} /></div>
          </div>
        </div>

        {/* Kartu Total Pesanan */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-gray-500 font-medium mb-1">Total Pesanan</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalOrders || 0}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShoppingCart size={24} /></div>
        </div>

        {/* Kartu Perlu Diproses */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-start relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-500 font-medium mb-1">Perlu Diproses</p>
            <h3 className="text-2xl font-bold text-gray-900">{pendingOrders || 0}</h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl relative z-10"><Clock size={24} /></div>
          {/* Aksen visual jika ada pesanan menumpuk */}
          {(pendingOrders || 0) > 0 && <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-orange-100 rounded-full blur-2xl"></div>}
        </div>

        {/* Kartu Total Produk */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-gray-500 font-medium mb-1">Katalog Produk</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalProducts || 0}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={24} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. TABEL PESANAN TERBARU (MENGISI 2 KOLOM) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Receipt size={20} className="text-blue-600"/> Pesanan Terbaru
            </h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition">
              Lihat Semua <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Invoice</th>
                  <th className="px-6 py-3 font-medium">Pelanggan</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!recentOrders || recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Belum ada pesanan masuk.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
                    return (
                      <tr key={order.order_id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders/${order.order_id}`} className="font-bold text-gray-900 hover:text-blue-600 transition">
                            {order.invoice_number}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {address?.recipient_name || 'Pelanggan Offline'}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                          {formatRupiah(Number(order.grand_total))}
                        </td>
                        <td className="px-6 py-4">
                          {order.order_status === 'pending_payment' && <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md">Menunggu</span>}
                          {order.order_status === 'paid' && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">Lunas</span>}
                          {order.order_status === 'processing' && <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md">Diproses</span>}
                          {order.order_status === 'shipped' && <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">Dikirim</span>}
                          {order.order_status === 'delivered' && <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Selesai</span>}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. AKSI CEPAT & INFORMASI (MENGISI 1 KOLOM) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-3">
              <Link href="/admin/orders/add" className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-bold transition group">
                <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                Buat Pesanan POS
              </Link>
              <Link href="/admin/products/add" className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-800 text-gray-700 hover:text-white rounded-xl font-bold transition group">
                <Package size={20} className="group-hover:scale-110 transition-transform" />
                Tambah Produk Baru
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-indigo-900 mb-1">Tips Hari Ini</h3>
                <p className="text-sm text-indigo-700/80 leading-relaxed">
                  Jangan lupa mencetak label pengiriman atau invoice melalui halaman detail pesanan untuk setiap transaksi offline yang baru saja Anda buat.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}