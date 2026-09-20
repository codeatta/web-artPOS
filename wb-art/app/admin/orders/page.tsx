// app/admin/orders/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Impor client khusus admin
import { Clock, Home, Plus, Eye, Printer, AlertCircle } from 'lucide-react';
import AdminOrderStatusSelect from '@/components/AdminOrderStatusSelect'; 
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function AdminOrdersPage(props: { searchParams: Promise<{ search?: string }> }) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || '';
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. CEK ROLE PENGGUNA (Apakah Admin?)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user?.id)
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

  // 3. TARIK SEMUA DATA PESANAN MENGGUNAKAN KLIEN YANG TEPAT
  let query = queryClient
    .from('orders')
    .select(`
      order_id,
      invoice_number,
      order_status,
      grand_total,
      created_at,
      voucher_code,
      discount_amount,
      user_addresses (*),
      shipping (*)
    `)
    .order('created_at', { ascending: false });

  if (search) query = query.ilike('invoice_number', `%${search}%`);

  // Keamanan Ekstra: Jika entah bagaimana non-admin nyasar ke halaman ini, batasi datanya
  if (!isAdmin) {
    query = query.eq('user_id', user?.id);
  }

  const { data: orders, error } = await query;
  if (error) console.error("Gagal mengambil pesanan admin:", error);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pesanan</h1>
          <p className="text-gray-500 mt-1 text-sm">Pantau dan kelola seluruh pesanan masuk, proses, dan pengiriman.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600 transition" title="Kembali ke Dashboard">
             <Home size={20} />
          </Link>
          <Link href="/admin/orders/add" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-2 transition shadow-sm">
             <Plus size={18} /> Tambah Pesanan
          </Link>
        </div>
      </div>

      {/* STATISTIK RINGKAS (6 KOLOM) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 transition hover:shadow-md">
          <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Blm Dibayar</p>
          <p className="text-2xl font-black text-orange-600">{orders?.filter(o => o.order_status === 'pending_payment').length || 0}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 transition hover:shadow-md">
          <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Perlu Diproses</p>
          <p className="text-2xl font-black text-blue-600">{orders?.filter(o => o.order_status === 'paid').length || 0}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 transition hover:shadow-md">
          <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Dikemas</p>
          <p className="text-2xl font-black text-indigo-600">{orders?.filter(o => o.order_status === 'processing').length || 0}</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 transition hover:shadow-md">
          <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Dikirim</p>
          <p className="text-2xl font-black text-purple-600">{orders?.filter(o => o.order_status === 'shipped').length || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 transition hover:shadow-md">
          <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Selesai</p>
          <p className="text-2xl font-black text-green-600">{orders?.filter(o => o.order_status === 'delivered').length || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 transition hover:shadow-md">
          <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Dibatalkan</p>
          <p className="text-2xl font-black text-red-600">{orders?.filter(o => o.order_status === 'cancelled').length || 0}</p>
        </div>
      </div>

      {/* TABEL PESANAN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium">No. Invoice & Tanggal</th>
                <th className="px-6 py-4 font-medium">Pelanggan</th>
                <th className="px-6 py-4 font-medium">Total Tagihan</th>
                <th className="px-6 py-4 font-medium">Status Cepat</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Belum ada pesanan yang masuk.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
                  
                  return (
                    <tr key={order.order_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-blue-600 whitespace-nowrap">{order.invoice_number}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={12} /> {formatDate(order.created_at)}
                        </p>
                      </td>
                      
                      <td className="px-6 py-4">
                        {address?.recipient_name ? (
                          <>
                            <p className="font-semibold text-gray-800 line-clamp-1">{address.recipient_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{address.phone_number || address.street_address || '-'}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                            <AlertCircle size={14} /> Pelanggan / Alamat Tidak Terhubung
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 font-extrabold text-gray-900">
                        {formatRupiah(Number(order.grand_total))}
                      </td>

                      <td className="px-6 py-4 min-w-[180px]">
                        <AdminOrderStatusSelect orderId={order.order_id} currentStatus={order.order_status} />
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        <Link 
                          href={`/admin/orders/${order.order_id}`} 
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded transition"
                        >
                          <Eye size={14} /> Detail
                        </Link>
                        
                        <Link 
                          href={`/admin/orders/${order.order_id}/invoice`} 
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded transition"
                          title="Cetak Invoice"
                        >
                          <Printer size={14} /> Invoice
                        </Link>
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