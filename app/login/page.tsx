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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      {/* Tombol Kembali di Luar Kartu (Posisi Kiri Atas) */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4 sm:px-0">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 transition">
          <ArrowLeft size={16} /> Kembali ke Toko
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Kontainer Kartu */}
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

          {resolvedParams.message && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium leading-snug">{resolvedParams.message}</p>
            </div>
          )}

          <form action={signIn} className="space-y-5">
            <input type="hidden" name="redirect_to" value={resolvedParams.redirect_to || '/'} />

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
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-orange-200 mt-2"
            >
              Masuk Sekarang <ArrowRight size={18} />
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