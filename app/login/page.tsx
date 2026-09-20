// app/login/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Store, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect_to?: string }>;
}) {
  const resolvedParams = await searchParams;

  const signIn = async (formData: FormData) => {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirect_to') as string || '/';

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return redirect(`/login?message=Email atau password salah!&redirect_to=${redirectTo}`);
    }
    return redirect(redirectTo);
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 flex flex-col md:items-center md:justify-center">
      
      {/* Tombol Kembali (Mobile Friendly) */}
      <div className="p-4 md:hidden absolute top-0 left-0 w-full z-10">
        <Link href="/" className="inline-flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* Kontainer Utama */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:p-8 md:bg-white md:shadow-xl md:rounded-3xl md:border md:border-gray-100 w-full md:max-w-md relative mt-8 md:mt-0">
        
        {/* Tombol Kembali (Desktop View) */}
        <div className="hidden md:block absolute top-6 left-6">
          <Link href="/" className="text-gray-400 hover:text-orange-600 transition flex items-center gap-1 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </Link>
        </div>

        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8 mt-4 md:mt-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full text-orange-600 flex items-center justify-center mb-4 shadow-sm border border-orange-200">
            <Store size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Selamat Datang</h1>
          <p className="text-sm text-gray-500 mt-2 text-center px-4">
            Masuk untuk mulai berbelanja atau memantau pesanan Anda.
          </p>
        </div>

        {/* Notifikasi Error */}
        {resolvedParams.message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium leading-snug">{resolvedParams.message}</p>
          </div>
        )}

        {/* Form Login */}
        <form action={signIn} className="space-y-5">
          <input 
            type="hidden" 
            name="redirect_to" 
            value={resolvedParams.redirect_to || '/'} 
          />

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 pl-1" htmlFor="email">
              Alamat Email
            </label>
            <input
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900 transition-all placeholder:text-gray-400"
              name="email"
              id="email"
              type="email"
              placeholder="budi@email.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 pl-1 pr-1">
              <label className="block text-sm font-bold text-gray-700" htmlFor="password">
                Kata Sandi
              </label>
              {/* Fitur Lupa Sandi bisa ditambahkan di sini nantinya */}
              <Link href="#" className="text-xs font-semibold text-orange-600 hover:text-orange-700">Lupa Sandi?</Link>
            </div>
            <input
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900 transition-all placeholder:text-gray-400"
              name="password"
              id="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-orange-200 mt-2 active:scale-[0.98]"
          >
            Masuk Sekarang <ArrowRight size={18} />
          </button>
        </form>

        {/* Link Pendaftaran */}
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
  );
}