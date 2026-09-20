// app/actions/pos_voucher.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export async function validateVoucher(code: string, subtotal: number) {
  const supabase = await createClient();
  const cleanCode = code.toUpperCase().trim();

  const { data: voucher, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', cleanCode)
    .eq('is_active', true)
    .single();

  if (error || !voucher) {
    return { success: false, message: 'Kode voucher tidak valid atau sudah tidak aktif.' };
  }

  // Cek syarat minimum belanja
  if (subtotal < voucher.min_purchase) {
    const formatRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(voucher.min_purchase);
    return { success: false, message: `Minimum belanja untuk voucher ini adalah ${formatRp}.` };
  }

  // Hitung besar diskon
  let discountAmount = 0;
  if (voucher.discount_type === 'percentage') {
    discountAmount = (subtotal * voucher.discount_value) / 100;
  } else {
    discountAmount = voucher.discount_value;
  }

  // Pastikan diskon tidak melebihi subtotal
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  return { 
    success: true, 
    voucherCode: voucher.code,
    discountAmount,
    message: `Voucher ${voucher.code} berhasil digunakan!` 
  };
}