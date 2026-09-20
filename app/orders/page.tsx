// app/orders/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, Clock, CheckCircle, Truck, XCircle, ChevronRight, Store } from 'lucide-react';

export const revalidate = 0;

export default async function CustomerOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      order_id,
      invoice_number,
      grand_total,
      order_status,
      created_at,
      order_items (
        quantity,
        products (name, product_images (image_path, is_primary))
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) console.error("Gagal mengambil data pesanan:", error);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));

  const getStatusUI = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return { label: 'Belum Bayar', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock size={14} /> };
      case 'paid':
        return { label: 'Sudah Dibayar', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle size={14} /> };
      case 'processing':
        return { label: 'Diproses', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <Package size={14} /> };
      case 'shipped':
        return { label: 'Dikirim', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Truck size={14} /> };
      case 'delivered':
        return { label: 'Selesai', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={14} /> };
      case 'cancelled':
        return { label: 'Dibatalkan', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock size={14} /> };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <Link className="text-gray-400 hover:text-orange-600 transition p-2 bg-white rounded-full shadow-sm border border-gray-100" href="/profile">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Pesanan</h1>
        </div>

        {/* DAFTAR PESANAN */}
        <div className="space-y-4">
          {!orders || orders.length === 0 ? (
            <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <Store className="text-gray-200 mb-4" size={64} />
              <h2 className="text-xl font-bold text-gray-800">Belum Ada Pesanan</h2>
              <p className="text-gray-500 mt-2 mb-6">Sepertinya Anda belum pernah melakukan transaksi di toko kami.</p>
              <Link className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-lg transition shadow-md" href="/">
                Mulai Belanja
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const statusUI = getStatusUI(order.order_status);
              
              const firstItem = order.order_items?.[0] as any;
              const product = Array.isArray(firstItem?.products) ? firstItem.products[0] : firstItem?.products;
              const primaryImgObj = product?.product_images?.find((img: any) => img.is_primary);
              const imagePath = primaryImgObj ? primaryImgObj.image_path : (product?.product_images?.[0]?.image_path || '/placeholder.jpg');
              
              const otherItemsCount = (order.order_items?.length || 1) - 1;

              return (
                <div key={order.order_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200">
                  
                  <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                        <Package className="text-gray-400" size={16} />
                        {formatDate(order.created_at)}
                      </span>
                      <span className="hidden sm:inline-block text-gray-300">|</span>
                      <span className="text-sm font-bold text-orange-600 hidden sm:inline-block">
                        {order.invoice_number}
                      </span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 text-xs font-bold ${statusUI.color}`}>
                      {statusUI.icon} {statusUI.label}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePath} alt={product?.name || 'Produk'} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 line-clamp-1">{product?.name || 'Produk Tidak Diketahui'}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {firstItem?.quantity} barang 
                          {otherItemsCount > 0 && <span className="text-gray-400 italic"> (+{otherItemsCount} produk lainnya)</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:items-end border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 mt-3 sm:mt-0">
                      <p className="text-sm text-gray-500 mb-1">Total Belanja</p>
                      <p className="font-extrabold text-gray-900 text-lg">{formatRupiah(order.grand_total)}</p>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                    <Link 
                      className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg transition" 
                      href={`/invoice/${order.invoice_number}`}
                    >
                      Lihat Detail Pesanan <ChevronRight size={16} />
                    </Link>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}