// components/CustomerModal.jsx
'use client';

import React, { useState, useTransition } from 'react';
import { addCustomer, updateCustomer } from '@/app/actions/customers';
import { X, UserPlus, Edit3, Loader2 } from 'lucide-react';

export default function CustomerModal({ isOpen, onClose, customerToEdit }) {
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!customerToEdit;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const phone = formData.get('phone');

    startTransition(async () => {
      let result;
      if (isEditMode) {
        result = await updateCustomer(customerToEdit.user_id || customerToEdit.id, name, phone);
      } else {
        result = await addCustomer(formData);
      }

      if (result.success) {
        onClose();
      } else {
        alert("Gagal: " + result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-gray-700 border border-gray-100">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            {isEditMode ? <Edit3 size={18} className="text-blue-600" /> : <UserPlus size={18} className="text-blue-600" />}
            {isEditMode ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap *</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={customerToEdit?.name || ''} 
              required 
              placeholder="Contoh: Budi Jaya"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Telepon / WhatsApp *</label>
            <input 
              type="text" 
              name="phone" 
              defaultValue={customerToEdit?.phone !== '-' ? customerToEdit?.phone : ''} 
              required 
              placeholder="Contoh: 08123456789"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm flex items-center gap-2 transition shadow-sm"
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {isEditMode ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}