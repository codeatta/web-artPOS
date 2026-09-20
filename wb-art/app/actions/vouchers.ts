// app/actions/vouchers.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addVoucher(formData: FormData) {
  const supabase = await createClient();
  const code = (formData.get('code') as string).toUpperCase().trim();
  const discount_type = formData.get('discount_type') as string;
  const discount_value = parseFloat(formData.get('discount_value') as string || '0');
  const min_purchase = parseFloat(formData.get('min_purchase') as string || '0');

  const { error } = await supabase
    .from('vouchers')
    .insert({ 
      code, 
      discount_type, 
      discount_value, 
      min_purchase 
    });

  if (error) {
    console.error("Gagal menambah voucher:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/vouchers');
  return { success: true };
}

export async function deleteVoucher(voucherId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('vouchers')
    .delete()
    .eq('voucher_id', voucherId);

  if (error) {
    console.error("Gagal menghapus voucher:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/vouchers');
  return { success: true };
}