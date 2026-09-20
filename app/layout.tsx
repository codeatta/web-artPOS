// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TokoART",
  description: "Website Toko Alat Rumah Tangga",
};

// PERBAIKAN TIPE: Gunakan standar React.ReactNode untuk children
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Tambahkan padding bawah di mobile agar konten tidak tertutup menu */}
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: '500',
            },
          }} 
        />
        
        {/* Konten Utama Seluruh Halaman */}
        {children}
        
        {/* Menu Navigasi Bawah (Hanya muncul di Layar HP) */}
        <MobileBottomNav />
        
      </body>
    </html>
  );
}