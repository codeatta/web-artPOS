// components/CategoryManager.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { addCategory, updateCategory, deleteCategory } from '@/app/actions/categories';
import { Edit2, Trash2, Check, X, Plus, Loader2, Tags } from 'lucide-react';

// Definisi tipe data bawaan yang diekspektasikan dari Supabase
type Category = {
  category_id: string;
  name: string;
};

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [isPending, startTransition] = useTransition();
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // State untuk mode edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Fungsi Tambah Kategori
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const result = await addCategory(newCategoryName);
      if (result.success) {
        setNewCategoryName(''); // Kosongkan input jika sukses
      } else {
        alert(result.message);
      }
    });
  };

  // Fungsi Simpan Perubahan Kategori
  const handleSaveEdit = (categoryId: string) => {
    if (!editName.trim()) return;

    startTransition(async () => {
      const result = await updateCategory(categoryId, editName);
      if (result.success) {
        setEditingId(null);
      } else {
        alert(result.message);
      }
    });
  };

  // Fungsi Hapus Kategori
  const handleDelete = (categoryId: string, categoryName: string) => {
    if (!window.confirm(`Yakin ingin menghapus kategori "${categoryName}"?`)) return;

    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (!result.success) {
        alert(result.message); // Akan menampilkan error jika kategori masih dipakai produk
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* FORM TAMBAH KATEGORI */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Tags size={18} className="text-blue-500"/> Tambah Kategori Baru
        </h2>
        <form onSubmit={handleAdd} className="flex text-gray-700 gap-3">
          <input 
            type="text" 
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Masukkan nama kategori (contoh: Pakaian Pria)"
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
            disabled={isPending}
            required
          />
          <button 
            type="submit" 
            disabled={isPending || !newCategoryName.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Tambah
          </button>
        </form>
      </div>

      {/* DAFTAR KATEGORI */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4 font-bold">Nama Kategori</th>
              <th className="px-6 py-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {initialCategories.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-500 text-sm">
                  Belum ada kategori yang dibuat.
                </td>
              </tr>
            ) : (
              initialCategories.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-gray-50/50 transition group">
                  <td className="px-6 py-4">
                    
                    {/* MODE EDIT VS MODE BACA */}
                    {editingId === cat.category_id ? (
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full max-w-xs p-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900"
                        autoFocus
                      />
                    ) : (
                      <p className="font-bold text-gray-900">{cat.name}</p>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === cat.category_id ? (
                        <>
                          <button 
                            onClick={() => handleSaveEdit(cat.category_id)} 
                            disabled={isPending}
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition"
                            title="Simpan"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)} 
                            disabled={isPending}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg transition"
                            title="Batal"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setEditingId(cat.category_id);
                              setEditName(cat.name);
                            }} 
                            disabled={isPending}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(cat.category_id, cat.name)} 
                            disabled={isPending}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}