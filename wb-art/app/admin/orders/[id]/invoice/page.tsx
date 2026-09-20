// app/admin/orders/[id]/invoice/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Impor Klien Admin
import { notFound, redirect } from 'next/navigation';
import PrintButton from '@/components/PrintButton';

export const revalidate = 0;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;
  
  const supabase = await createClient();
  
  // 1. CEK LOGIN & ROLE ADMIN
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

  // 2. KLIEN BYPASS RLS
  const queryClient = isAdmin 
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    : supabase;

  // 3. TARIK DATA PESANAN
  const { data: order, error } = await queryClient
    .from('orders')
    .select(`
      *,
      user_addresses (*),
      shipping (*),
      order_items (
        quantity, price_at_time,
        products (name, sku, price_retail)
      )
    `)
    .eq('order_id', orderId)
    .single();

  if (error || !order) notFound();

  const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
  const shipping = Array.isArray(order.shipping) ? order.shipping[0] : order.shipping;
  const items = order.order_items || [];

  // 4. PARSING ANGKA AMAN
  const discountAmount = Number(order.discount_amount) || 0;
  const subtotalPrice = Number(order.subtotal_price) || 0;
  const shippingCost = Number(order.shipping_cost) || 0;
  const grandTotal = Number(order.grand_total) || 0;

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));

  return (
    <div className="bg-white min-h-screen font-sans text-gray-900 selection:bg-blue-100">
      
      <PrintButton />

      {/* SUNTIKAN CSS KHUSUS UNTUK PRINT BERHALAMAN (PAGINATION) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          /* 1. Sembunyikan elemen bawaan secara visual */
          body * {
            visibility: hidden;
          }

          /* 2. Tampilkan khusus bagian invoice */
          #invoice-container, #invoice-container * {
            visibility: visible;
          }

          /* 3. KUNCI PAGINATION: Hapus position absolute! 
             Kita paksa seluruh elemen pembungkus (layout Next.js) menjadi block statis
             sehingga halaman bisa memanjang ke bawah secara natural (multi-page) */
          html, body, main, div:has(#invoice-container) {
            display: block !important;
            position: static !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 4. Sembunyikan tag navigasi/sidebar agar tidak memakan ruang kosong */
          aside, nav, header {
            display: none !important;
          }

          /* 5. Atur ulang container utama invoice */
          #invoice-container {
            width: 100% !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 6. Aturan pemecahan baris tabel (Cegah baris kepotong di tengah teks) */
          table { 
            page-break-inside: auto; 
            width: 100%;
          }
          tr { 
            page-break-inside: avoid; 
            page-break-after: auto; 
          }
          thead { 
            display: table-header-group; /* Header tabel diulang di halaman baru */
          }
          
          /* Blok total harga tidak boleh terpotong antara halaman */
          .flex.justify-end { 
            page-break-inside: avoid; 
          }
        }
      `}} />

      {/* Kertas A4 */}
      <div id="invoice-container" className="max-w-4xl mx-auto p-8 md:p-12 bg-white">
        
        {/* Header Invoice */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">TokoGerabah.</h1>
            <p className="text-gray-500 mt-2 text-sm">Jl. Pengrajin No. 12, Kab. Ponorogo<br/>Jawa Timur, Indonesia 63471</p>
            <p className="text-gray-500 text-sm">WA: 0812-3456-7890</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest mb-2">INVOICE</h2>
            <p className="font-bold text-gray-800">{order.invoice_number}</p>
            <p className="text-sm text-gray-500 mt-1">Tanggal: {formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Info Pelanggan & Pengiriman */}
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Ditagihkan Kepada:</p>
            <p className="font-bold text-gray-800">{address?.recipient_name || 'Pelanggan Offline'}</p>
            <p className="text-sm text-gray-600 mt-1">{address?.phone_number || '-'}</p>
          </div>
          
          <div className="text-right max-w-xs">
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Dikirim Ke:</p>
            {address ? (
              <p className="text-sm text-gray-600 leading-relaxed">
                {address.street_address}<br/>
                {address.city}, {address.province} {address.postal_code}
              </p>
            ) : (
              <p className="text-sm text-gray-600">Alamat tidak tersedia</p>
            )}
          </div>
        </div>

        {/* Tabel Produk */}
        <table className="w-full text-left mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-3 font-bold text-gray-800">Deskripsi Barang</th>
              <th className="py-3 font-bold text-gray-800 text-center w-24">Qty</th>
              <th className="py-3 font-bold text-gray-800 text-right w-32">Harga</th>
              <th className="py-3 font-bold text-gray-800 text-right w-36">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item: any, idx: number) => {
              // Logika Fallback Aman
              const price = Number(item.price_at_time) || Number(item.products?.price_retail) || 0;
              const qty = Number(item.quantity) || 0;
              const itemTotal = price * qty;

              return (
                <tr key={idx}>
                  <td className="py-4">
                    <p className="font-bold text-gray-800">{item.products?.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.products?.sku || '-'}</p>
                  </td>
                  <td className="py-4 text-center">{qty}</td>
                  <td className="py-4 text-right">{formatRupiah(price)}</td>
                  <td className="py-4 text-right font-bold text-gray-900">{formatRupiah(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Kalkulasi Total (Diperbarui dengan Diskon) */}
        <div className="flex justify-end">
          <div className="w-1/2 md:w-1/3 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal Barang</span>
              <span>{formatRupiah(subtotalPrice)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Diskon ({order.voucher_code})</span>
                <span>- {formatRupiah(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600 border-b border-gray-200 pb-3">
              <span>Ongkos Kirim ({shipping?.courier_name || '-'})</span>
              <span>{formatRupiah(shippingCost)}</span>
            </div>
            
            <div className="flex justify-between text-lg font-black text-gray-900 pt-1">
              <span>Total Akhir</span>
              <span>{formatRupiah(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Catatan Bawah */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p className="font-bold text-gray-700 mb-1">Terima kasih atas pesanan Anda!</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan kecuali ada perjanjian sebelumnya.</p>
        </div>

      </div>
    </div>
  );
}