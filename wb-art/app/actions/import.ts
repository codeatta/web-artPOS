// app/actions/import.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function importProductsAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('csv_file') as File;
  
  if (!file || file.size === 0) {
    throw new Error('File CSV tidak ditemukan atau kosong.');
  }

  // 1. Baca isi file sebagai Teks
  const text = await file.text();
  
  // 2. Pisahkan per baris (Enter)
  const rows = text.split('\n').filter(row => row.trim() !== '');
  
  if (rows.length <= 1) {
    throw new Error('File CSV kosong atau hanya berisi header.');
  }

  // 3. Ambil Kategori yang sudah ada di Database
  const { data: existingCategories } = await supabase.from('categories').select('category_id, name');
  const categoryMap = new Map();
  existingCategories?.forEach(cat => categoryMap.set(cat.name.toLowerCase(), cat.category_id));

  const productsToInsert = [];

  // 4. Looping data CSV (Mulai dari baris ke-2, karena baris 1 adalah Header)
  for (let i = 1; i < rows.length; i++) {
    // Regex canggih: Memisahkan koma, tapi MENGABAIKAN koma yang ada di dalam tanda kutip ganda "..."
    const cols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => {
      let val = col.trim();
      // Hilangkan tanda kutip di awal dan akhir jika ada
      if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
      return val;
    });

    if (cols.length < 7) continue; // Abaikan baris yang tidak lengkap

    const name = cols[0];
    const sku = cols[1];
    const catName = cols[2];
    const price_retail = parseInt(cols[3]) || 0;
    const price_reseller = parseInt(cols[4]) || 0;
    const stock = parseInt(cols[5]) || 0;
    const weight = parseInt(cols[6]) || 1000;
    const description = cols[7] || '';

    // Cari ID Kategori. Jika belum ada, buat kategori baru seketika!
    let category_id = categoryMap.get(catName.toLowerCase());
    
    if (!category_id && catName) {
      const { data: newCat } = await supabase
        .from('categories')
        .insert({ name: catName })
        .select('category_id')
        .single();
        
      if (newCat) {
        category_id = newCat.category_id;
        categoryMap.set(catName.toLowerCase(), category_id); // Simpan ke memori agar tidak insert berulang
      }
    }

    // Masukkan ke array antrean
    productsToInsert.push({
      name, 
      sku, 
      category_id, 
      price_retail, 
      price_reseller,
      stock, 
      weight_actual_gram: weight, 
      weight_volumetric_gram: weight,
      description, 
      is_active: true
    });
  }

  // 5. Eksekusi Bulk Insert (Simpan semua sekaligus)
  if (productsToInsert.length > 0) {
    const { error } = await supabase.from('products').insert(productsToInsert);
    if (error) {
      console.error("Bulk insert error:", error);
      throw new Error('Gagal menyimpan data ke database. Pastikan format sesuai.');
    }
  }

  // 6. Refresh Cache & Redirect
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
  redirect('/admin/products?imported=true');
}