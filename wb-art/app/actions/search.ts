// app/actions/search.ts
'use server';

import { createClient } from '@/utils/supabase/server';

export async function liveSearchProducts(keyword: string) {
  if (!keyword || keyword.trim() === '') return [];

  const supabase = await createClient();
  
  // Mencari produk yang namanya mengandung kata kunci (Maksimal 5 produk)
  const { data, error } = await supabase
    .from('products')
    .select(`
      product_id,
      name,
      price_retail,
      product_images(image_path, is_primary)
    `)
    .eq('is_active', true)
    .ilike('name', `%${keyword.trim()}%`)
    .limit(5);

  if (error) {
    console.error('Gagal live search:', error);
    return [];
  }

  return data;
}