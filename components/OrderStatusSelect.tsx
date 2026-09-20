// components/OrderStatusSelect.tsx
'use client';

import React, { useTransition } from 'react';
import { updateOrderStatus } from '@/app/actions/order';
import { Loader2 } from 'lucide-react';

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    
    // Gunakan transisi agar UI tidak membeku (freeze) saat memanggil API
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (!result.success) {
        alert(`Gagal: ${result.message}`);
      }
    });
  };

  // Logika pewarnaan badge/select berdasarkan status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className={`appearance-none border text-xs font-bold rounded-full px-3 py-1.5 outline-none cursor-pointer text-center w-full min-w-[140px] transition shadow-sm ${getStatusColor(currentStatus)} ${isPending ? 'opacity-50 cursor-wait' : 'hover:brightness-95'}`}
      >
        <option value="pending_payment">Menunggu Bayar</option>
        <option value="paid">Lunas (Perlu Diproses)</option>
        <option value="processing">Sedang Diproses</option>
        <option value="shipped">Dikirim</option>
        <option value="delivered">Selesai (Diterima)</option>
        <option value="cancelled">Dibatalkan</option>
      </select>
      
      {/* Menampilkan ikon loading jika sedang memproses */}
      {isPending && (
        <Loader2 size={14} className="absolute right-2 text-gray-500 animate-spin" />
      )}
    </div>
  );
}