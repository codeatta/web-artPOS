// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Setup bawaan Next.js untuk memodifikasi response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Inisialisasi Supabase menggunakan cookie dari NextRequest
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Mengambil user aktif dari Supabase (ini juga otomatis menyegarkan token yang expired)
  const { data: { user } } = await supabase.auth.getUser()

  // ==========================================
  // LOGIKA PROTEKSI RUTE (ROUTE GUARDING)
  // ==========================================
  
  // Jika pengguna mencoba mengakses rute yang dimulai dengan /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 1. Jika tidak ada user (belum login)
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect_to', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // 2. Jika sudah login, cek role di tabel user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    // 3. Jika bukan admin, tolak akses dan lempar ke beranda
    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // (Opsional) Proteksi rute customer, misal: /cart, /checkout, /profile
  const protectedRoutes = ['/cart', '/checkout', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect_to', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Kembalikan response asli jika semua pengecekan aman
  return supabaseResponse
}