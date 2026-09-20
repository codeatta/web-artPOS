// components/AdminMidtransButton.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { createMidtransTransaction } from '@/app/actions/midtrans';
import { QrCode, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

declare global {
  interface Window { snap: any; }
}

export default function AdminMidtransButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Muat script Midtrans saat komponen dirender
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const scriptSrc = isProd ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
    
    if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.setAttribute('data-client-key', clientKey || '');
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleOpenMidtrans = () => {
    setLoading(true);
    startTransition(async () => {
      const result = await createMidtransTransaction(orderId);
      setLoading(false);

      if (!result.success || !result.token) {
        toast.error(result.message || 'Gagal memuat QRIS Midtrans');
        return;
      }

      if (window.snap) {
        window.snap.pay(result.token, {
          onSuccess: function () {
            toast.success('Pembayaran QRIS Berhasil!');
            // Webhook akan otomatis mengubah status di background
          },
          onPending: function () {
            toast('Menunggu pelanggan menyelesaikan pembayaran...');
          },
          onError: function () {
            toast.error('Pembayaran Gagal');
          },
          onClose: function () {
            toast('Popup ditutup oleh Kasir.');
          }
        });
      }
    });
  };

  return (
    <button 
      onClick={handleOpenMidtrans}
      disabled={loading || isPending}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm mt-3"
    >
      {loading || isPending ? (
        <><Loader2 size={18} className="animate-spin" /> Memuat Barcode...</>
      ) : (
        <><QrCode size={18} /> Tampilkan QRIS / Midtrans</>
      )}
    </button>
  );
}