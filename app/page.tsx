// app/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { ShoppingCart, Search, Menu, MapPin, Star, Bell, Mail, Store, User } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton'; 
import SearchBar from '@/components/SearchBar';

export const revalidate = 60; 

export default async function StorefrontPage() {
  const supabase = await createClient();

  // 1. Cek Sesi Pengguna (Login Status)
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Hitung Jumlah Barang di Keranjang (Jika User Login)
  let cartItemCount = 0;
  if (user) {
    const { data: cartData } = await supabase
      .from('carts')
      .select('quantity')
      .eq('user_id', user.id);
      
    if (cartData) {
      // Menjumlahkan seluruh quantity dari barang di keranjang
      cartItemCount = cartData.reduce((total, item) => total + item.quantity, 0);
    }
  }

// Ambil data produk terbaru untuk beranda
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      product_id,
      name,
      price_retail,
      stock,
      categories (name),
      product_images:product_images!product_images_product_id_fkey(image_path, is_primary)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // LOGIKA BARU: Paksa error menjadi teks agar terbaca jelas alasannya
  if (error) {
    console.error("Gagal mengambil produk:", JSON.stringify(error, null, 2));
  }

  // LOGIKA BARU: Ekstrak Kategori Dinamis dari Produk
  const extractedCategories = Array.from(new Set(
    products?.map((p: any) => {
      return Array.isArray(p.categories) ? p.categories[0]?.name : (p.categories as any)?.name;
    }).filter(Boolean)
  )) as string[];

  // Lengkapi dengan kategori spesial jika jumlahnya di bawah 8 (agar grid tetap rapi)
  let displayCategories = [...extractedCategories];
  const specialCategories = ['Promo', 'Terlaris', 'Terbaru', 'Grosir'];
  for (const special of specialCategories) {
    if (displayCategories.length >= 8) break;
    if (!displayCategories.includes(special)) displayCategories.push(special);
  }
  displayCategories = displayCategories.slice(0, 8);

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(number);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-0">
      
      {/* NAVBAR / HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 md:gap-6">
            
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link href="/" className="flex items-center gap-2 text-orange-600">
                <Store size={26} />
                <span className="text-2xl font-extrabold tracking-tight">Toko<span className="text-gray-800">Gerabah</span></span>
              </Link>
              <div className="flex items-center gap-4 md:hidden text-gray-500">
                <Mail size={20} />
                <Bell size={20} />
                <Menu size={24} />
              </div>
            </div>

            <div className="flex-1 w-full flex text-gray-700 items-center">
              <SearchBar basePath="/products" />
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/cart" className="relative text-gray-500 hover:text-orange-600 transition">
                <ShoppingCart size={22} />
                {/* Badge Keranjang Dinamis */}
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              
              {/* Logika Perubahan Tombol Login vs Profil */}
              <div className="flex items-center gap-3">
                {user ? (
                  <Link href="/profile" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-600 transition">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    Profil Saya
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-semibold text-orange-600 hover:bg-orange-50 px-4 py-1.5 rounded-lg border border-orange-600 transition">
                      Masuk
                    </Link>
                    <Link href="/register" className="text-sm font-bold bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700 transition shadow-sm shadow-orange-200">
                      Daftar
                    </Link>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Konten Utama (Tidak ada perubahan pada grid produk) */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <section className="mb-8">
          <div className="w-full h-32 md:h-72 bg-gradient-to-r from-orange-600 to-amber-500 rounded-xl md:rounded-2xl flex items-center justify-between px-8 md:px-16 text-white shadow-md shadow-orange-200 relative overflow-hidden">
            <div className="z-10 w-full md:w-1/2">
              <h2 className="text-xl md:text-4xl font-extrabold mb-2 md:mb-4">Koleksi Gerabah Asli</h2>
              <p className="text-sm md:text-lg mb-4 hidden md:block">Estetika natural untuk dapur dan taman Anda. Dibuat langsung oleh pengrajin lokal.</p>
              <button className="bg-white text-orange-600 text-xs md:text-sm font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg shadow-sm hover:bg-gray-50 transition">
                Cek Sekarang
              </button>
            </div>
            <div className="absolute right-0 top-0 w-64 h-64 border-[40px] border-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute right-40 bottom-0 w-32 h-32 bg-white/10 rounded-full -mb-10"></div>
          </div>
        </section>

        <section className="mb-8 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Kategori Pilihan</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 text-center">
            {displayCategories.map((cat, i) => {
              // Jika kategori spesial, arahkan ke semua produk. Jika kategori asli, filter.
              const isSpecial = ['Promo', 'Terlaris', 'Terbaru', 'Grosir'].includes(cat);
              const hrefPath = isSpecial ? '/products' : `/products?category=${encodeURIComponent(cat)}`;

              return (
                <Link 
                  key={i} 
                  href={hrefPath} 
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition mb-2 border border-orange-100">
                    <span className="text-xl md:text-2xl font-bold uppercase">{cat.charAt(0)}</span>
                  </div>
                  <span className="text-xs text-gray-600 font-medium group-hover:text-orange-600 line-clamp-1">
                    {cat}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
              Produk Terbaru
            </h2>
            <Link href="/products" className="text-sm font-bold text-orange-600 hover:text-orange-700">
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {products?.map((product) => {
              const images = product.product_images || [];
              const primaryImg = Array.isArray(images) 
                ? images.find((img: any) => img.is_primary)?.image_path || images[0]?.image_path 
                : (images as any)?.image_path;
              
              const imagePath = primaryImg || '/placeholder.jpg';
              
              const hasDiscount = product.price_retail > 50000;
              const originalPrice = product.price_retail * 1.25;

              return (
                <div key={product.product_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col group">
                  
                  {/* FOTO PRODUK (BISA DIKLIK) */}
                  <Link href={`/products/${product.product_id}`} className="relative aspect-square bg-stone-100 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={imagePath} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white text-stone-800 font-bold px-3 py-1 rounded text-sm shadow-sm">Stok Habis</span>
                      </div>
                    )}
                  </Link>

                  {/* DETAIL PRODUK */}
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-wider">
                      {Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name || 'Umum'}
                    </span>
                    
                    {/* NAMA PRODUK (BISA DIKLIK) */}
                    <Link href={`/products/${product.product_id}`} className="hover:text-orange-600 transition">
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[40px]">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="text-base md:text-lg font-extrabold text-gray-900 mt-2">
                      {formatRupiah(product.price_retail)}
                    </div>
                    
                    {hasDiscount ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1 rounded border border-red-100">Hemat 20%</span>
                        <span className="text-[10px] text-gray-400 line-through">{formatRupiah(originalPrice)}</span>
                      </div>
                    ) : (
                      <div className="h-4 mt-0.5"></div>
                    )}

                    <div className="flex items-center gap-1 mt-3 text-gray-500">
                      <MapPin size={12} className="text-orange-500" />
                      <span className="text-xs truncate">Kab. Ponorogo</span>
                    </div>

                    <div className="mt-auto pt-4 relative z-10">
                      {/* Tombol Add To Cart (Z-index agar tidak tumpang tindih dengan klik link) */}
                      <AddToCartButton productId={product.product_id} stock={product.stock} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* BOTTOM NAVIGATION (MOBILE ONLY) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 pb-1 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center text-orange-600">
          <Store size={22} />
          <span className="text-[10px] font-bold mt-1">Beranda</span>
        </Link>
        <Link href="/categories" className="flex flex-col items-center text-gray-400 hover:text-orange-600 transition">
          <Menu size={22} />
          <span className="text-[10px] mt-1 font-medium">Kategori</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center text-gray-400 hover:text-orange-600 transition relative">
          <ShoppingCart size={22} />
          {/* Badge Keranjang Dinamis untuk Mobile */}
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
              {cartItemCount}
            </span>
          )}
          <span className="text-[10px] mt-1 font-medium">Keranjang</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center text-gray-400 hover:text-orange-600 transition">
          <User size={22} />
          <span className="text-[10px] mt-1 font-medium">{user ? 'Profil' : 'Masuk'}</span>
        </Link>
      </div>

    </div>
  );
}