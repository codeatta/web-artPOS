// app/admin/inventory/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { ClipboardList, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import StockAdjustmentForm from '@/components/StockAdjustmentForm';

export const revalidate = 0;

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'kasir') redirect('/');

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Ambil Data Produk (Hilangkan .eq('is_archived', false) jika tidak ada kolomnya)
  const { data: products, error: productError } = await adminDb
    .from('products')
    .select('product_id, name, sku, stock')
    .order('name', { ascending: true });

  if (productError) {
    console.error("Gagal mengambil produk:", productError);
  }
  // Ambil Riwayat Penyesuaian Stok
  const { data: logs } = await adminDb
    .from('stock_adjustments')
    .select(`
      *,
      products (name, sku),
      user_profiles (full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={26} className="text-blue-600" /> Inventaris & Stok Opname
          </h1>
          <p className="text-sm text-gray-500 mt-1">Catat penyesuaian stok manual (Barang Rusak, Hilang, Retur).</p>
        </div>
        <StockAdjustmentForm products={products || []} />
      </div>

      {/* TABEL RIWAYAT */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-bold">Tanggal</th>
                <th className="p-4 font-bold">Produk</th>
                <th className="p-4 font-bold">Jenis / Alasan</th>
                <th className="p-4 font-bold text-right">Qty</th>
                <th className="p-4 font-bold">Catatan</th>
                <th className="p-4 font-bold">Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!logs || logs.length === 0) ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Belum ada riwayat penyesuaian stok.</td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-gray-900">{log.products?.name}</p>
                      <p className="text-xs text-gray-500">SKU: {log.products?.sku || '-'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {log.type === 'in' ? (
                          <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md text-xs font-bold border border-green-100">
                            <ArrowUpRight size={14} /> Masuk
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-md text-xs font-bold border border-red-100">
                            <ArrowDownRight size={14} /> Keluar
                          </span>
                        )}
                        <span className="text-gray-700">{log.reason}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-sm font-black ${log.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                        {log.type === 'in' ? '+' : '-'}{log.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-600 max-w-xs truncate" title={log.notes}>
                      {log.notes || '-'}
                    </td>
                    <td className="p-4 text-xs font-bold text-gray-800">
                      {log.user_profiles?.full_name || 'Admin'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}