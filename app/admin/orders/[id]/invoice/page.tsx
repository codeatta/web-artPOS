// app/admin/orders/[id]/invoice/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; 
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

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'kasir';

  if (!isAdmin) redirect('/unauthorized');

  // 2. KLIEN BYPASS RLS
  const queryClient = isAdmin 
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    : supabase;

  // 3. TARIK DATA PESANAN, PAYMENTS, & SETTINGS TOKO
  // Kita tarik settings (ID 1) dan detail payment sekaligus
  const [orderRes, settingsRes] = await Promise.all([
    queryClient.from('orders').select(`
      *,
      user_addresses (*),
      shipping (*),
      payments (*),
      order_items (
        quantity, price_at_time,
        products (name, sku, price_retail)
      )
    `).eq('order_id', orderId).single(),
    
    queryClient.from('store_settings').select('*').eq('id', 1).single()
  ]);

  if (orderRes.error || !orderRes.data) notFound();

  const order = orderRes.data;
  const settings = settingsRes.data || {};
  
  const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
  const shipping = Array.isArray(order.shipping) ? order.shipping[0] : order.shipping;
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  const items = order.order_items || [];

  // 4. PARSING ANGKA AMAN
  const discountAmount = Number(order.discount_amount) || 0;
  const subtotalPrice = Number(order.subtotal_price) || 0;
  const shippingCost = Number(order.shipping_cost) || 0;
  const grandTotal = Number(order.grand_total) || 0;
  const cashReceived = Number(payment?.cash_received) || 0;
  const changeAmount = Number(payment?.change_amount) || 0;

  // FORMATTER
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }).format(new Date(dateStr));

  // Tentukan Mode Cetakan
  const receiptSize = settings.receipt_size || 'A4';
  const isThermal = receiptSize === '80mm' || receiptSize === '58mm';

  return (
    <div className={`bg-gray-100 min-h-screen font-sans text-gray-900 selection:bg-blue-100 pb-10 ${isThermal ? 'text-[12px]' : ''}`}>
      
      {/* Tombol Print (Sembunyi saat dicetak) */}
      <PrintButton />

      {/* SUNTIKAN CSS DINAMIS SESUAI UKURAN KERTAS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: ${isThermal ? receiptSize + ' auto' : 'A4'};
            margin: ${isThermal ? '0mm' : '15mm'};
          }
          body * { visibility: hidden; }
          #invoice-container, #invoice-container * { visibility: visible; }
          html, body, main, div:has(#invoice-container) {
            display: block !important;
            position: static !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          aside, nav, header { display: none !important; }
          #invoice-container {
            width: ${isThermal ? receiptSize : '100%'} !important;
            margin: 0 !important;
            padding: ${isThermal ? '5mm' : '0'} !important;
            box-shadow: none !important;
          }
          /* Hilangkan break-line tabel di A4 */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}} />

      {/* KERTAS STRUK / INVOICE */}
      <div 
        id="invoice-container" 
        className={`mx-auto bg-white shadow-xl ${
          isThermal 
            ? 'w-[80mm] p-4 text-xs mt-8' // Tampilan 80mm di browser
            : 'max-w-4xl p-8 md:p-12 mt-8' // Tampilan A4 di browser
        }`}
      >
        
        {/* HEADER */}
        <div className={`border-b-2 border-dashed border-gray-300 pb-4 mb-4 ${isThermal ? 'text-center' : 'flex justify-between items-start'}`}>
          <div>
            <h1 className={`${isThermal ? 'text-xl' : 'text-4xl'} font-black text-gray-900 tracking-tighter uppercase`}>
              {settings.store_name || 'TokoART.'}
            </h1>
            <p className="text-gray-600 mt-1">
              {settings.store_address || 'Jl. Pengrajin No.12, Indonesia'}<br/>
              {settings.store_phone ? `WA: ${settings.store_phone}` : ''}
            </p>
          </div>
          <div className={isThermal ? 'mt-3 pt-3 border-t border-dashed border-gray-200 text-left' : 'text-right'}>
            {!isThermal && <h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest mb-2">INVOICE</h2>}
            <p className="font-bold text-gray-800">{order.invoice_number}</p>
            <p className="text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
            {order.order_status === 'paid' || order.order_status === 'delivered' ? (
              <p className="font-bold text-green-600 mt-1 uppercase text-xs border border-green-600 inline-block px-1">LUNAS</p>
            ) : null}
          </div>
        </div>

        {/* INFO PELANGGAN (Hanya Muncul Penuh di A4) */}
        {!isThermal && (
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Pelanggan:</p>
              <p className="font-bold text-gray-800">{address?.recipient_name || 'Pelanggan POS'}</p>
              <p className="text-sm text-gray-600">{address?.phone_number || '-'}</p>
            </div>
          </div>
        )}

        {/* TABEL / DAFTAR PRODUK */}
        <div className="mb-4">
          {isThermal ? (
            // Layout Thermal (Bukan Tabel, tapi list menyamping)
            <div className="space-y-3">
              {items.map((item: any, idx: number) => {
                const price = Number(item.price_at_time) || Number(item.products?.price_retail) || 0;
                const qty = Number(item.quantity) || 0;
                return (
                  <div key={idx}>
                    <p className="font-bold">{item.products?.name}</p>
                    <div className="flex justify-between text-gray-700 mt-0.5">
                      <span>{qty} x {formatRupiah(price)}</span>
                      <span className="font-bold">{formatRupiah(price * qty)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Layout A4 (Tabel Resmi)
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="py-2 font-bold">Deskripsi Barang</th>
                  <th className="py-2 font-bold text-center w-20">Qty</th>
                  <th className="py-2 font-bold text-right w-28">Harga</th>
                  <th className="py-2 font-bold text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item: any, idx: number) => {
                  const price = Number(item.price_at_time) || Number(item.products?.price_retail) || 0;
                  const qty = Number(item.quantity) || 0;
                  return (
                    <tr key={idx}>
                      <td className="py-3">
                        <p className="font-bold">{item.products?.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.products?.sku || '-'}</p>
                      </td>
                      <td className="py-3 text-center">{qty}</td>
                      <td className="py-3 text-right">{formatRupiah(price)}</td>
                      <td className="py-3 text-right font-bold">{formatRupiah(price * qty)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* KALKULASI TOTAL */}
        <div className={`border-t-2 border-dashed border-gray-300 pt-3 flex ${isThermal ? 'flex-col' : 'justify-end'}`}>
          <div className={isThermal ? 'w-full space-y-1' : 'w-1/2 space-y-2'}>
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotalPrice)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700 font-medium">
                <span>Diskon ({order.voucher_code})</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}

            {shippingCost > 0 && (
              <div className="flex justify-between text-gray-700 pb-1">
                <span>Ongkir {shipping?.courier_name ? `(${shipping.courier_name})` : ''}</span>
                <span>{formatRupiah(shippingCost)}</span>
              </div>
            )}
            
            {/* Grand Total */}
            <div className={`flex justify-between font-black text-gray-900 border-t border-gray-300 pt-1 ${isThermal ? 'text-base mt-1' : 'text-lg mt-2'}`}>
              <span>TOTAL</span>
              <span>{formatRupiah(grandTotal)}</span>
            </div>

            {/* Jika Pembayaran Tunai (POS), Tampilkan Uang & Kembalian */}
            {payment?.payment_method === 'Tunai' && cashReceived > 0 && (
              <>
                <div className="flex justify-between text-gray-700 mt-2">
                  <span>Tunai (Cash)</span>
                  <span>{formatRupiah(cashReceived)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold">
                  <span>Kembali</span>
                  <span>{formatRupiah(changeAmount)}</span>
                </div>
              </>
            )}

            {/* Metode Pembayaran Non-Tunai */}
            {payment?.payment_method !== 'Tunai' && (
              <div className="flex justify-between text-gray-500 text-[11px] mt-2 pt-2 border-t border-gray-100">
                <span>Metode Pembayaran:</span>
                <span className="font-bold uppercase text-gray-700">{payment?.payment_method || '-'}</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER STRUK */}
        <div className={`mt-8 pt-4 border-t-2 border-dashed border-gray-300 text-center text-gray-500 ${isThermal ? 'text-[10px]' : 'text-sm'}`}>
          <p>{settings.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</p>
        </div>

      </div>
    </div>
  );
}