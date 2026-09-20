// app/loading.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center animate-in fade-in zoom-in duration-300">
        <Loader2 size={48} className="text-orange-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-gray-900">Memuat Data...</h2>
        <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
}