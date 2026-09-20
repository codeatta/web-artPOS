// components/ImagePreviewInput.tsx
'use client';

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function ImagePreviewInput({ currentImage }: { currentImage?: string }) {
  // State untuk menyimpan URL gambar sementara (preview)
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Buat URL sementara untuk gambar yang baru dipilih
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(currentImage || null);
    }
  };

  return (
    <div className="space-y-4">
      {preview && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Pratinjau Foto:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm transition-opacity duration-300" />
        </div>
      )}

      <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-blue-50 transition cursor-pointer relative overflow-hidden group">
        <input 
          type="file" 
          name="image" 
          accept="image/png, image/jpeg, image/webp" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={handleImageChange}
        />
        <ImageIcon size={28} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
        <p className="text-sm font-bold text-blue-700">Pilih Foto Baru</p>
        <p className="text-xs text-blue-500 mt-1">Atau biarkan kosong jika tidak diubah</p>
      </div>
    </div>
  );
}