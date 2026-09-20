// app/admin/products/loading.tsx
import React from 'react';

export default function AdminProductsLoading() {
  return (
    <div className="space-y-6 font-sans animate-pulse">
      
      {/* Skeleton Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-72 bg-gray-100 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
        </div>
      </div>

      {/* Skeleton Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="h-10 w-full max-w-md bg-gray-100 rounded-lg"></div>
      </div>

      {/* Skeleton Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-14 bg-gray-50 border-b border-gray-100"></div>
        
        {/* Looping 5 baris kosong */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center justify-between p-4 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
                <div className="h-3 w-20 bg-gray-100 rounded"></div>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}