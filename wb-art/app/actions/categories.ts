// app/actions/categories.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCategory(name: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('categories')
    .insert({ name });

  if (error) {
    console.error("Gagal menambah kategori:", error);
    return { success: false, message: error.message };
  }

  // Refresh halaman kategori dan form tambah produk
  revalidatePath('/admin/products/categories');
  revalidatePath('/admin/products/add');
  return { success: true };
}

export async function updateCategory(categoryId: string, name: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('category_id', categoryId);

  if (error) {
    console.error("Gagal update kategori:", error);
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/products/categories');
  revalidatePath('/admin/products/add');
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('category_id', categoryId);

  if (error) {
    console.error("Gagal hapus kategori:", error);
    // Peringatan jika kategori masih dipakai oleh produk (Foreign Key Constraint)
    if (error.code === '23503') {
      return { 
        success: false, 
        message: 'Kategori ini tidak dapat dihapus karena masih ada produk yang menggunakannya. Pindahkan atau hapus produknya terlebih dahulu.' 
      };
    }
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/products/categories');
  revalidatePath('/admin/products/add');
  return { success: true };
}