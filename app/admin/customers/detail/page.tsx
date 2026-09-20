// app/admin/customers/detail/page.jsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Impor Klien Admin
import { redirect } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag,
  TrendingUp,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

export const revalidate = 0;

export default async function CustomerDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; name?: string }>;
}) {
  const params = await searchParams;
  const targetPhone = params.phone;
  const targetName = params.name;
  
  const supabase = await createClient();

  // 1. CEK LOGIN & ROLE
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'kasir';

  if (!isAdmin) {
      redirect('/unauthorized');
    }

  if (!targetPhone && !targetName) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto mt-12">
        <User size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pelanggan Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Data pelanggan tidak lengkap atau URL tidak valid.</p>
        <Link href="/admin/customers" className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition">
          Kembali ke Daftar Pelanggan
        </Link>
      </div>
    );
  }

  // 2. KLIEN BYPASS RLS
  const queryClient = isAdmin 
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    : supabase;

  // 3. TARIK DATA (Ditambah price_retail untuk fallback harga)
  let ordersQuery = queryClient
    .from('orders')
    .select(`
      order_id,
      invoice_number,
      order_status,
      grand_total,
      created_at,
      user_id,
      user_addresses (recipient_name, phone_number, street_address, city, province, postal_code),
      order_items (
        quantity,
        price_at_time,
        products (name, sku, price_retail)
      )
    `)
    .order('created_at', { ascending: false });

  // Keamanan tambahan untuk user non-admin yang "tersesat"
  if (!isAdmin) {
    ordersQuery = ordersQuery.eq('user_id', user.id);
  }

  const { data: rawOrders } = await ordersQuery;

  // Filter berdasarkan nama atau nomor HP (karena POS checkout offline kadang tidak ada user_id)
  const orders = rawOrders?.filter(order => {
    const addr = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
    return addr && (addr.phone_number === targetPhone || addr.recipient_name === targetName);
  }) || [];

  const latestOrder = orders[0];
  const address = latestOrder ? (Array.isArray(latestOrder.user_addresses) ? latestOrder.user_addresses[0] : latestOrder.user_addresses) : null;

  const totalOrders = orders.length;
  // Parsing aman menggunakan Number()
  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);
  const avgSpent = totalOrders > 0 ? totalSpent / totalOrders : 0;
  
  const productCount = new Map();
  orders.forEach(o => {
    o.order_items?.forEach(item => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      const pName = product?.name || 'Produk Dihapus';
      const current = productCount.get(pName) || 0;
      productCount.set(pName, current + Number(item.quantity));
    });
  });
  
  const favoriteProduct = Array.from(productCount.entries()).sort((a, b) => b[1] - a[1])[0];

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
  const formatDateTime = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' }).format(new Date(dateStr));
  
  const waNumber = targetPhone && targetPhone !== '-' ? targetPhone.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href="/admin/customers" className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 transition shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Detail Pelanggan</h1>
          <p className="text-gray-500 text-sm mt-0.5">Riwayat transaksi dan preferensi belanja pelanggan.</p>
        </div>
      </div>

      {/* STRUKTUR UTAMA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* KOLOM KIRI: PROFIL & STATISTIK */}
        <div className="space-y-6 lg:col-span-1 min-w-0">
          
          {/* Kartu Profil */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        <div className="px-6 pb-6 relative">
            
            <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-lg absolute -top-10 left-6 flex items-center justify-center border border-gray-100 z-10">
            <User size={40} className="text-blue-500" />
            </div>
            
            <div className="mt-4 sm:mt-2 pl-0 sm:pl-24 min-h-[4rem] flex flex-col justify-center">
            <h2 className="text-xl font-black text-gray-900 truncate" title={targetName}>{targetName}</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Profil Pelanggan</p>
            </div>

            <div className="mt-6 space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400 shrink-0" /> 
                <span className="font-semibold truncate">{targetPhone || 'Tidak ada nomor'}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" /> 
                <span className="leading-relaxed break-words">
                {address ? `${address.street_address || ''}, ${address.city || ''}, ${address.province || ''} ${address.postal_code || ''}`.replace(/^,\s|,+\s*,/g, '').trim() || 'Alamat tidak lengkap' : 'Alamat tidak diketahui'}
                </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar size={16} className="text-gray-400 shrink-0" /> 
                <span className="truncate">Bergabung sejak <span className="font-bold text-gray-800">{orders.length > 0 ? formatDate(orders[orders.length-1].created_at) : '-'}</span></span>
            </div>
            </div>

            {waNumber && (
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="mt-6 w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2.5 rounded-xl transition border border-green-200">
                <MessageCircle size={18} /> Chat WhatsApp
            </a>
            )}

        </div>
        </div>

          {/* Kartu Metrik Belanja */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <TrendingUp size={18} className="text-purple-500" /> Nilai Pelanggan (LTV)
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Dibelanjakan</p>
                <p className="text-2xl xl:text-3xl font-black text-gray-900 truncate">{formatRupiah(totalSpent)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total Pesanan</p>
                  <p className="text-base font-bold text-gray-800">{totalOrders} <span className="text-xs font-normal text-gray-500">kali</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Rata-rata/Pesanan</p>
                  <p className="text-base font-bold text-gray-800 truncate">{formatRupiah(avgSpent)}</p>
                </div>
              </div>
            </div>

            {favoriteProduct && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Produk Terfavorit</p>
                <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-purple-600 font-black shadow-sm shrink-0">
                    {favoriteProduct[1]}x
                  </div>
                  <p className="text-sm font-bold text-purple-900 line-clamp-2">{favoriteProduct[0]}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: RIWAYAT PESANAN */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-500" /> Riwayat Pembelian ({orders.length})
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Belum ada riwayat transaksi. Pelanggan ini belum melakukan pembelian.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <div key={order.order_id} className="p-6 hover:bg-gray-50 transition group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      <div className="space-y-1 min-w-0">
                        <Link href={`/admin/orders/${order.order_id}`} className="flex items-center gap-2 font-bold text-base md:text-lg text-blue-600 hover:text-blue-800 transition">
                          <span className="truncate">{order.invoice_number}</span> <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </Link>
                        <p className="text-xs md:text-sm text-gray-500">{formatDateTime(order.created_at)}</p>
                        
                        {/* Status Label */}
                        <div className="mt-2">
                          {order.order_status === 'pending_payment' && <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md">Menunggu Pembayaran</span>}
                          {order.order_status === 'paid' && <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">Lunas</span>}
                          {order.order_status === 'processing' && <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md">Diproses</span>}
                          {order.order_status === 'shipped' && <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">Dikirim</span>}
                          {order.order_status === 'delivered' && <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">Selesai</span>}
                          {order.order_status === 'cancelled' && <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md">Dibatalkan</span>}
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-lg md:text-xl font-black text-gray-900">{formatRupiah(Number(order.grand_total))}</p>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">{order.order_items?.length || 0} Macam Barang</p>
                      </div>

                    </div>

                    {/* Rincian Barang Mini */}
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Rincian Barang:</p>
                      <ul className="space-y-2">
                        {order.order_items?.map((item, idx) => {
                           const product = Array.isArray(item.products) ? item.products[0] : item.products;
                           const price = Number(item.price_at_time) || Number(product?.price_retail) || 0;
                           const qty = Number(item.quantity) || 0;

                           return (
                            <li key={idx} className="flex justify-between items-start text-sm gap-4">
                              <div className="flex gap-2 text-gray-700 min-w-0">
                                <span className="font-bold text-gray-900 shrink-0">{qty}x</span> 
                                <span className="truncate">{product?.name || 'Produk Terhapus'}</span>
                              </div>
                              <span className="font-semibold text-gray-600 whitespace-nowrap shrink-0">
                                {formatRupiah(price * qty)}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}