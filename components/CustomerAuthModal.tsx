// components/CustomerAuthModal.jsx
'use client';

import React, { useState, useTransition } from 'react';
import { adminManageCustomerAuth } from '@/app/actions/customers';
import { ShieldAlert, KeyRound, CheckCircle, X, Loader2 } from 'lucide-react';

interface Customer {
  user_id?: string | null;
  name: string;
}

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerAuthModal({
  isOpen,
  onClose,
  customer,
}: CustomerAuthModalProps) {
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState('');
  const [verifyEmail, setVerifyEmail] = useState(true);

  if (!isOpen || !customer) return null;

  // Cek apakah pelanggan ini memiliki akun Auth (memiliki user_id yang valid)
  const hasAuthAccount = !!customer.user_id;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasAuthAccount || !customer.user_id) return;

    const userId = customer.user_id;

    startTransition(async () => {
      const result = await adminManageCustomerAuth(userId, newPassword, verifyEmail);
      if (result.success) {
        alert('Pengaturan akun pelanggan berhasil diperbarui!');
        onClose();
        setNewPassword('');
      } else {
        alert('Gagal: ' + result.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl text-gray-700 shadow-xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
        
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <KeyRound size={18} className="text-blue-600" /> Kelola Akun: {customer.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {!hasAuthAccount ? (
          <div className="py-6 text-center space-y-3">
            <ShieldAlert size={40} className="mx-auto text-amber-500" />
            <p className="text-sm font-bold text-gray-800">Pelanggan Offline / Non-Auth</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Pelanggan ini ditambahkan secara manual melalui riwayat transaksi atau buku kontak POS, sehingga tidak memiliki akun *login* web atau sistem *Auth* yang perlu diverifikasi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reset Password Baru (Opsional)</label>
              <input 
                type="text" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                placeholder="Kosongkan jika tidak ingin ganti password" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <p className="text-[11px] text-gray-400 mt-1">Minimal 6 karakter jika diisi.</p>
            </div>

            <div className="flex items-center gap-3 pt-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <input 
                type="checkbox" 
                id="verifyCheck"
                checked={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="verifyCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                Paksa Verifikasi Email (Tandai Email sebagai Terverifikasi)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition shadow-sm flex items-center gap-2"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}