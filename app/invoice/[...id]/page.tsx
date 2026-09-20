// app/invoice/[...id]/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { CheckCircle, MapPin, Truck, CreditCard, Home, Package } from 'lucide-react';
import Link from 'next/link';
import PaymentButton from '@/components/PaymentButton';

export const revalidate = 0;

export default async function InvoicePage({ 
  params 
}: { 
  params: Promise<{ id: string[] }> 
}) {
  const resolvedParams = await params;
  const invoiceNumber = decodeURIComponent(resolvedParams.id.join('/'));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      user_addresses (*),
      order_items ( 
        *, 
        products (name) 
      ),
      payments (*),
      shipping (*)
    `)
    .eq('invoice_number', invoiceNumber)
    .eq('user_id', user.id)
    .single();

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <Package size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Invoice Tidak Ditemukan</h1>
        <p className="text-gray-500 mt-2 mb-6">Pesanan dengan nomor {invoiceNumber} tidak ditemukan.</p>
        <Link href="/" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold">Kembali ke Beranda</Link>
      </div>
    );
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(dateStr)) + ' WIB';

  const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  const shipping = Array.isArray(order.shipping) ? order.shipping[0] : order.shipping;

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <div className="bg-white p-8 rounded-t-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pesanan Berhasil Dibuat!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Terima kasih telah berbelanja. Pesanan Anda akan segera diproses.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 shadow-sm border-x border-gray-100 border-t border-dashed border-t-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Nomor Invoice</p>
              <h2 className="text-xl font-bold text-orange-600">{order.invoice_number}</h2>
            </div>
            <div className="md:text-right">
              <p className="text-sm text-gray-500 font-medium">Tanggal Transaksi</p>
              <p className="text-gray-900 font-semibold">{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold">
                <MapPin size={16} className="text-orange-500" /> Alamat Pengiriman
              </div>
              <p className="text-sm text-gray-600 font-semibold">{address?.recipient_name} ({address?.phone_number})</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{address?.street_address}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold">
                <Truck size={16} className="text-orange-500" /> Kurir & Pembayaran
              </div>
              <p className="text-sm text-gray-600 font-semibold">Ekspedisi: {shipping?.courier_name} ({shipping?.service_type})</p>
              <p className="text-sm text-gray-500 mt-1">Metode: {payment?.payment_method}</p>
            </div>
          </div>

          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Rincian Produk</h3>
          <div className="space-y-4 mb-6">
            {/* PERBAIKAN: Menambahkan 'index' sebagai key yang dijamin unik */}
            {order.order_items?.map((item: any, index: number) => {
              const productName = Array.isArray(item.products) ? item.products[0]?.name : item.products?.name;
              return (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-gray-800">{productName}</p>
                    <p className="text-gray-500">{item.quantity} x {formatRupiah(item.price_per_item)}</p>
                  </div>
                  <div className="font-bold text-gray-900 text-right">
                    {formatRupiah(item.total_price)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total Harga Produk</span>
              <span className="font-medium text-gray-800">{formatRupiah(order.subtotal_price)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Ongkos Kirim ({(order.total_weight_gram / 1000).toFixed(1)} kg)</span>
              <span className="font-medium text-gray-800">{formatRupiah(order.shipping_cost)}</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 md:p-8 rounded-b-2xl shadow-sm border border-orange-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-orange-800 font-medium mb-1">Total Tagihan</p>
            <h2 className="text-2xl font-extrabold text-orange-700">{formatRupiah(order.grand_total)}</h2>
          </div>
          
          <div className="flex w-full md:w-auto gap-3">
            <Link 
              href="/"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition"
            >
              <Home size={18} /> Beranda
            </Link>
            {/* PERBAIKAN: Menghapus onClick dari Server Component */}
            <PaymentButton 
              orderId={order.order_id} 
              invoiceNumber={order.invoice_number} 
              currentStatus={order.order_status} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}