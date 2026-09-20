// app/notifications/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bell, Package, Tag, Info } from 'lucide-react';

export const revalidate = 0;

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect ke login jika belum masuk
  if (!user) redirect('/login');

  // Tarik data notifikasi dari database (Jika tabel ada)
  // Jika tabel belum dibuat, kita abaikan error-nya dan pakai data statis sementara
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Data dummy (Jika tabel notifikasi belum ada di database Anda)
  const displayNotifs = (!error && notifications && notifications.length > 0) ? notifications : [
    {
      id: '1',
      title: 'Pembayaran Berhasil!',
      message: 'Hore! Pembayaran untuk invoice INV/20260920/1234 telah kami terima. Pesanan Anda akan segera diproses.',
      type: 'order',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Promo Spesial Gerabah',
      message: 'Gunakan kode DISKON20 untuk mendapatkan potongan harga spesial di pembelian Anda hari ini!',
      type: 'promo',
      is_read: false,
      created_at: new Date(Date.now() - 86400000).toISOString() // 1 hari yang lalu
    }
  ];

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'order': return { icon: Package, color: 'bg-blue-100 text-blue-600' };
      case 'promo': return { icon: Tag, color: 'bg-orange-100 text-orange-600' };
      default: return { icon: Info, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-4 z-10">
          <Link href="/" className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
          </div>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
            Tandai Dibaca
          </button>
        </div>

        {/* List Notifikasi */}
        <div className="space-y-3">
          {displayNotifs.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <Bell size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Belum ada Notifikasi</h2>
              <p className="text-gray-500 text-sm mt-1">Kami akan memberi tahu Anda jika ada info terbaru.</p>
            </div>
          ) : (
            displayNotifs.map((notif: any) => {
              const { icon: Icon, color } = getIconAndColor(notif.type);
              
              return (
                <div 
                  key={notif.id} 
                  className={`bg-white p-4 rounded-xl shadow-sm border transition hover:shadow-md cursor-pointer flex gap-4 ${!notif.is_read ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`text-base line-clamp-1 ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {notif.title}
                      </h3>
                      {!notif.is_read && <span className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0 mt-1.5"></span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-xs font-medium text-gray-400 mt-2 block">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}