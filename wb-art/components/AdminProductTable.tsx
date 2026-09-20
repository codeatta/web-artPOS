// components/AdminProductTable.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Edit, Image as ImageIcon, Search } from 'lucide-react';
import DeleteProductButton from '@/components/DeleteProductButton';

export default function AdminProductTable({ initialProducts }: { initialProducts: any[] }) {
  const [searchKeyword, setSearchKeyword] = useState('');

  // PERBAIKAN: Amankan filter dengan konversi string yang aman dari nilai null/undefined
  const filteredProducts = initialProducts.filter((product) => {
    const keyword = searchKeyword.toLowerCase().trim();
    const productName = (product.name || "").toLowerCase();
    const productSku = (product.sku || "").toLowerCase();
    
    return productName.includes(keyword) || productSku.includes(keyword);
  });

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

  return (
    <div className="space-y-6">
      {/* KOTAK PENCARIAN INSTAN */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari nama produk atau kode SKU (Instan)..." 
            className="w-full pl-10 pr-4 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        {searchKeyword && (
          <span className="text-sm text-gray-500 font-medium">
            Menemukan {filteredProducts.length} hasil
          </span>
        )}
      </div>

      {/* TABEL PRODUK */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium w-16">Foto</th>
                <th className="px-6 py-4 font-medium">Info Produk</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium">Harga (Retail)</th>
                <th className="px-6 py-4 font-medium text-center">Stok</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Produk atau SKU tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const catName = Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name;

                  const images = product.product_images || [];
                  const primaryImg = Array.isArray(images) 
                    ? images.find((img: any) => img.is_primary)?.image_path || images[0]?.image_path 
                    : (images as any)?.image_path;
                  
                  return (
                    <tr key={product.product_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3">
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                          {primaryImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={primaryImg} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-bold text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku || '-'}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                          {catName || 'Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-800">
                        {formatRupiah(product.price_retail)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-sm font-bold ${product.stock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right space-x-2 whitespace-nowrap">
                        <Link href={`/admin/products/edit/${product.product_id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition inline-flex items-center justify-center" title="Edit Produk">
                          <Edit size={18} />
                        </Link>
                        <DeleteProductButton productId={product.product_id} />
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}