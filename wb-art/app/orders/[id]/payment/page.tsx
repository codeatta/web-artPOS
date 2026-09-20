// app/orders/[id]/payment/page.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createMidtransTransaction } from '@/app/actions/midtrans';
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// Deklarasi tipe global untuk Midtrans Snap di window browser
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
  const [snapToken, setSnapToken] = useState('');
  const [isPending, startTransition] = useTransition();

  // 1. Muat Script Midtrans Snap secara dinamis saat halaman dibuka
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

  // 2. Fungsi untuk Meminta Token & Membuka Popup Midtrans Snap
  const handleOpenPaymentModal = () => {
    setLoading(true);
    setErrorMessage('');

    startTransition(async () => {
      const result = await createMidtransTransaction(orderId);
      setLoading(false);

      if (!result.success) {
        setErrorMessage(result.message || 'Gagal membuat sesi pembayaran.');
        return;
      }

      if (result.token && window.snap) {
        setSnapToken(result.token);
        
        // Buka Popup Midtrans Snap
        window.snap.pay(result.token, {
          onSuccess: function (result: any) {
            alert("Pembayaran berhasil!");
            router.push(`/orders?success=true`);
          },
          onPending: function (result: any) {
            alert("Menunggu pembayaran Anda.");
            router.push(`/orders`);
          },
          onError: function (result: any) {
            alert("Pembayaran gagal! Silakan coba lagi.");
          },
          onClose: function () {
            console.log('Popup pembayaran ditutup tanpa menyelesaikan transaksi.');
          }
        });
      } else {
        setErrorMessage('Midtrans Snap gagal dimuat di browser.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center space-y-6">
        
        <div className="flex items-center justify-start">
          <Link href="/orders" className="p-2 text-gray-500 hover:text-gray-900 transition bg-gray-50 rounded-xl">
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CreditCard size={32} />
        </div>

        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Selesaikan Pembayaran</h1>
          <p className="text-gray-500 text-sm mt-1">Lakukan pembayaran aman menggunakan QRIS, Virtual Account, E-Wallet, atau Kartu Kredit via Midtrans.</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        <button 
          onClick={handleOpenPaymentModal}
          disabled={loading || isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-200"
        >
          {loading || isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Menghubungkan ke Midtrans...
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