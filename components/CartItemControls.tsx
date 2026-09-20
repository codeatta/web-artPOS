// components/CartItemControls.tsx
'use client';

import React, { useTransition } from 'react';
import { updateCartItem } from '@/app/actions/cartUpdate';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';

interface Props {
  cartId: string;
  quantity: number;
}

export default function CartItemControls({ cartId, quantity }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (action: 'increase' | 'decrease' | 'remove') => {
    startTransition(async () => {
      await updateCartItem(cartId, action, quantity);
    });
  };

  return (
    <div className="flex items-center gap-4 mt-3">
      {/* Tombol Plus Minus */}
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
        <button 
          onClick={() => handleUpdate('decrease')} 
          disabled={isPending} 
          className="p-2 text-gray-500 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 transition"
        >
          <Minus size={16} />
        </button>
        <span className="w-10 text-center text-sm font-bold text-gray-800 flex justify-center">
          {isPending ? <Loader2 size={16} className="animate-spin text-orange-500"/> : quantity}
        </span>
        <button 
          onClick={() => handleUpdate('increase')} 
          disabled={isPending} 
          className="p-2 text-gray-500 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 transition"
        >
          <Plus size={16} />
        </button>
      </div>
      
      {/* Tombol Hapus */}
      <button 
        onClick={() => handleUpdate('remove')} 
        disabled={isPending} 
        className="text-gray-400 hover:text-red-500 p-2 disabled:opacity-50 transition flex items-center gap-1 text-sm font-medium"
      >
        <Trash2 size={18} /> <span className="hidden sm:inline">Hapus</span>
      </button>
    </div>
  );
}