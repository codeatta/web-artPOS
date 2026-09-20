// components/AddToCartButton.tsx
'use client'; // Wajib karena menggunakan onClick dan Hooks

import React, { useTransition } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { addToCart } from '@/app/actions/cart';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AddToCartButtonProps {
  productId: string;
  stock: number;
}

export default function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const router = useRouter();
  
  // useTransition memungkinkan kita membuat status loading 
  // selagi menunggu Server Action selesai bekerja
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = () => {
    startTransition(async () => {
      // Panggil Server Action
      const result = await addToCart(productId);

      if (!result.success) {
        if (result.requireAuth) {
          toast.error('Anda harus login terlebih dahulu untuk menambahkan ke keranjang.', {
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: '500',
            },
          });
          // Jika belum login, tendang ke halaman login
          router.push('/login');
        } else {
          toast.error(`Gagal: ${result.message}`, {
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: '500',
            },
          });
        }
      } else {
        toast.success('Barang berhasil ditambahkan ke keranjang! 🛒', {
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            fontWeight: '500',
          },
        });
        router.refresh(); // Refresh halaman agar jumlah item di keranjang terupdate
      }
    });
  };

  const isOutOfStock = stock <= 0;

  return (
    <button 
      onClick={handleAddToCart}
      disabled={isOutOfStock || isPending}
      className={`w-full py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2
        ${!isOutOfStock 
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-transparent' 
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }
        ${isPending ? 'opacity-70 cursor-wait' : ''}
      `}
    >
      {/* Jika isPending aktif, tampilkan ikon spinner berputar */}
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <ShoppingCart size={16} />
      )}
      
      {isPending ? 'Memproses...' : isOutOfStock ? 'Stok Kosong' : '+ Keranjang'}
    </button>
  );
}