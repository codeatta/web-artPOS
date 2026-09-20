// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Inisialisasi Supabase untuk Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // 1. Ambil data sesi pengguna yang sedang login
  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 2. Jika belum login mencoba masuk /admin, tendang ke /login
  if (!user && path.startsWith('/admin')) {
    url.pathname = '/login'; // Sesuaikan jika halaman login Anda bernama lain
    return NextResponse.redirect(url);
  }

  // 3. PEMBATASAN HAK AKSES (ROLE-BASED ACCESS CONTROL)
  if (user && path.startsWith('/admin')) {
    
    // Tarik data role dari tabel user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (profile?.role || user.user_metadata?.role || 'kasir').toLowerCase(); // Default aman: jadikan kasir

    // Daftar rute rahasia yang HANYA BOLEH diakses Admin Utama
    const adminOnlyRoutes = ['/admin/reports', '/admin/settings', '/admin/staff'];

    // Cek apakah URL yang dikunjungi cocok dengan daftar rahasia di atas
    const isRestricted = adminOnlyRoutes.some(route => path.startsWith(route));
    
    // Jika dia kasir dan mencoba masuk area terlarang: Tendang ke Dashboard!
    if (userRole === 'kasir' && isRestricted) {
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

// Filter agar middleware tidak berjalan di file statis (gambar, css, dll) untuk menghemat loading
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};