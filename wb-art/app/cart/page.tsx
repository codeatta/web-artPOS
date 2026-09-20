// app/cart/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Store, ArrowLeft } from 'lucide-react';
import CartItemControls from '@/components/CartItemControls';
import BackButton from '@/components/BackButton';

export const revalidate = 0; 

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag size={64} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Keranjang Belanja</h2>
        <p className="text-gray-500 mb-6 text-center">Silakan masuk (login) terlebih dahulu.</p>
        <Link href="/login" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition">
          Masuk ke Akun
        </Link>
      </div>
    );
  }

  // QUERY YANG DIPERBAIKI (Lebih aman dari error skema tabel)
  const { data: cartItems, error } = await supabase
    .from('carts')
    .select(`
      cart_id,
      quantity,
      products (
        product_id, name, price_retail, stock,
        product_images (image_path, is_primary)
      )
    `)
    .eq('user_id', user.id);

  // Jika error terjadi di database, tampilkan di terminal VSCodemu
  if (error) {
    console.error("SUPABASE ERROR DI KERANJANG:", error.message);
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Store size={64} className="text-orange-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Keranjang Masih Kosong</h2>
        <p className="text-gray-500 mb-6 text-center">Yuk, cari gerabah idamanmu sekarang!</p>
        <Link href="/" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-md shadow-orange-200">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  let subtotal = 0;
  let totalItems = 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <div className="flex items-center gap-3 mb-8">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">Keranjang Belanja</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3 space-y-4">
            {cartItems.map((item) => {
              const p = Array.isArray(item.products) ? item.products[0] : (item.products as any);
              if (!p) return null;

              subtotal += p.price_retail * item.quantity;
              totalItems += item.quantity;

              const primaryImgObj = p.product_images?.find((img: any) => img.is_primary);
              const imagePath = primaryImgObj ? primaryImgObj.image_path : (p.product_images?.[0]?.image_path || '/placeholder.jpg');

              return (
                <div key={item.cart_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePath} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-2 text-sm sm:text-base">{p.name}</h3>
                      <p className="text-orange-600 font-extrabold mt-1">{formatRupiah(p.price_retail)}</p>
                    </div>
                    <CartItemControls cartId={item.cart_id} quantity={item.quantity} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-4">Ringkasan Belanja</h2>
              <div className="space-y-3 text-gray-600 text-sm mb-6">
                <div className="flex justify-between">
                  <span>Total Barang</span>
                  <span className="font-medium text-gray-800">{totalItems} barang</span>
                </div>
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-800">Subtotal</span>
                  <span className="text-xl font-extrabold text-orange-600">{formatRupiah(subtotal)}</span>
                </div>
              </div>
              <Link 
                href="/checkout"
                className="w-full font-bold py-3 px-4 rounded-lg transition shadow-md flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200"
              >
                Lanjut ke Pembayaran <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}