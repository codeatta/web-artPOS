// components/AddToCartButton.tsx
'use client'; // Wajib karena menggunakan onClick dan Hooks

import React, { useTransition } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { addToCart } from '@/app/actions/cart';
import { useRouter } from 'next/navigation';

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
          alert(result.message);
          // Jika belum login, tendang ke halaman login
          router.push('/login');
        } else {
          alert(`Gagal: ${result.message}`);
        }
      } else {
        // Tampilkan pesan sukses (Di proyek asli, Anda bisa mengganti alert dengan Toast/Snackbar)
        alert(result.message);
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