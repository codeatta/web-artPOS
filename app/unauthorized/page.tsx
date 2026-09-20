// app/unauthorized/page.tsx
import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans selection:bg-red-100">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full text-center relative overflow-hidden">
        
        {/* Aksen visual atas */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>

        {/* Ikon */}
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Akses Ditolak</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Maaf, Anda tidak memiliki izin untuk melihat halaman ini. Area tersebut dikhususkan untuk Administrator dan Staf internal toko.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link 
            href="/" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Home size={18} /> Kembali ke Beranda
          </Link>
          
          <Link 
            href="/login" 
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft size={18} /> Login dengan Akun Staf
          </Link>
        </div>

      </div>
    </div>
  );
}