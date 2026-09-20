// app/checkout/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { processCheckout } from '@/app/actions/checkout';
import { MapPin, Truck, ShieldCheck, ShoppingBag, Loader2, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { validateVoucher } from '@/app/actions/pos_voucher';

export default function CheckoutPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State Interaktif
  const [selectedCourier, setSelectedCourier] = useState('JNE');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(''); // Menyimpan kode voucher yang valid
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    async function fetchCheckoutData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const [profileRes, addressRes, cartRes] = await Promise.all([
        supabase.from('user_profiles').select('role').eq('user_id', user.id).single(),
        supabase.from('user_addresses').select('*').eq('user_id', user.id),
        supabase.from('carts').select('quantity, products(name, price_retail, price_reseller, weight_actual_gram, weight_volumetric_gram)').eq('user_id', user.id)
      ]);

      if (!cartRes.data || cartRes.data.length === 0) {
        router.push('/');
        return;
      }

      setData({
        role: profileRes.data?.role || 'customer',
        addresses: addressRes.data || [],
        carts: cartRes.data
      });
      setLoading(false);
    }
    fetchCheckoutData();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;
  }

  // Kalkulasi Tampilan Frontend
  let subtotal = 0;
  let totalWeightGram = 0;

  data.carts.forEach((item: any) => {
    const p = item.products;
    const price = data.role === 'reseller' ? p.price_reseller : p.price_retail;
    const weight = Math.max(p.weight_actual_gram, p.weight_volumetric_gram);
    subtotal += price * item.quantity;
    totalWeightGram += weight * item.quantity;
  });

  const weightKg = Math.ceil(totalWeightGram / 1000) || 1;
  const shippingRate = selectedCourier === 'JNE' ? 15000 : 12000;
  const shippingCost = weightKg * shippingRate;
  
  // Kalkulasi Grand Total dengan Diskon
  const grandTotal = Math.max(0, subtotal + shippingCost - discountAmount);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Fungsi Terapkan Voucher
  const handleApplyVoucher = async (e: React.MouseEvent) => {
  e.preventDefault();
    // Panggil Server Action validateVoucher
  const result = await validateVoucher(voucherCode, subtotal);

  if (result.success) {
    setDiscountAmount(result.discountAmount ?? 0);
    setAppliedVoucher(result.voucherCode);
    setVoucherMessage({ text: result.message, isError: false });
  } else {
    setDiscountAmount(0);
    setAppliedVoucher('');
    setVoucherMessage({ text: result.message, isError: true });
  }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingBag className="text-orange-600" /> Proses Pembayaran
        </h1>

        <form 
          action={processCheckout} 
          onSubmit={() => setIsSubmitting(true)}
          className="flex flex-col lg:flex-row gap-6"
        >
          
          {/* Nilai Tersembunyi untuk dikirim ke Server (Termasuk Kode Voucher) */}
          <input type="hidden" name="discount_amount" value={discountAmount} />
          <input type="hidden" name="voucher_code" value={appliedVoucher} />
          <input type="hidden" name="payment_method" value="Midtrans Gateway" />

          {/* KOLOM KIRI: Form Input */}
          <div className="lg:w-2/3 space-y-6">
            
            {/* 1. Alamat Pengiriman */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-orange-500" size={20} /> Alamat Pengiriman
              </h2>
              
              {data.addresses.length === 0 ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                  Anda belum memiliki alamat. Silakan tambah alamat di menu Profil.
                </div>
              ) : (
                <select name="address_id" required className="w-full p-3 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm cursor-pointer">
                  {data.addresses.map((addr: any) => (
                    <option key={addr.address_id} value={addr.address_id}>
                      {addr.recipient_name} - {addr.street_address}, Kota ID: {addr.city_id} ({addr.phone_number})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Kurir Pengiriman */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Truck className="text-orange-500" size={20} /> Pilih Ekspedisi
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <label className={`border rounded-lg p-4 cursor-pointer transition ${selectedCourier === 'JNE' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                  <input type="radio" name="courier" value="JNE" className="hidden" checked={selectedCourier === 'JNE'} onChange={() => setSelectedCourier('JNE')} />
                  <div className="font-bold text-gray-800">JNE Reguler</div>
                  <div className="text-sm text-gray-500 mt-1">Estimasi 2-3 Hari</div>
                </label>
                <label className={`border rounded-lg p-4 cursor-pointer transition ${selectedCourier === 'J&T' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                  <input type="radio" name="courier" value="J&T" className="hidden" checked={selectedCourier === 'J&T'} onChange={() => setSelectedCourier('J&T')} />
                  <div className="font-bold text-gray-800">J&T Cargo</div>
                  <div className="text-sm text-gray-500 mt-1">Lebih hemat untuk gerabah</div>
                </label>
              </div>
            </div>

            {/* 3. Informasi Pembayaran Midtrans */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex gap-4 items-start">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Pembayaran Aman via Midtrans</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Anda dapat memilih metode pembayaran (Transfer Bank, Virtual Account, QRIS, GoPay, ShopeePay) di halaman selanjutnya setelah pesanan dibuat.
                </p>
              </div>
            </div>

          </div>

          {/* KOLOM KANAN: Ringkasan Belanja */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Ringkasan Belanja</h2>
              
              <div className="space-y-3 mb-6">
                {data.carts.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600 line-clamp-1 pr-4">{item.quantity}x {item.products.name}</span>
                  </div>
                ))}
              </div>

              {/* FITUR KODE VOUCHER */}
              <div className="mb-6 border-t pt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Gunakan DISKON20" 
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 uppercase"
                    />
                  </div>
                  <button onClick={handleApplyVoucher} type="button" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-900 transition">
                    Terapkan
                  </button>
                </div>
                {voucherMessage.text && (
                  <p className={`text-xs mt-2 font-medium ${voucherMessage.isError ? 'text-red-500' : 'text-green-600'}`}>
                    {voucherMessage.text}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm text-gray-600 border-t pt-4 mb-6">
                <div className="flex justify-between">
                  <span>Total Harga ({data.carts.length} barang)</span>
                  <span className="font-medium text-gray-800">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Berat</span>
                  <span className="font-medium text-gray-800">{weightKg} Kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kirim ({selectedCourier})</span>
                  <span className="font-medium text-gray-800">{formatRupiah(shippingCost)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Voucher ({appliedVoucher})</span>
                    <span className="font-medium">- {formatRupiah(discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-800">Total Tagihan</span>
                  <span className="text-xl font-extrabold text-orange-600">{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || data.addresses.length === 0}
                className={`w-full font-bold py-3 px-4 rounded-lg transition shadow-md flex justify-center items-center gap-2
                  ${isSubmitting || data.addresses.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'}
                `}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Buat Pesanan Sekarang'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}