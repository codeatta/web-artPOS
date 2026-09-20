// app/orders/[id]/payment/page.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createMidtransTransaction } from '@/app/actions/midtrans';
import { CreditCard, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // <--- Import Toast

declare global {
  interface Window {
    snap: any;
  }
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // 1. Muat Script Midtrans Snap
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const scriptSrc = isProd 
      ? 'https://app.midtrans.com/snap/snap.js' 
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.setAttribute('data-client-key', clientKey || '');
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 2. Fungsi Buka Popup Midtrans Snap dengan Toast
  const handleOpenPaymentModal = () => {
    setLoading(true);
    setErrorMessage('');

    startTransition(async () => {
      const result = await createMidtransTransaction(orderId);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.message || 'Gagal membuat sesi pembayaran.');
        toast.error('Gagal menghubungkan ke sistem pembayaran.');
        return;
      }

      if (result.token && window.snap) {
        toast.success('Sesi pembayaran siap! Silakan pilih metode pembayaran.');
        
        window.snap.pay(result.token, {
          onSuccess: function (res: any) {
            toast.success('Pembayaran Berhasil! 🎉');
            router.push(`/orders/finish?order_id=${orderId}&transaction_status=settlement`);
          },
          onPending: function (res: any) {
            toast('Menunggu konfirmasi pembayaran Anda.', { icon: '⏳' });
            router.push(`/orders/finish?order_id=${orderId}&transaction_status=pending`);
          },
          onError: function (res: any) {
            toast.error('Pembayaran Gagal! Silakan coba lagi.');
          },
          onClose: function () {
            toast('Popup pembayaran ditutup.', { icon: '⚠️' });
          }
        });
      } else {
        setErrorMessage('Midtrans Snap gagal dimuat di browser.');
        toast.error('Gagal memuat modul pembayaran.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center space-y-6">
        
        <div className="flex items-center justify-start">
          <Link href={`/orders/${orderId}`} className="p-2 text-gray-500 hover:text-gray-900 transition bg-gray-50 rounded-xl">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-orange-200">
          <CreditCard size={32} />
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Selesaikan Pembayaran</h1>
          <p className="text-gray-500 text-sm mt-1">Lakukan pembayaran aman menggunakan QRIS, Virtual Account, E-Wallet, atau Kartu Kredit.</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        <button 
          onClick={handleOpenPaymentModal}
          disabled={loading || isPending}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-orange-200 cursor-pointer"
        >
          {loading || isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Menghubungkan...
            </>
          ) : (
            <>
              <ShieldCheck size={20} /> Bayar Sekarang
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-400">
          Transaksi dienkripsi dengan standar keamanan perbankan tinggi oleh Midtrans.
        </p>

      </div>
    </div>
  );
}