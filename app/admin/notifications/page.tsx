// app/admin/notifications/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Bell, Send, Trash2, Megaphone } from 'lucide-react';
import { sendBroadcastNotification, deleteNotification } from '@/app/actions/admin-notifications';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'kasir') redirect('/');

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Ambil daftar riwayat notifikasi sistem
  const { data: notifications } = await adminDb
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Server Action internal untuk form submit
  async function handleSend(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;
    if (!title || !message) return;
    await sendBroadcastNotification(title, message);
  }

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;
    await deleteNotification(id);
  }

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Notifikasi & Broadcast</h1>
          <p className="text-sm text-gray-500 mt-1">Kirim pengumuman atau promo ke semua pelanggan toko.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Form Kirim Broadcast */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-1 h-fit">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-base border-b pb-3">
            <Megaphone size={18} className="text-orange-500" /> Buat Siaran Baru
          </h2>
          
          <form action={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Judul Notifikasi</label>
              <input 
                type="text" 
                name="title" 
                placeholder="Contoh: Promo Diskon 50%!" 
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Isi Pesan</label>
              <textarea 
                name="message" 
                rows={4} 
                placeholder="Tulis pesan pengumuman atau informasi untuk pelanggan di sini..." 
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500 text-gray-900 resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-sm text-sm"
            >
              <Send size={16} /> Kirim ke Semua Pelanggan
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Riwayat Notifikasi */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-3 text-base flex items-center gap-2">
            <Bell size={18} className="text-orange-500" /> Riwayat Notifikasi Terkirim
          </h2>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {(!notifications || notifications.length === 0) ? (
              <p className="text-sm text-gray-400 py-8 text-center">Belum ada riwayat notifikasi.</p>
            ) : (
              notifications.map((notif: any) => (
                <div key={notif.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full uppercase">
                        {notif.type || 'info'}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm">{notif.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 pt-1">
                      {new Date(notif.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>

                  {/* Tombol Hapus */}
                  <form action={handleDelete}>
                    <input type="hidden" name="id" value={notif.id} />
                    <button 
                      type="submit" 
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                      title="Hapus Notifikasi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}