// app/admin/orders/add/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import AdminAddOrderForm from '@/components/AdminAddOrderForm';

export const revalidate = 0;

export default async function AdminAddOrderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user?.id)
      .single();
  
    const isAdmin = profile?.role === 'admin' || profile?.role === 'kasir';
  
    if (!isAdmin) {
      redirect('/unauthorized');
    }

  // Ambil semua produk aktif untuk keperluan pencarian di form kasir
  const { data: products } = await supabase
    .from('products')
    .select('product_id, name, sku, price_retail, stock')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="space-y-6 text-gray-700 font-sans">
      
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pesanan Manual</h1>
          <p className="text-gray-500 mt-1 text-sm">Point of Sale (POS) - Masukkan pesanan dari WhatsApp atau pembeli langsung.</p>
        </div>
      </div>

      {/* Render Mesin Kasir / Formulir Interaktif */}
      <AdminAddOrderForm products={products || []} />
      
    </div>
  );
}