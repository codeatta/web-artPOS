// app/admin/products/import/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { ArrowLeft, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';
import { importProductsAction } from '@/app/actions/import';
import {redirect} from 'next/navigation';
import SubmitFormButton from '@/components/SubmitFormButton';

export default async function ImportProductsPage() {
   const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) redirect('/login');
  
      // 1. CEK ROLE PENGGUNA (Apakah Admin?)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
    
      const isAdmin = profile?.role === 'admin' || profile?.role === 'kasir';
    
      if (!isAdmin) {
        redirect('/unauthorized');
      }
  // Membuat link download template CSV otomatis
  const csvTemplate = `Nama Produk,SKU,Kategori,Harga Retail,Harga Reseller,Stok,Berat Gram,Deskripsi
Panci Tanah Liat,GRB-001,Dapur,50000,45000,100,1500,"Panci tradisional yang awet, tahan panas."
Vas Bunga Estetik,GRB-002,Taman,35000,30000,50,800,"Vas bunga minimalis untuk dekorasi."`;
  
  const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvTemplate}`);

  return (
    <div className="space-y-6 font-sans max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Produk (CSV)</h1>
          <p className="text-gray-500 mt-1 text-sm">Tambahkan puluhan produk sekaligus menggunakan file Excel/CSV.</p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-start gap-4">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="font-bold text-blue-800 mb-1">Panduan Import:</h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 mb-4">
            <li>Gunakan file berekstensi <strong>.csv</strong> (Pisahkan dengan koma).</li>
            <li>Baris pertama wajib berupa Header (jangan dihapus).</li>
            <li>Jika kategori belum ada di database, sistem akan otomatis membuatnya.</li>
            <li>Kolom deskripsi boleh dikosongkan.</li>
          </ul>
          <a 
            href={encodedUri} 
            download="Template_Import_Gerabah.csv"
            className="inline-flex items-center gap-2 text-sm font-bold bg-white text-blue-700 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition shadow-sm"
          >
            <Download size={16} /> Download Template CSV
          </a>
        </div>
      </div>

      <form action={importProductsAction} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 text-center">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition cursor-pointer relative">
          <input 
            type="file" 
            name="csv_file" 
            accept=".csv" 
            required
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <FileSpreadsheet size={48} className="text-green-500 mb-4" />
          <h3 className="font-bold text-gray-800 text-lg">Pilih atau Tarik File CSV Kesini</h3>
          <p className="text-sm text-gray-500 mt-2">Maksimal ukuran file: 5MB</p>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <SubmitFormButton label="Mulai Import Produk" />
        </div>
      </form>
    </div>
  );
}