// components/AdminOrderStatusSelect.tsx
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { updateOrderStatus } from '@/app/actions/adminOrders';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  orderId: string;
  currentStatus: string;
}

export default function AdminOrderStatusSelect({ orderId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  
  // STATE BARU: Untuk menampilkan notifikasi sukses
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    
    if (newStatus === 'cancelled' && !window.confirm('Yakin ingin membatalkan pesanan ini?')) {
      e.target.value = selectedStatus; 
      return;
    }

    setSelectedStatus(newStatus);

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result && !result.success) {
        alert(`Gagal merubah status: ${result.message}`);
        setSelectedStatus(currentStatus);
      } else {
        // LOGIKA BARU: Jika sukses, munculkan notifikasi lalu hilangkan setelah 3 detik
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      }
    });
  };

  const getColorClass = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-500';
      case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500';
      case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-500';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      <div className="relative">
        <select
          value={selectedStatus}
          onChange={handleStatusChange}
          disabled={isPending}
          className={`w-full text-xs font-bold px-3 py-2 rounded-lg border outline-none appearance-none pr-8 cursor-pointer transition ${getColorClass(selectedStatus)} disabled:opacity-50`}
        >
          <option value="pending_payment">Menunggu Pembayaran</option>
          <option value="paid">Lunas (Perlu Diproses)</option>
          <option value="processing">Sedang Diproses/Dikemas</option>
          <option value="shipped">Sedang Dikirim</option>
          <option value="delivered">Selesai (Diterima)</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
        
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current">
          {isPending ? (
            <Loader2 size={14} className="animate-spin text-gray-500" />
          ) : (
            <svg className="fill-current h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          )}
        </div>
      </div>

      {/* POP-UP NOTIFIKASI MELAYANG (TOAST) */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 border border-green-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300">
          <CheckCircle2 size={24} className="text-white drop-shadow-sm" />
          <div>
            <p className="text-sm font-extrabold tracking-wide">Status Diperbarui!</p>
            <p className="text-xs text-green-100 mt-0.5">Status pesanan telah berhasil diperbarui.</p>
          </div>
        </div>
      )}
    </>
  );
}