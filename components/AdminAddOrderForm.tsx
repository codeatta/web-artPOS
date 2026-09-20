// components/AdminAddOrderForm.tsx
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createManualOrder } from '@/app/actions/adminOrders';
import { validateVoucher } from '@/app/actions/pos_voucher';
import { Plus, Trash2, User, MapPin, Truck, Save, Loader2, Search, ShoppingBag, Ticket, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import toast from 'react-hot-toast'; // Menggunakan Toast untuk notifikasi error/sukses

export default function AdminAddOrderForm({ products }: { products: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State Formulir Pelanggan & Pengiriman
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [courierName, setCourierName] = useState('Kurir Toko');
  const [shippingCost, setShippingCost] = useState<number | ''>('');
  const [status, setStatus] = useState('paid');

  // NEW: State Pembayaran
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  // State Keranjang & Pencarian
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // State Khusus Voucher & Diskon
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherMessage, setVoucherMessage] = useState({ text: '', isError: false });
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // Kalkulasi Finansial
  const subtotal = cart.reduce((sum, item) => sum + (item.price_retail * item.qty), 0);
  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const safeShippingCost = Number(shippingCost) || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + safeShippingCost);
  
  // NEW: Kalkulasi Kembalian (Change)
  const safeCashReceived = Number(cashReceived) || 0;
  const changeAmount = safeCashReceived > grandTotal ? safeCashReceived - grandTotal : 0;

  // Auto-set cash received sama dengan grand total saat cart kosong (untuk kenyamanan awal)
  useEffect(() => {
    if (cart.length === 0) setCashReceived('');
  }, [cart]);

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' ,minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

  // Logika Pencarian Produk
  const filteredProducts = search.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const addToCart = (product: any) => {
    if (product.stock <= 0) return toast.error('Stok habis!');
    
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (existing.qty >= product.stock) return toast.error('Melebihi stok yang ada!');
      setCart(cart.map(item => item.product_id === product.product_id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setSearch('');
  };

  const changeQty = (id: string, qty: number, maxStock: number) => {
    if (qty < 1) return;
    if (qty > maxStock) return toast.error('Melebihi stok tersedia!');
    setCart(cart.map(item => item.product_id === id ? { ...item, qty } : item));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.product_id !== id));
  };

  // Handler Voucher
  const handleApplyVoucher = async () => {
    if (!promoCodeInput.trim()) return;
    setIsCheckingVoucher(true);
    setVoucherMessage({ text: '', isError: false });

    const result = await validateVoucher(promoCodeInput, subtotal);
    if (result.success) {
      setAppliedVoucher({ code: result.voucherCode!, discount: result.discountAmount! });
      setVoucherMessage({ text: result.message!, isError: false });
      toast.success('Voucher berhasil digunakan!');
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

  // Simpan Pesanan
  const handleSaveOrder = () => {
    if (cart.length === 0) return toast.error('Keranjang masih kosong!');
    if (!customerName || !customerPhone) return toast.error('Nama dan No. HP pelanggan wajib diisi!');
    if (paymentMethod === 'Tunai' && safeCashReceived < grandTotal && status !== 'pending_payment') {
      return toast.error('Uang bayar tidak boleh kurang dari total tagihan!');
    }

    startTransition(async () => {
      // Kita kirimkan semua data pembayaran ke payload
      const payload = {
        customerName, customerPhone, city, streetAddress,
        courierName, shippingCost: safeShippingCost,
        status, grandTotal,
        paymentMethod,                 // <-- Dikirim ke backend
        cashReceived: safeCashReceived,// <-- Dikirim ke backend
        changeAmount,                  // <-- Dikirim ke backend
        voucherCode: appliedVoucher ? appliedVoucher.code : null, 
        discountAmount: discountAmount,
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.qty, price: item.price_retail }))
      };

      const result = await createManualOrder(payload);
      if (result.success) {
        toast.success('Pesanan berhasil dibuat!');
        router.push(`/admin/orders/${result.orderId}?success=true`);
      } else {
        toast.error('Terjadi kesalahan: ' + result.message);
      }
    });
  };

  // Tombol Pintas Pembayaran Tunai (Uang Pas)
  const setExactAmount = () => setCashReceived(grandTotal);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* KIRI: PILIH PRODUK & KERANJANG (TETAP SAMA SEPERTI SEBELUMNYA) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-blue-500" /> Masukkan Barang
          </h2>
          
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

      {/* KANAN: PELANGGAN, PEMBAYARAN & RINGKASAN */}
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
            <input type="number" placeholder="Ongkos Kirim" value={shippingCost} onChange={e => setShippingCost(Number(e.target.value))} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm" />
          </div>
        </div>

        {/* Ringkasan & Pembayaran */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2 text-sm">Pembayaran & Tagihan</h2>
          
          {/* Input Voucher */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <Ticket size={14} className="text-blue-600" /> Kode Promo / Voucher
            </div>
            {/* Logika Input Voucher sama persis seperti sebelumnya ... */}
            {!appliedVoucher ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="Ketik kode..." 
                  className="flex-1 p-2 bg-white border border-gray-200 rounded-lg uppercase text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={handleApplyVoucher} disabled={isCheckingVoucher || !promoCodeInput.trim()} className="bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1">
                  {isCheckingVoucher && <Loader2 size={12} className="animate-spin" />} Pakai
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-green-800 text-xs font-bold">
                  <CheckCircle size={14} className="text-green-600" />
                  <span>{appliedVoucher.code} (-{formatRupiah(appliedVoucher.discount)})</span>
                </div>
                <button type="button" onClick={handleRemoveVoucher} className="text-[11px] font-bold text-red-600 hover:underline">Batal</button>
              </div>
            )}
          </div>

          {/* Rincian Angka */}
          <div className="space-y-1.5 text-sm text-gray-600 pt-2 border-b border-gray-100 pb-4">
            <div className="flex justify-between"><span>Subtotal Barang</span><span>{formatRupiah(subtotal)}</span></div>
            {appliedVoucher && (
              <div className="flex justify-between text-green-600 font-medium"><span>Diskon Voucher</span><span>- {formatRupiah(appliedVoucher.discount)}</span></div>
            )}
            <div className="flex justify-between"><span>Ongkos Kirim</span><span>{formatRupiah(safeShippingCost)}</span></div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-3 mt-2">
              <span>Grand Total</span><span className="text-orange-600 text-xl">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          {/* NEW: METODE & PENERIMAAN PEMBAYARAN */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Wallet size={14} className="text-green-500"/> Metode Pembayaran
            </label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm mb-3 bg-white font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="Tunai">Uang Tunai (Cash)</option>
              <option value="Transfer BCA">Transfer Bank (BCA)</option>
              <option value="Transfer Mandiri">Transfer Bank (Mandiri)</option>
              <option value="QRIS">QRIS / E-Wallet</option>
            </select>

            {/* Munculkan input Uang Diterima HANYA JIKA metode Tunai (Cash) */}
            {paymentMethod === 'Tunai' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-blue-900">Uang Diterima dari Pelanggan</label>
                    <button type="button" onClick={setExactAmount} className="text-[10px] bg-blue-200 hover:bg-blue-300 text-blue-800 font-bold px-2 py-0.5 rounded transition">
                      Uang Pas
                    </button>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Misal: 100000" 
                    value={cashReceived} 
                    onChange={e => setCashReceived(Number(e.target.value))} 
                    className="w-full p-2.5 border border-blue-200 rounded-lg outline-none font-bold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                
                {safeCashReceived > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-sm font-bold text-gray-700">Kembalian:</span>
                    <span className={`text-lg font-black ${changeAmount > 0 ? 'text-green-600' : (safeCashReceived < grandTotal ? 'text-red-500 text-sm' : 'text-gray-900')}`}>
                      {safeCashReceived < grandTotal ? 'Kurang bayar!' : formatRupiah(changeAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <label className="block text-xs font-medium text-gray-700 mb-1">Status Pesanan</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm mb-4 bg-gray-50 cursor-pointer">
            <option value="paid">Lunas (Perlu Diproses)</option>
            <option value="delivered">Selesai (Langsung Dibawa)</option>
            <option value="pending_payment">Belum Bayar (Hutang)</option>
          </select>

          <button 
            onClick={handleSaveOrder} 
            disabled={isPending || (paymentMethod === 'Tunai' && safeCashReceived < grandTotal && status !== 'pending_payment')} 
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg text-sm"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            Proses & Cetak Struk
          </button>
        </div>

      </div>
    </div>
  );
}