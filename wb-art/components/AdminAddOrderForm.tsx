// components/AdminAddOrderForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createManualOrder } from '@/app/actions/adminOrders';
import { validateVoucher } from '@/app/actions/pos_voucher'; // <-- 1. Import Validasi Voucher
import { Plus, Trash2, User, MapPin, Truck, Save, Loader2, Search, ShoppingBag, Ticket, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminAddOrderForm({ products }: { products: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State Formulir Pelanggan & Pengiriman
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [courierName, setCourierName] = useState('Kurir Toko');
  const [shippingCost, setShippingCost] = useState(0);
  const [status, setStatus] = useState('paid');

  // State Keranjang & Pencarian
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // 2. State Khusus Voucher & Diskon
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherMessage, setVoucherMessage] = useState({ text: '', isError: false });
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // Hitung Total Finansial (Termasuk Potongan Diskon Voucher)
  const subtotal = cart.reduce((sum, item) => sum + (item.price_retail * item.qty), 0);
  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  // Pastikan grandTotal tidak bernilai negatif
  const grandTotal = Math.max(0, subtotal - discountAmount + Number(shippingCost));
  
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' ,minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

  // Logika Pencarian Produk
  const filteredProducts = search.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const addToCart = (product: any) => {
    if (product.stock <= 0) return alert('Stok habis!');
    
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (existing.qty >= product.stock) return alert('Melebihi stok yang ada!');
      setCart(cart.map(item => item.product_id === product.product_id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setSearch('');
  };

  const changeQty = (id: string, qty: number, maxStock: number) => {
    if (qty < 1) return;
    if (qty > maxStock) return alert('Melebihi stok tersedia!');
    setCart(cart.map(item => item.product_id === id ? { ...item, qty } : item));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.product_id !== id));
  };

  // 3. Handler Validasi & Pembatalan Voucher
  const handleApplyVoucher = async () => {
    if (!promoCodeInput.trim()) return;
    setIsCheckingVoucher(true);
    setVoucherMessage({ text: '', isError: false });

    const result = await validateVoucher(promoCodeInput, subtotal);
    if (result.success) {
      setAppliedVoucher({ code: result.voucherCode!, discount: result.discountAmount! });
      setVoucherMessage({ text: result.message!, isError: false });
    } else {
      setVoucherMessage({ text: result.message!, isError: true });
    }
    setIsCheckingVoucher(false);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setPromoCodeInput('');
    setVoucherMessage({ text: '', isError: false });
  };

  // Simpan Pesanan (Menyertakan Data Voucher & Diskon)
  const handleSaveOrder = () => {
    if (cart.length === 0) return alert('Keranjang masih kosong!');
    if (!customerName || !customerPhone) return alert('Nama dan No. HP pelanggan wajib diisi!');

    startTransition(async () => {
      const payload = {
        customerName, customerPhone, city, streetAddress,
        courierName, shippingCost: Number(shippingCost),
        status, grandTotal,
        voucherCode: appliedVoucher ? appliedVoucher.code : null, // <-- Masukkan ke payload
        discountAmount: discountAmount,                          // <-- Masukkan ke payload
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.qty, price: item.price_retail }))
      };

      const result = await createManualOrder(payload);
      if (result.success) {
        router.push(`/admin/orders/${result.orderId}?success=true`);
      } else {
        alert('Terjadi kesalahan: ' + result.message);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* KIRI: PILIH PRODUK & KERANJANG */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-blue-500" /> Masukkan Barang
          </h2>
          
          {/* Pencarian Produk */}
          <div className="relative mb-6">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama produk atau SKU untuk menambah..." 
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            
            {filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {filteredProducts.map(p => (
                  <div key={p.product_id} onClick={() => addToCart(p)} className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">Stok: {p.stock} | {formatRupiah(p.price_retail)}</p>
                    </div>
                    <Plus size={18} className="text-blue-500" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daftar Barang (Cart) */}
          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg text-sm">Belum ada barang dipilih.</div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 border border-gray-100 rounded-lg gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatRupiah(item.price_retail)} / pcs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden h-9">
                      <button type="button" onClick={() => changeQty(item.product_id, item.qty - 1, item.stock)} className="px-3 text-gray-600 hover:bg-gray-100 font-bold">-</button>
                      <span className="w-10 text-center text-sm font-bold">{item.qty}</span>
                      <button type="button" onClick={() => changeQty(item.product_id, item.qty + 1, item.stock)} className="px-3 text-gray-600 hover:bg-gray-100 font-bold">+</button>
                    </div>
                    <p className="font-bold text-gray-900 w-24 text-right text-sm">{formatRupiah(item.price_retail * item.qty)}</p>
                    <button type="button" onClick={() => removeItem(item.product_id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* KANAN: PELANGGAN, PROMO, & PEMBAYARAN */}
      <div className="space-y-6">
        
        {/* Info Pelanggan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2 text-sm"><User size={16} className="text-orange-500"/> Info Pelanggan</h2>
          <input type="text" placeholder="Nama Pelanggan *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          <input type="text" placeholder="No. HP / WhatsApp *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          
          <h2 className="font-bold text-gray-800 border-b pb-2 pt-2 flex items-center gap-2 text-sm"><MapPin size={16} className="text-purple-500"/> Alamat & Pengiriman</h2>
          <input type="text" placeholder="Kota / Kabupaten" value={city} onChange={e => setCity(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          <textarea placeholder="Detail Alamat (Opsional)" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} rows={2} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"></textarea>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            <input type="text" placeholder="Nama Kurir" value={courierName} onChange={e => setCourierName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm" />
            <input type="number" placeholder="Ongkos Kirim" value={shippingCost || ''} onChange={e => setShippingCost(Number(e.target.value))} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm" />
          </div>
        </div>

        {/* Ringkasan & Voucher Promo */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2 text-sm">Ringkasan Pembayaran</h2>
          
          {/* 4. KOTAK INPUT VOUCHER / PROMO */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Ticket size={14} className="text-blue-600" /> Kode Promo / Voucher
            </div>

            {!appliedVoucher ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="Ketik kode..." 
                  className="flex-1 p-2 bg-white border border-gray-200 rounded-lg uppercase text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={isCheckingVoucher || !promoCodeInput.trim()}
                  className="bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1"
                >
                  {isCheckingVoucher && <Loader2 size={12} className="animate-spin" />} Pakai
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-green-800 text-xs font-bold">
                  <CheckCircle size={14} className="text-green-600" />
                  <span>{appliedVoucher.code} (-{formatRupiah(appliedVoucher.discount)})</span>
                </div>
                <button type="button" onClick={handleRemoveVoucher} className="text-[11px] font-bold text-red-600 hover:underline">
                  Batal
                </button>
              </div>
            )}

            {voucherMessage.text && (
              <p className={`text-[11px] font-semibold flex items-center gap-1 ${voucherMessage.isError ? 'text-red-600' : 'text-green-600'}`}>
                {voucherMessage.isError ? <AlertCircle size={12} /> : <CheckCircle size={12} />} {voucherMessage.text}
              </p>
            )}
          </div>

          {/* Rincian Angka */}
          <div className="space-y-1.5 text-sm text-gray-600 pt-2">
            <div className="flex justify-between"><span>Subtotal Barang</span><span>{formatRupiah(subtotal)}</span></div>
            
            {/* Tampilkan baris diskon hanya jika voucher aktif */}
            {appliedVoucher && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Diskon ({appliedVoucher.code})</span>
                <span>- {formatRupiah(appliedVoucher.discount)}</span>
              </div>
            )}

            <div className="flex justify-between"><span>Ongkos Kirim</span><span>{formatRupiah(shippingCost)}</span></div>
            
            <div className="flex justify-between text-base font-black text-gray-900 pt-3 border-t border-gray-100 mt-2">
              <span>Total Tagihan</span><span className="text-orange-600">{formatRupiah(grandTotal)}</span>
            </div>
          </div>
          
          <label className="block text-xs font-medium text-gray-700 mb-1 pt-2">Status Pesanan Awal</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm mb-4 bg-gray-50 cursor-pointer">
            <option value="paid">Lunas (Perlu Diproses)</option>
            <option value="delivered">Selesai (Langsung Diterima)</option>
            <option value="pending_payment">Belum Bayar (Hutang)</option>
          </select>

          <button onClick={handleSaveOrder} disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm">
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            Buat Pesanan Sekarang
          </button>
        </div>

      </div>
    </div>
  );
}