// components/PaymentButton.tsx
'use client';

import React, { useTransition } from 'react';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { simulatePayment } from '@/app/actions/payment';

interface Props {
  orderId: string;
  invoiceNumber: string;
  currentStatus: string;
}

export default function PaymentButton({ orderId, invoiceNumber, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  // Jika sudah dibayar, tampilkan tombol hijau (Non-aktif)
  if (currentStatus !== 'pending_payment') {
    return (
      <div className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-100 text-green-700 border border-green-200 font-bold py-2.5 px-6 rounded-lg cursor-default shadow-sm">
        <CheckCircle size={18} /> Lunas
      </div>
    );
  }

  // Jika belum bayar, tampilkan tombol interaktif
  return (
    <button 
      onClick={() => {
        startTransition(async () => {
          await simulatePayment(orderId, invoiceNumber);
        });
      }}
      disabled={isPending}
      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md shadow-orange-200 transition disabled:opacity-75 disabled:cursor-wait"
    >
      {isPending ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
      {isPending ? 'Verifikasi Bank...' : 'Simulasi Bayar'}
    </button>
  );
}