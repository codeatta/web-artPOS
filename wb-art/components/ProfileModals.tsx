// components/ProfileModals.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { updateProfile, addAddress } from '@/app/actions/profile';
import { X, Edit, MapPin, Plus, Loader2 } from 'lucide-react';

type Profile = {
  name?: string | null;
  phone?: string | null;
};

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string };
  profile?: Profile | null;
};

type AddAddressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
};

export function EditProfileModal({ isOpen, onClose, user, profile }: EditProfileModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfile(user.id, formData);
      if (result.success) {
        onClose();
      } else {
        alert("Gagal memperbarui profil: " + result.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-gray-900 text-base">Edit Informasi Profil</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-700">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" name="name" defaultValue={profile?.name || ''} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Telepon</label>
            <input type="text" name="phone" defaultValue={profile?.phone || ''} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Batal</button>
            <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl flex items-center gap-2">
              {isPending && <Loader2 size={16} className="animate-spin" />} Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddAddressModal({ isOpen, onClose, userId }: AddAddressModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addAddress(userId, formData);
      if (result.success) {
        onClose();
      } else {
        alert("Gagal menambah alamat: " + result.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl text-gray-700 shadow-xl w-full max-w-lg overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-gray-900 text-base">Tambah Alamat Pengiriman Baru</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Penerima</label>
              <input type="text" name="recipient_name" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">No. Telepon Penerima</label>
              <input type="text" name="phone_number" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kota / Kabupaten</label>
              <input type="text" name="city" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Provinsi</label>
              <input type="text" name="province" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Kode Pos</label>
            <input type="text" name="postal_code" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Lengkap (Jalan, No. Rumah, RT/RW)</label>
            <textarea name="street_address" rows={2} required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 resize-none"></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Batal</button>
            <button type="submit" disabled={isPending} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl flex items-center gap-2">
              {isPending && <Loader2 size={16} className="animate-spin" />} Simpan Alamat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}