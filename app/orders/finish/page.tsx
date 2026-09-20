// app/orders/finish/page.tsx
import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export default async function MidtransFinishPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  
  const rawOrderId = searchParams.order_id || '';
  // Jika order_id berupa UUID penuh atau format custom, tangani dengan aman
  const orderId = rawOrderId; 
  const transactionStatus = searchParams.transaction_status;

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Link href="/orders" className="text-orange-600 font-bold hover:underline">
          Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const isSuccess = transactionStatus === 'settlement' || transactionStatus === 'capture';
  const isPending = transactionStatus === 'pending';
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center space-y-6">
        
        {isSuccess ? (
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 size={40} />
          </div>
        ) : isPending ? (
          <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={40} />
          </div>
        ) : (
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={40} />
          </div>
        )}

        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {isSuccess ? 'Pembayaran Berhasil!' : isPending ? 'Menunggu Pembayaran' : 'Pembayaran Gagal'}
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            {isSuccess 
              ? 'Terima kasih! Pembayaran Anda telah dikonfirmasi dan pesanan segera diproses.' 
              : isPending 
              ? 'Silakan selesaikan pembayaran Anda sesuai dengan metode yang telah dipilih.' 
              : 'Maaf, transaksi Anda dibatalkan atau mengalami kendala.'}
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Link 
            href={`/orders/${orderId}`}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-orange-200"
          >
            <FileText size={20} /> Lihat Detail Pesanan
          </Link>
          <Link 
            href="/orders"
            className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center transition"
          >
            Kembali ke Riwayat
          </Link>
        </div>

      </div>
    </div>
  );
}