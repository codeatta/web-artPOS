// middleware.ts (Di root directory)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Panggil fungsi updateSession yang berisi logika proteksi rute
  return await updateSession(request)
}

// Menentukan rute mana saja yang memicu middleware ini berjalan
export const config = {
  matcher: [
    /*
     * Jalankan di semua rute KECUALI:
     * - _next/static (file statis CSS/JS)
     * - _next/image (optimasi gambar Next.js)
     * - favicon.ico (ikon website)
     * - Semua file aset gambar/media (svg, png, jpg, webp, dll)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}