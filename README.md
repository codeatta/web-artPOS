# TokoART - E-Commerce & Point of Sale (POS) System

TokoART adalah platform terintegrasi yang menggabungkan sistem *e-commerce* untuk pelanggan *online* dan sistem kasir (POS) untuk transaksi fisik di toko. Proyek ini dibangun menggunakan arsitektur Next.js (App Router) dengan backend Supabase, memastikan sinkronisasi data yang mulus antara stok *online* dan *offline*.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS)
- **Payment Gateway:** [Midtrans](https://midtrans.com/) (Snap API & Webhooks)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/)

## ✨ Fitur Utama

- **Dual Checkout System:** Mendukung *checkout* mandiri oleh pelanggan (E-Commerce) dan pembuatan pesanan manual oleh kasir (POS).
- **Pembayaran Otomatis & Manual:** Integrasi Midtrans untuk Virtual Account dan QRIS otomatis, serta pencatatan pembayaran Tunai (lengkap dengan kalkulasi kembalian).
- **Webhook Synchronization:** Status pesanan dan pembayaran (Tabel `orders` & `payments`) otomatis diperbarui secara serentak via Midtrans Webhook.
- **Role-Based Access Control (RBAC):** Pemisahan hak akses khusus untuk `admin`, `kasir`, `customer`, dan `reseller`.
- **Manajemen Voucher Dinamis:** Validasi kode promo dan diskon langsung dari *database* dengan perhitungan *subtotal* otomatis.
- **Admin Dashboard Responsif:** Menggunakan sistem *Off-Canvas Sidebar* yang ramah *mobile* untuk manajemen pesanan, produk, dan notifikasi.

## 🚀 Getting Started

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara lokal.

### 1. Clone Repository
```bash
git clone https://github.com/username-anda/tokoart.git
cd tokoart
```

### 2. Install Dependencies
```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root direktori Anda dan isi dengan kredensial berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Midtrans Configuration (Ganti ke Production jika sudah live)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```
*(Catatan: Jangan pernah mengunggah nilai `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` ke sisi klien (browser) atau ke repositori publik).*

### 4. Jalankan Development Server
```bash
npm run dev
# atau
yarn dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## 🔗 Pengaturan Midtrans Webhook
Agar sistem dapat menerima status pembayaran otomatis dari Midtrans, pastikan Anda mendaftarkan URL aplikasi Anda di Dashboard Midtrans (Settings > Configuration):

**Notification URL:** `https://domain-anda.com/api/midtrans-webhook`

## 📦 Deploy di Vercel
Cara termudah untuk melakukan deploy aplikasi Next.js ini adalah menggunakan Vercel:

1. Hubungkan repositori GitHub Anda ke Vercel.
2. Masukkan semua Environment Variables di atas pada menu pengaturan proyek di Vercel.
3. Klik Deploy.