// app/login/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // <-- Menggunakan client
import { Store, ArrowRight, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast'; // <-- Mengimpor Toast

// Kita memisahkan form ke dalam komponen agar bisa dibungkus Suspense (wajib di Next.js 15 untuk useSearchParams)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(searchParams.get('message') || '');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Mencegah halaman refresh otomatis
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = searchParams.get('redirect_to') || '/';

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // 1. Toast Jika Gagal
      setErrorMsg('Email atau password salah!');
      toast.error('Gagal masuk. Periksa kembali email & sandi Anda.');
      setLoading(false);
    } else {
      // 2. Toast Jika Sukses
      toast.success('Berhasil masuk! Selamat datang kembali. 🎉');
      
      // Arahkan pengguna ke halaman tujuan & refresh data navbar
      router.push(redirectTo);
      router.refresh(); 
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      {/* Tombol Kembali di Luar Kartu */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4 sm:px-0">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 transition">
          <ArrowLeft size={16} /> Kembali ke Toko
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100 mx-4 sm:mx-0">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-orange-100 rounded-full text-orange-600 flex items-center justify-center mb-4 shadow-sm border border-orange-200">
              <Store size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Selamat Datang</h1>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Masuk untuk mulai berbelanja atau memantau pesanan Anda.
            </p>
          </div>

          {/* Menampilkan pesan error statis (jika ada) */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium leading-snug">{errorMsg}</p>
            </div>
          )}

          {/* Ubah 'action' menjadi 'onSubmit' */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 pl-1" htmlFor="email">
                Alamat Email
              </label>
              <input
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900 transition-all placeholder:text-gray-400"
                name="email"
                id="email"
                type="email"
                placeholder="budi@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 pl-1 pr-1">
                <label className="block text-sm font-bold text-gray-700" htmlFor="password">
                  Kata Sandi
                </label>
                <Link href="#" className="text-xs font-semibold text-orange-600 hover:text-orange-700">Lupa Sandi?</Link>
              </div>
              <input
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900 transition-all placeholder:text-gray-400"
                name="password"
                id="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition shadow-lg mt-2 
                ${loading ? 'bg-orange-400 text-white cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200'}`}
            >
              {loading ? (
                <> <Loader2 size={18} className="animate-spin" /> Memproses... </>
              ) : (
                <> Masuk Sekarang <ArrowRight size={18} /> </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link href="/register" className="font-extrabold text-orange-600 hover:text-orange-700 transition">
                Daftar di sini
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// Komponen Utama yang membungkus form dengan Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>}>
      <LoginForm />
    </Suspense>
  );
}