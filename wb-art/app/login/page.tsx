// app/login/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Pastikan path benar
import { Store, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Di Next.js 15, searchParams adalah Promise
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect_to?: string }>;
}) {
  // 1. Await searchParams (Standar baru Next.js 15)
  const resolvedParams = await searchParams;

  // 2. SERVER ACTION: Logika proses login
  const signIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirect_to') as string || '/';

    // PERUBAHAN PENTING: Gunakan 'await' karena createClient sekarang async
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect(`/login?message=Email atau password salah!&redirect_to=${redirectTo}`);
    }

    return redirect(redirectTo);
  };

  // 3. UI: Render Antarmuka
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-100 rounded-full text-blue-700 mb-4">
            <Store size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat Datang</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Masuk untuk melanjutkan belanja alat rumah tangga atau akses dashboard Anda.
          </p>
        </div>

        {/* Tampilkan error/notifikasi dari resolvedParams */}
        {resolvedParams.message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{resolvedParams.message}</p>
          </div>
        )}

        <form action={signIn} className="space-y-5">
          <input 
            type="hidden" 
            name="redirect_to" 
            value={resolvedParams.redirect_to || '/'} 
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              name="email"
              id="email"
              type="email"
              placeholder="budi@email.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
            </div>
            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
              name="password"
              id="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md mt-6"
          >
            Masuk <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-800 transition">
            Daftar sekarang
          </Link>
        </p>

      </div>
    </div>
  );
}