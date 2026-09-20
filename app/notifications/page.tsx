// app/notifications/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Bell, Package, Tag, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // 1. Tarik Notifikasi Asli dari Database
  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setNotifications(data);
      setLoading(false);
    }
    loadNotifications();
  }, [router, supabase]);

  // 2. Fungsi Tandai Semua Dibaca
  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update UI seketika agar terasa cepat
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    
    // Update ke Database di belakang layar
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    router.refresh(); // Segarkan header agar angka lonceng hilang
  };

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'order': return { icon: Package, color: 'bg-blue-100 text-blue-600' };
      case 'promo': return { icon: Tag, color: 'bg-orange-100 text-orange-600' };
      case 'message': return { icon: Info, color: 'bg-green-100 text-green-600' };
      default: return { icon: Bell, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  const hasUnread = notifications.some(n => !n.is_read);

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
          {hasUnread && (
            <button 
              onClick={markAllAsRead} 
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <CheckCircle2 size={16} /> Tandai Dibaca
            </button>
          )}
        </div>

        {/* List Notifikasi */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <Bell size={32} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Belum ada Notifikasi</h2>
              <p className="text-gray-500 text-sm mt-1">Kami akan memberi tahu Anda jika ada info terbaru.</p>
            </div>
          ) : (
            notifications.map((notif: any) => {
              const { icon: Icon, color } = getIconAndColor(notif.type);
              
              return (
                <div key={notif.id} className={`bg-white p-4 rounded-xl shadow-sm border transition hover:shadow-md cursor-pointer flex gap-4 ${!notif.is_read ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 opacity-75'}`}>
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
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-xs font-medium text-gray-400 mt-2 block">{formatDate(notif.created_at)}</span>
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