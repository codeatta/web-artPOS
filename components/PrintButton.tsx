// components/PrintButton.tsx
'use client';

import React, { useEffect } from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton() {
  // Otomatis munculkan dialog print saat halaman pertama kali dibuka
  useEffect(() => {
    setTimeout(() => {
      window.print();
    }, 500); // Jeda setengah detik agar gambar/logo termuat dulu
  }, []);

  return (
    <button 
      onClick={() => window.print()} 
      className="print:hidden fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition"
      title="Cetak Sekarang"
    >
      <Printer size={24} />
    </button>
  );
}   