// components/NewOrderNotification.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Bell, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Gunakan anon key untuk mendengarkan event publik
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function NewOrderNotification() {
  const [newOrder, setNewOrder] = useState<any>(null);
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Berlangganan (Subscribe) ke event INSERT di tabel orders
    const channel = supabase
      .channel('realtime:orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // Ketika ada baris baru ditambahkan ke tabel orders
          setNewOrder(payload.new);
          setShow(true);
          
          // Memicu Next.js untuk me-refresh data di layar secara otomatis (tanpa F5)
          router.refresh();

          // Sembunyikan notifikasi setelah 8 detik
          setTimeout(() => {
            setShow(false);
          }, 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Bersihkan memori jika komponen ditutup
    };
  }, [router]);

  if (!show || !newOrder) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-8 duration-500">
      <div className="bg-white border-l-4 border-blue-600 shadow-2xl rounded-xl p-4 w-80 flex gap-4 relative">
        
        {/* Tombol Close */}
        <button 
          onClick={() => setShow(false)} 
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>

        {/* Icon Bel Bergetar */}
        <div className="bg-blue-100 p-3 rounded-full h-fit flex-shrink-0">
          <Bell size={24} className="text-blue-600 animate-bounce" />
        </div>

        {/* Konten Notifikasi */}
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Pesanan Baru Masuk!</h3>
          <p className="text-xs text-gray-500 mt-1 mb-2">
            Invoice: <span className="font-semibold text-gray-700">{newOrder.invoice_number || 'Baru'}</span>
          </p>
          
          <Link 
            href={`/admin/orders/${newOrder.order_id}`}
            onClick={() => setShow(false)}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            Lihat Pesanan <ExternalLink size={12} />
          </Link>
        </div>

      </div>
    </div>
  );
}