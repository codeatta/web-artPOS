// app/admin/orders/[id]/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; 
import { ArrowLeft, MapPin, Package, Truck, Printer, Save, Ticket, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import AdminMidtransButton from '@/components/AdminMidtransButton';
import { revalidatePath } from 'next/cache';

export const revalidate = 0;

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;
  const supabase = await createClient();

  // 1. CEK LOGIN DAN ROLE
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const hasStaffAccess = profile?.role === 'admin' || profile?.role === 'kasir';

  // 2. SIAPKAN KLIEN DATABASE (Bypass RLS untuk Staf)
  const queryClient = hasStaffAccess 
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    : supabase;

  // 3. Tarik Data Pesanan Lengkap (+ ditambah relasi ke tabel payments)
  const { data: order, error } = await queryClient
    .from('orders')
    .select(`
      *,
      user_addresses (*),
      shipping (*),
      payments (*),
      order_items (
        quantity, price_at_time,
        products (name, sku, price_retail)
      )
    `)
    .eq('order_id', orderId)
    .single();

  if (error) {
    console.error("Gagal menarik detail pesanan:", JSON.stringify(error, null, 2));
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Terjadi Error Database</h1>
        <p className="text-gray-700">Silakan periksa Terminal/CMD Anda untuk melihat detail errornya.</p>
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }

  if (!order) notFound();

  // 4. PARSING OBJEK AMAN UNTUK RENDER TAMPILAN
  const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
  const shipping = Array.isArray(order.shipping) ? order.shipping[0] : order.shipping;
  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  const items = order.order_items || [];
  
  // PARSING ANGKA AMAN
  const discountAmount = Number(order.discount_amount) || 0;
  const subtotalPrice = Number(order.subtotal_price) || 0;
  const shippingCost = Number(order.shipping_cost) || 0;
  const grandTotal = Number(order.grand_total) || 0;

  // EKSTRAKSI PRIMITIF UNTUK SERVER ACTION
  const currentShippingId = shipping?.shipping_id || null;
  const currentOrderStatus = order.order_status;
  const defaultResi = shipping?.tracking_number || '';

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // ====================================================================
  // SERVER ACTION 1: UPDATE RESI
  // ====================================================================
  async function updateShippingResi(formData: FormData) {
    'use server';
    const resi = formData.get('tracking_number') as string;
    
    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    
    if (currentShippingId) {
      await adminDb.from('shipping').update({ tracking_number: resi }).eq('shipping_id', currentShippingId);
    } else if (resi) {
      await adminDb.from('shipping').insert({
        order_id: orderId, courier_name: 'Kurir Eksternal', tracking_number: resi, shipping_cost: shippingCost, status: 'shipped'
      });
    }
    
    if (resi && currentOrderStatus !== 'delivered' && currentOrderStatus !== 'cancelled') {
      await adminDb.from('orders').update({ order_status: 'shipped' }).eq('order_id', orderId);
    }
    revalidatePath(`/admin/orders/${orderId}`);
  }

  // ====================================================================
  // SERVER ACTION 2: KONFIRMASI PEMBAYARAN MANUAL (TRANSFER)
  // ====================================================================
  async function confirmManualPayment() {
    'use server';
    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // 1. Ubah status order menjadi 'paid' (Lunas)
    await adminDb.from('orders').update({ order_status: 'paid' }).eq('order_id', orderId);
    
    // 2. Ubah status di tabel payments menjadi 'success'
    if (payment) {
      await adminDb.from('payments').update({ status: 'success', paid_at: new Date().toISOString() }).eq('payment_id', payment.payment_id);
    } else {
      // Jika karena alasan tertentu baris payment belum ada, buat baru
      await adminDb.from('payments').insert({
        order_id: orderId, payment_method: 'Manual/Transfer', status: 'success', paid_at: new Date().toISOString()
      });
    }

    revalidatePath(`/admin/orders/${orderId}`);
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 transition shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 leading-none">Detail Pesanan</h1>
              
              {/* Badge Status */}
              {currentOrderStatus === 'pending_payment' && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Belum Bayar</span>}
              {currentOrderStatus === 'paid' && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Lunas (Perlu Diproses)</span>}
              {currentOrderStatus === 'shipped' && <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Dikirim</span>}
              {currentOrderStatus === 'delivered' && <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Selesai</span>}
            </div>
            <p className="text-gray-500 mt-2 text-sm font-medium">{order.invoice_number}</p>
          </div>
        </div>
        
        {/* Tombol Cetak */}
        <Link 
          href={`/admin/orders/${orderId}/invoice`}
          target="_blank"
          className="bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition border border-gray-200 shadow-sm whitespace-nowrap"
        >
          <Printer size={18} /> Cetak Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* BAGIAN KIRI: DAFTAR BARANG & TOTAL */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2 text-sm">
              <Package size={18} className="text-orange-500" /> Barang yang Dibeli
            </h2>
            
            <div className="space-y-4">
              {items.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">Data barang tidak ditemukan.</p>
              ) : (
                items.map((item: any, idx: number) => {
                  const price = Number(item.price_at_time) || Number(item.products?.price_retail) || 0;
                  const qty = Number(item.quantity) || 0;
                  const itemTotal = price * qty;

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0 gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 truncate">{item.products?.name || 'Produk Dihapus'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {item.products?.sku || '-'} | Qty: {qty}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Harga Satuan: {formatRupiah(price)}</p>
                      </div>
                      <p className="font-bold text-gray-900 whitespace-nowrap sm:text-right">
                        {formatRupiah(itemTotal)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rincian Subtotal & Voucher */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Barang</span>
                <span>{formatRupiah(subtotalPrice)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Ticket size={14} /> Diskon ({order.voucher_code})
                  </span>
                  <span>- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 pb-2">
                <span>Ongkos Kirim</span>
                <span>{formatRupiah(shippingCost)}</span>
              </div>
              
              <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
                <span>Total Tagihan</span>
                <span className="text-orange-600">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN KANAN: INFO PEMBAYARAN, PENGIRIMAN & EDIT RESI */}
        <div className="space-y-6">
          
          {/* INFO PEMBAYARAN (BARU) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2 text-sm">
              <CreditCard size={18} className="text-green-500" /> Informasi Pembayaran
            </h2>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-bold text-gray-900">{payment?.payment_method || 'Midtrans / Gateway'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold ${payment?.status === 'success' ? 'text-green-600' : 'text-orange-500'}`}>
                  {payment?.status === 'success' ? 'Berhasil' : 'Pending'}
                </span>
              </div>
              
              {/* Jika Pembayaran Tunai (POS) */}
              {payment?.payment_method === 'Tunai' && payment?.cash_received > 0 && (
                <div className="pt-2 mt-2 border-t border-gray-50 space-y-1">
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span className="font-medium text-gray-900">{formatRupiah(payment.cash_received)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembalian:</span>
                    <span className="font-medium text-gray-900">{formatRupiah(payment.change_amount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Konfirmasi Manual (Jika Transfer/Pending) */}
            {payment?.status !== 'success' && (
              <div className="mt-5 space-y-3">
              <form action={confirmManualPayment} className="mt-5">
                <div className="bg-orange-50 p-3 rounded-lg flex gap-3 items-start mb-3 border border-orange-100">
                  <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-800">
                    Jika pelanggan menggunakan Transfer Bank manual, pastikan dana sudah masuk ke rekening sebelum menekan tombol di bawah.
                  </p>
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm">
                  <CheckCircle2 size={18} /> Konfirmasi Pembayaran
                </button>
              </form>

              {/* TOMBOL BARU UNTUK KASIR POS */}
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-xs text-gray-400 font-bold uppercase">Atau</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <AdminMidtransButton orderId={orderId} />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2 text-sm">
              <MapPin size={18} className="text-blue-500" /> Alamat Pengiriman
            </h2>
            {address ? (
              <div className="text-sm text-gray-600 space-y-1.5">
                <p className="font-bold text-gray-900">{address.recipient_name}</p>
                <p className="text-xs">{address.phone_number}</p>
                <p className="mt-3 leading-relaxed text-gray-700">{address.street_address}</p>
                <p className="text-xs">{address.city}, {address.province} {address.postal_code}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium bg-gray-50 p-3 rounded-lg text-center">Beli Langsung di Toko (POS)</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2 text-sm">
              <Truck size={18} className="text-purple-500" /> Update Resi / Kurir
            </h2>
            <div className="text-sm text-gray-600 mb-5 bg-gray-50 p-3 rounded-lg space-y-1">
              <p>Kurir: <span className="font-bold text-gray-900 uppercase">{shipping?.courier_name || 'Tidak ada kurir'}</span></p>
              {shipping?.service_type && <p>Layanan: <span className="font-bold text-gray-900">{shipping.service_type}</span></p>}
            </div>

            {/* FORM INPUT RESI */}
            <form action={updateShippingResi} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nomor Resi (Tracking)</label>
                <input 
                  type="text" 
                  name="tracking_number" 
                  defaultValue={defaultResi} 
                  placeholder="Contoh: JP123456789"
                  className="w-full p-2.5 border border-gray-300 text-gray-900 font-bold rounded-lg focus:ring-2 focus:ring-purple-500 outline-none uppercase text-sm bg-white"
                />
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm mt-2">
                <Save size={16} /> Simpan Resi
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}