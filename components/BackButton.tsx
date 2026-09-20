// components/BackButton.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className="text-gray-400 hover:text-orange-600 transition p-2 bg-white rounded-full shadow-sm border border-gray-100 flex-shrink-0"
      title="Kembali ke halaman sebelumnya"
    >
      <ArrowLeft size={20} />
    </button>
  );
}