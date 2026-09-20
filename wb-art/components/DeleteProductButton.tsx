// components/DeleteProductButton.tsx
'use client';

import React, { useTransition } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteProductAction } from '@/app/actions/product';

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // Dialog konfirmasi bawaan browser
    if (window.confirm('Yakin ingin menghapus produk ini? Produk yang pernah dibeli tidak akan terhapus permanen melainkan di-nonaktifkan demi menjaga riwayat transaksi.')) {
      startTransition(async () => {
        await deleteProductAction(productId);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50 inline-flex items-center justify-center" 
      title="Hapus Produk"
    >
      {isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  );
}