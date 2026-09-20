// app/admin/reports/page.jsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import ExportCsvButton from '@/components/ExportCsvButton';

export const revalidate = 0;

export default async function ReportsPage() {
  const supabase = await createClient();

  // 1. AMBIL DATA PESANAN YANG VALID (Tidak termasuk dibatalkan/belum bayar)
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      order_id, invoice_number, grand_total, created_at, order_status,
      order_items ( product_id, quantity, total_price )
    `)
    .in('order_status', ['paid', 'processing', 'shipped', 'delivered'])
    .order('created_at', { ascending: true });

  // 2. AMBIL SEMUA PRODUK UNTUK ANALISIS STOK
  const { data: products } = await supabase
    .from('products')
    .select('product_id, name, stock');

  // ==========================================
  // KALKULASI 1: TREN PENDAPATAN 6 BULAN TERAKHIR
  // ==========================================
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const currentDate = new Date();
  
  // Siapkan wadah untuk 6 bulan terakhir
  const last6Months: Array<{ key: string; label: string; total: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    last6Months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      total: 0
    });
  }

  let totalRevenueAllTime = 0;

  // Masukkan pendapatan pesanan ke bulan yang tepat
  orders?.forEach(order => {
    totalRevenueAllTime += (order.grand_total || 0);
    const orderDate = new Date(order.created_at);
    const orderKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
    
    const monthIndex = last6Months.findIndex(m => m.key === orderKey);
    if (monthIndex !== -1) {
      last6Months[monthIndex].total += (order.grand_total || 0);
    }
  });

  // Cari nilai tertinggi untuk menyesuaikan tinggi grafik batang
  const maxMonthlyRevenue = Math.max(...last6Months.map(m => m.total), 1); // minimal 1 untuk hindari bagi dengan 0

  // ==========================================
  // KALKULASI 2: ANALISIS PERGERAKAN STOK BARANG
  // ==========================================
  const productPerformance: Record<string, {
    name: string;
    stock: number;
    sold: number;
    revenue: number;
  }> = {};
  
  // Inisialisasi semua produk dengan angka 0
  products?.forEach(p => {
    productPerformance[p.product_id] = { name: p.name, stock: p.stock, sold: 0, revenue: 0 };
  });

  // Hitung berapa banyak tiap produk terjual
  orders?.forEach(order => {
    order.order_items?.forEach(item => {
      if (productPerformance[item.product_id]) {
        productPerformance[item.product_id].sold += item.quantity;
        productPerformance[item.product_id].revenue += item.total_price;
      }
    });
  });

  // Ubah ke array agar bisa diurutkan
  const performanceArray = Object.values(productPerformance);
  
  // Barang Terlaris (Top 5)
  const topSelling = [...performanceArray].sort((a, b) => b.sold - a.sold).slice(0, 5);
  
  // Barang Paling Lambat (Slow Moving) - Stok ada, tapi penjualan paling sedikit
  const slowMoving = [...performanceArray]
    .filter(p => p.stock > 0) // Hanya tampilkan yang stoknya masih nyangkut
    .sort((a, b) => a.sold - b.sold)
    .slice(0, 5);

  // FUNGSI FORMATTING
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      
      {/* HEADER & EXPORT */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Laporan & Analitik</h1>
          <p className="text-gray-500 mt-1 text-sm">Tinjau performa penjualan, tren pendapatan, dan pergerakan stok toko.</p>
        </div>
        <div className="flex items-center gap-3">
           {/* MENGGUNAKAN KOMPONEN EXPORT YANG KITA BUAT */}
           <ExportCsvButton data={orders || []} />
        </div>
      </div>

      {/* METRIK UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">Total Pendapatan Bersih</p>
            <p className="text-3xl font-black text-gray-900">{formatRupiah(totalRevenueAllTime)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">Transaksi Berhasil</p>
            <p className="text-3xl font-black text-gray-900">{orders?.length || 0} <span className="text-sm font-medium text-gray-500">pesanan</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Calendar size={28} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">Bulan Ini</p>
            <p className="text-3xl font-black text-gray-900">{formatRupiah(last6Months[5].total)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAFIK TREN PENDAPATAN (2 KOLOM) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Tren Pendapatan (6 Bulan Terakhir)
          </h2>
          
          <div className="h-64 flex items-end justify-between gap-2 md:gap-4 pt-4 border-b border-gray-200">
            {last6Months.map((month) => {
              // Hitung persentase tinggi batang (maksimal 100%)
              const heightPercent = maxMonthlyRevenue > 0 ? (month.total / maxMonthlyRevenue) * 100 : 0;
              
              return (
                <div key={month.key} className="relative w-full flex flex-col items-center group h-full justify-end">
                  {/* Tooltip Hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                    {formatRupiah(month.total)}
                  </div>
                  
                  {/* Batang Grafik */}
                  <div 
                    className="w-full max-w-[3rem] bg-blue-100 rounded-t-xl relative overflow-hidden group-hover:bg-blue-200 transition"
                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                  >
                    <div className="absolute bottom-0 w-full bg-blue-600 transition-all duration-1000 h-full"></div>
                  </div>
                  
                  {/* Label Bulan */}
                  <div className="mt-3 text-xs font-bold text-gray-500 text-center">
                    {month.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ANALISIS STOK (1 KOLOM) */}
        <div className="space-y-6">
          
          {/* Barang Terlaris */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" /> Barang Terlaris
            </h2>
            <div className="space-y-4">
              {topSelling.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex gap-3 items-center">
                    <span className="font-black text-gray-400 w-4">{idx + 1}.</span>
                    <span className="font-bold text-gray-700 line-clamp-1">{product.name}</span>
                  </div>
                  <span className="font-black text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    {product.sold}x
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Moving / Barang Mati */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingDown size={18} className="text-red-500" /> Slow Moving (Kurang Laku)
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Barang dengan stok menumpuk namun pergerakan penjualannya paling rendah. Pertimbangkan untuk memberi diskon.
            </p>
            <div className="space-y-4">
              {slowMoving.map((product, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-sm p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-700 line-clamp-1">{product.name}</span>
                  <div className="flex justify-between mt-1 text-xs font-semibold">
                    <span className="text-red-600 flex items-center gap-1"><AlertCircle size={12}/> Terjual: {product.sold}</span>
                    <span className="text-gray-500">Sisa Stok: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}