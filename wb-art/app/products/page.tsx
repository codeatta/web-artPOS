// app/products/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { ShoppingCart, MapPin, Star, FilterX, ArrowLeft } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';
import SearchBar from '@/components/SearchBar';

export const revalidate = 0;

export default async function AllProductsPage(props: { searchParams: Promise<{ search?: string; category?: string }> }) {
  const searchParams = await props.searchParams;
  const search = searchParams.search || '';
  const category = searchParams.category || '';

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

  // 1. QUERY DATABASE DENGAN FILTER PENCARIAN
  let query = supabase
    .from('products')
    .select(`
      product_id, name, price_retail, stock,
      categories ( name ),
      product_images ( image_path, is_primary )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: rawProducts, error } = await query;
  if (error) console.error("Gagal mengambil produk:", error);

  // 2. KATEGORI DINAMIS: Ambil daftar kategori persis seperti yang ada di Database
  const dynamicCategories = Array.from(new Set(
    rawProducts?.map((p: any) => {
      return Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;
    }).filter(Boolean) // Membuang yang kosong/null
  )) as string[];

  // 3. FILTER KATEGORI YANG LEBIH FLEKSIBEL
  let products = rawProducts || [];
  if (category) {
    products = products.filter(p => {
      const catName = Array.isArray(p.categories) ? p.categories[0]?.name : (p.categories as any)?.name;
      if (!catName) return false;
      // Gunakan .includes() agar "Dapur" bisa menangkap "Alat Dapur"
      return catName.toLowerCase().includes(category.toLowerCase());
    });
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const buildUrl = (cat?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cat) params.set('category', cat);
    return `/products?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      
      {/* NAVBAR */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="text-gray-400 hover:text-orange-600 transition p-2 bg-gray-50 rounded-full border border-gray-100 flex-shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 max-w-2xl">
            <SearchBar basePath="/products" />
          </div>
          <Link href="/cart" className="relative text-gray-500 hover:text-orange-600 transition">
                <ShoppingCart size={22} />
                {/* Badge Keranjang Dinamis */}
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                    {cartItemCount}
                  </span>
                )}
              </Link>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* PIL KATEGORI (DINAMIS DARI DATABASE) */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          <Link 
            href={buildUrl('')} 
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition border ${!category ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
          >
            Semua
          </Link>
          {dynamicCategories.map(cat => (
            <Link 
              key={cat} 
              href={buildUrl(cat)} 
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition border ${category.toLowerCase() === cat.toLowerCase() ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* INFO PENCARIAN */}
        {search && (
          <p className="text-sm text-gray-500 mb-4">
            Menampilkan hasil untuk <span className="font-bold text-gray-800">"{search}"</span> 
            {category && <span> di kategori <span className="font-bold text-gray-800">{category}</span></span>}
            . Ditemukan {products.length} produk.
          </p>
        )}

        {/* GRID PRODUK */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {products.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500">
              <FilterX size={48} className="text-gray-300 mb-3" />
              <p>Produk tidak ditemukan.</p>
              <Link href="/products" className="text-orange-600 font-bold mt-2 hover:underline">Hapus semua filter</Link>
            </div>
          ) : (
            products.map((product) => {
              const primaryImgObj = product.product_images?.find((img: any) => img.is_primary);
              const imagePath = primaryImgObj ? primaryImgObj.image_path : (product.product_images?.[0]?.image_path || '/placeholder.jpg');

              return (
                <div key={product.product_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col group">
                  <div className="relative aspect-square bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePath} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                        <span className="bg-white text-stone-800 font-bold px-3 py-1 rounded text-sm shadow-sm">Stok Habis</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-wider">
                      {Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name || 'Umum'}
                    </span>
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug min-h-[40px]">{product.name}</h3>
                    <div className="text-base md:text-lg font-extrabold text-gray-900 mt-2">{formatRupiah(product.price_retail)}</div>
                    <div className="flex items-center gap-1 mt-3 text-gray-500">
                      <MapPin size={12} className="text-orange-500" />
                      <span className="text-xs truncate">Kab. Bantul</span>
                    </div>
                    <div className="mt-auto pt-4">
                      <AddToCartButton productId={product.product_id} stock={product.stock} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
