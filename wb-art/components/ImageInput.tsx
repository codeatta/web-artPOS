// components/ImageInput.tsx
'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function ImageInput() {
  const [preview, setPreview] = useState<string | null>(null);

  // Fungsi untuk membaca file yang dipilih dan membuat URL sementara untuk preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer relative overflow-hidden h-48 group bg-white">
      <input 
        type="file" 
        name="image" 
        accept="image/png, image/jpeg, image/webp" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        required
        onChange={handleImageChange}
      />
      
      {preview ? (
        <>
          {/* Menampilkan gambar yang dipilih */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview Produk" className="absolute inset-0 w-full h-full object-cover" />
          
          {/* Efek hover gelap saat gambar sudah ada agar teks "Ganti Foto" terlihat */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-0">
            <p className="text-white font-bold text-sm tracking-wide">Klik untuk Ganti Foto</p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center p-6">
          <ImageIcon size={32} className="text-gray-400 mb-3" />
          <p className="text-sm font-bold text-gray-700">Pilih Foto Produk</p>
          <p className="text-xs text-gray-500 mt-1">Format: PNG, JPG (Maks. 2MB)</p>
        </div>
      )}
    </div>
  );
}