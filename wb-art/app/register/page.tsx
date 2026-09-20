// app/register/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Pastikan path benar
import { UserPlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  // 1. Await searchParams (Standar baru Next.js 15)
  const resolvedParams = await searchParams;
  
  // 2. SERVER ACTION: Logika pendaftaran
  const signUp = async (formData: FormData) => {
    'use server';

    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // PERUBAHAN PENTING: Gunakan 'await' 
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      return redirect(`/register?message=${encodeURIComponent(error.message)}`);
    }

    return redirect(`/login?message=${encodeURIComponent('Pendaftaran berhasil! Silakan cek kotak masuk (inbox/spam) email Anda untuk verifikasi akun.')}`);
  };

  // 3. UI: Render Antarmuka
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gray-50 py-10">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-green-100 rounded-full text-green-700 mb-4">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Akun Baru</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Lengkapi data diri Anda untuk mulai berbelanja.
          </p>
        </div>

        {resolvedParams.message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{resolvedParams.message}</p>
          </div>
        )}

        <form action={signUp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
              Nama Lengkap
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
              name="fullName"
              id="fullName"
              type="text"
              placeholder="Misal: Budi Santoso"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
              Nomor HP / WhatsApp
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
              name="phone"
              id="phone"
              type="tel"
              placeholder="081234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
              name="email"
              id="email"
              type="email"
              placeholder="budi@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
              name="password"
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md mt-6"
          >
            Daftar Sekarang
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-green-600 hover:text-green-800 transition">
            Masuk di sini
          </Link>
        </p>

      </div>
    </div>
  );
}