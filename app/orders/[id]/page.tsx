// app/orders/[id]/page.tsx
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Import Admin Client
import { 
  ArrowLeft, Package, MapPin, Receipt, 
  CreditCard, Clock, CheckCircle2, Truck, XCircle, AlertCircle 
} from 'lucide-react';

export default async function CustomerOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const orderId = params.id;

  const supabase = await createClient();

  // 1. Cek Login Pelanggan
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Siapkan Admin Client agar terhindar dari pemblokiran RLS tabel relasi (alamat/pengiriman)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // 3. Tarik Data Pesanan Menggunakan Admin Client
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      user_addresses (*),
      shipping (*),
      order_items (
        order_item_id, quantity, price_per_item, total_price,
        products (name, sku, product_images(image_path, is_primary))
      )
    `)
    .eq('order_id', orderId)
    .eq('user_id', user.id) // KUNCI KEAMANAN: Memastikan ini hanya milik pelanggan yang login
    .single();

  // Tampilkan pesan asli di Terminal jika ada error (membantu debugging jika ID salah format)
  if (error) {
    console.error("Gagal memuat detail pesanan pelanggan:", error.message || error);
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center font-sans">
        <AlertCircle size={48} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Tidak Ditemukan</h1>
        <p className="text-gray-500 mb-6">Maaf, pesanan yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
        <Link href="/orders" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition">
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const address = Array.isArray(order.user_addresses) ? order.user_addresses[0] : order.user_addresses;
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
    
  
  const computedSubtotal = order.order_items?.reduce((sum: number, item: any) => {
    return sum + Number(item.total_price || (item.quantity * item.price_per_item) || 0);
  }, 0) || 0;

  // Fungsi Helper untuk Tampilan Status
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending_payment': return { text: 'Menunggu Pembayaran', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
      case 'paid': return { text: 'Lunas & Menunggu Diproses', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 };
      case 'processing': return { text: 'Sedang Dikemas', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Package };
      case 'shipped': return { text: 'Sedang Dikirim', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck };
      case 'delivered': return { text: 'Pesanan Selesai', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
      case 'cancelled': return { text: 'Dibatalkan', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
      default: return { text: status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Package };
    }
  };

  const statusInfo = getStatusDisplay(order.order_status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans pb-20">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Navigasi Kembali */}
        <Link href="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition font-medium text-sm">
          <ArrowLeft size={16} /> Kembali ke Daftar Pesanan
        </Link>

        {/* Header Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Invoice {order.invoice_number}</h1>
            <p className="text-sm text-gray-500 mt-1">Dipesan pada {formatDate(order.created_at)}</p>
          </div>
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-bold text-sm shrink-0 ${statusInfo.color}`}>
            <StatusIcon size={18} /> {statusInfo.text}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Kolom Kiri (Daftar Produk) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 font-bold text-gray-800">
                <Package size={18} className="text-gray-400" /> Rincian Produk
              </div>
              <div className="divide-y divide-gray-100">
                {order.order_items?.map((item: any) => {
                  const images = item.products?.product_images || [];
                  const primaryImg = Array.isArray(images) 
                    ? images.find((img: any) => img.is_primary)?.image_path || images[0]?.image_path 
                    : (images as any)?.image_path;

                  return (
                    <div key={item.order_item_id} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                        {primaryImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={primaryImg} alt={item.products?.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={24}/></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 line-clamp-2">{item.products?.name || 'Produk Tidak Diketahui'}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">SKU: {item.products?.sku || '-'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-medium text-gray-600">{item.quantity || 1} x {formatRupiah(Number(item.price_per_item || 0))}</p>
                          <p className="font-bold text-gray-900">{formatRupiah(Number(item.total_price))}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kolom Kanan (Ringkasan Pembayaran & Tombol Midtrans) */}
          <div className="space-y-6">
            {/* Info Pengiriman */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 font-bold text-gray-800">
                <MapPin size={18} className="text-gray-400" /> Informasi Pengiriman
              </div>
              <div className="p-5 text-sm space-y-1">
                <p className="font-bold text-gray-900">{address?.recipient_name || 'Pelanggan'}</p>
                <p className="text-gray-600">{address?.phone_number || '-'}</p>
                <p className="text-gray-600 leading-relaxed mt-2">
                  {address?.street_address}<br/>
                  {address?.city}, {address?.province} {address?.postal_code}
                </p>
                {order.shipping?.tracking_number && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-600 font-semibold mb-0.5">Nomor Resi Pengiriman</p>
                    <p className="font-mono font-bold text-gray-900 text-base">{order.shipping.tracking_number}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 font-bold text-gray-800">
                <Receipt size={18} className="text-gray-400" /> Ringkasan Pembayaran
              </div>
              
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Produk</span>
                  <span className="font-medium text-gray-900">{formatRupiah(Number(order.total_amount || computedSubtotal))}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span className="font-medium text-gray-900">{formatRupiah(Number(order.shipping_cost))}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Voucher</span>
                    <span className="font-medium">- {formatRupiah(Number(order.discount_amount))}</span>
                  </div>
                )}
                
                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Belanja</span>
                  <span className="font-black text-lg text-blue-600">{formatRupiah(Number(order.grand_total))}</span>
                </div>

                {/* TOMBOL BAYAR SEKARANG (MIDTRANS) */}
                {order.order_status === 'pending_payment' && (
                  <div className="pt-4 mt-2">
                    <Link 
                      href={`/orders/${order.order_id}/payment`}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-200"
                    >
                      <CreditCard size={18} /> Bayar Sekarang
                    </Link>
                    <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
                      <ShieldCheck size={14} /> Pembayaran aman via Midtrans
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Komponen ikon kecil tambahan di bawah tombol
function ShieldCheck({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}