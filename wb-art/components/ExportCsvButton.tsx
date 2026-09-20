// components/ExportCsvButton.jsx
'use client';

import React from 'react';
import { Download } from 'lucide-react';

type Order = {
  created_at: string;
  invoice_number: string;
  order_status: string;
  grand_total: number;
};

type ExportCsvButtonProps = {
  data: Order[];
};

export default function ExportCsvButton({ data }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    // 1. Buat Header CSV
    const headers = ['No. Invoice', 'Tanggal', 'Status', 'Total Tagihan'];
    
    // 2. Format baris data
    const rows = data.map(order => {
      const date = new Date(order.created_at).toLocaleDateString('id-ID');
      return `"${order.invoice_number}","${date}","${order.order_status}","${order.grand_total}"`;
    });

    // 3. Gabungkan header dan baris
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // 4. Buat file Blob dan picu unduhan
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Penjualan_${new Date().toLocaleDateString('id-ID')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-2 transition shadow-sm"
    >
      <Download size={18} /> Export Laporan (CSV)
    </button>
  );
}