// app/admin/procurement/page.tsx
import React from 'react';
import { checkAdminAccess } from '@/utils/adminGuard';
import ProcurementManager from '@/components/ProcurementManager';
import { Truck } from 'lucide-react';

export const revalidate = 0;

export default async function ProcurementPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  await props.searchParams;
  
  // 1. Ambil Kunci Admin & Blokir Kasir (Parameter true = Hanya Admin Utama)
  const { queryClient } = await checkAdminAccess(true);

  // 2. Gunakan queryClient untuk menarik data aman dari RLS
  const { data: products } = await queryClient
    .from('products')
    .select('product_id, name, stock, price_retail')
    .order('name', { ascending: true });

  const { data: suppliers } = await queryClient
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  const { data: stockLogs } = await queryClient
    .from('stock_in_logs')
    .select(`
      log_id,
      quantity,
      buy_price,
      notes,
      created_at,
      products (name, sku),
      suppliers (name)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-12">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-sm">
          <Truck size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Logistik & Suplier (Procurement)</h1>
          <p className="text-gray-500 mt-1 text-sm">Catat barang masuk dari suplier dan pantau riwayat restock inventaris toko.</p>
        </div>
      </div>

      <ProcurementManager 
        products={products || []} 
        suppliers={suppliers || []} 
        initialLogs={stockLogs || []} 
      />

    </div>
  );
}