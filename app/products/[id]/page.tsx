// app/products/[id]/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Store, MapPin, Star, ShieldCheck, Truck } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';
import BackButton from '@/components/BackButton';

export const revalidate = 60; 

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  
  const supabase = await createClient();

  // 1. AMBIL DETAIL PRODUK UTAMA
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (name),
      product_images (image_path, is_primary)
    `)
    .eq('product_id', productId)
    .single();

  if (error || !product) {
    notFound(); 
  }

  // 2. AMBIL PRODUK TERKAIT (Kategori sama, hindari ID yang sedang dibuka)
  const { data: relatedProducts } = await supabase
    .from('products')
    .select(`
      product_id,
      name,
      price_retail,
      stock,
      categories (name),
      product_images (image_path, is_primary)
    `)
    .eq('is_active', true)
    .eq('category_id', product.category_id)
    .neq('product_id', productId) // Jangan tampilkan produk yang sama
    .limit(4); // Tampilkan maksimal 4 produk

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const catName = Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name;
  
  const sortedImages = product.product_images?.sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)) || [];
  const mainImage = sortedImages[0]?.image_path || '/placeholder.jpg';
  const originalPrice = product.price_retail * 1.25; 

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HEADER NAVBAR */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <BackButton />
          <div className="flex-1 text-center font-bold text-gray-800 line-clamp-1 pr-10">
            Detail Produk
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        
        {/* BAGIAN UTAMA DETAIL PRODUK */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="flex flex-col md:flex-row">
            
            {/* KIRI: FOTO */}
            <div className="md:w-1/2 p-4 md:p-8 bg-gray-50/50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
              <div className="w-full aspect-square bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-white text-stone-800 font-extrabold px-6 py-2 rounded-lg text-lg shadow-lg uppercase tracking-wider">Stok Habis</span>
                  </div>
                )}
              </div>
              
              {sortedImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto w-full pb-2">
                  {sortedImages.map((img: any, idx: number) => (
                    <div key={idx} className="w-16 h-16 rounded-md border-2 border-orange-500 overflow-hidden flex-shrink-0 cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image_path} alt="thumbnail" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KANAN: INFORMASI & TOMBOL */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
              <span className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full w-max border border-orange-100">
                {catName || 'Umum'}
              </span>
              
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <span className="flex items-center gap-1"><Star size={16} className="text-amber-400 fill-amber-400" /> 4.9 (100+ Ulasan)</span>
                <span>•</span>
                <span>Terjual 250+</span>
                <span>•</span>
                <span className="font-mono">SKU: {product.sku || '-'}</span>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-extrabold text-orange-600 mb-1">
                  {formatRupiah(product.price_retail)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Diskon 20%</span>
                  <span className="text-sm text-gray-400 line-through">{formatRupiah(originalPrice)}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="flex items-center gap-3"><MapPin size={18} className="text-gray-400" /> Dikirim dari <span className="font-bold text-gray-800">Kab. Bantul</span></p>
                <p className="flex items-center gap-3"><Truck size={18} className="text-gray-400" /> Ongkir mulai dari Rp 10.000</p>
                <p className="flex items-center gap-3"><ShieldCheck size={18} className="text-green-500" /> Garansi pengiriman aman (Pecah ganti baru)</p>
              </div>

              <div className="mb-8 flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Deskripsi Produk</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description || "Tidak ada deskripsi untuk produk ini."}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-6 mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 font-medium">Stok Tersedia:</span>
                  <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-md">{product.stock} pcs</span>
                </div>
                <div className="w-full">
                  <AddToCartButton productId={product.product_id} stock={product.stock} />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* SECTION PRODUK TERKAIT */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mb-8 pt-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
              Mungkin Anda Juga Suka
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => {
                const relPrimaryImg = relProduct.product_images?.find((img: any) => img.is_primary)?.image_path 
                  || relProduct.product_images?.[0]?.image_path 
                  || '/placeholder.jpg';
                const relCatName = Array.isArray(relProduct.categories) ? relProduct.categories[0]?.name : (relProduct.categories as any)?.name;

                return (
                  <div key={relProduct.product_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition duration-300 flex flex-col group">
                    
                    <Link href={`/products/${relProduct.product_id}`} className="relative aspect-square bg-stone-100 block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={relPrimaryImg} alt={relProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                      {relProduct.stock <= 0 && (
                        <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="bg-white text-stone-800 font-bold px-3 py-1 rounded text-sm shadow-sm">Stok Habis</span>
                        </div>
                      )}
                    </Link>

                    <div className="p-3 flex flex-col flex-1">
                      <span className="text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-wider line-clamp-1">
                        {relCatName || 'Umum'}
                      </span>
                      <Link href={`/products/${relProduct.product_id}`} className="hover:text-orange-600 transition">
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[40px]">
                          {relProduct.name}
                        </h3>
                      </Link>
                      <div className="text-base font-extrabold text-gray-900 mt-2">
                        {formatRupiah(relProduct.price_retail)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-600 font-medium">4.9</span>
                      </div>
                      <div className="mt-auto pt-4 relative z-10">
                        <AddToCartButton productId={relProduct.product_id} stock={relProduct.stock} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}