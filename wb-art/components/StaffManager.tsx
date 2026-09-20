// components/StaffManager.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { addStaff, deleteStaff, resetStaffPassword, updateStaff } from '@/app/actions/staff';
import { Shield, UserPlus, Trash2, Loader2, CheckCircle2, Edit2, Check, X, KeyRound, Phone } from 'lucide-react';

export default function StaffManager({ staffs }: { staffs: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // STATE UNTUK FITUR EDIT
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('kasir');

  // State untuk modal ganti password
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetStaff, setTargetStaff] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Fungsi Pemicu Notifikasi
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addStaff(formData);
      if (result.success) {
        triggerToast("Staf Berhasil Didaftarkan!");
        (e.target as HTMLFormElement).reset();
      } else {
        alert("Gagal menambahkan staf: " + result.message);
      }
    });
  };

  // FUNGSI SIMPAN EDIT
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    startTransition(async () => {
      const result = await updateStaff(id, editName, editRole);
      if (result.success) {
        setEditingId(null); // Tutup mode edit
        triggerToast("Data Staf Berhasil Diperbarui!");
      } else {
        alert("Gagal memperbarui staf: " + result.message);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin mencabut akses staf "${name}"? Akun ini akan dihapus permanen.`)) return;

    startTransition(async () => {
      const result = await deleteStaff(id);
      if (!result.success) alert(result.message);
    });
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStaff) return;

    startTransition(async () => {
      const result = await resetStaffPassword(targetStaff.id, newPassword);
      if (result.success) {
        triggerToast(`Password untuk "${targetStaff.name}" berhasil diubah!`);
        setResetModalOpen(false);
        setNewPassword('');
      } else {
        alert("Gagal mereset password: " + result.message);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* FORM TAMBAH STAF */}
      <div className="bg-white p-6 rounded-2xl text-gray-700 shadow-sm border border-gray-100 h-fit">
        <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <UserPlus size={18} className="text-blue-500"/> Tambah Akun Staf
        </h2>
        
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" name="name" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Aktif (Untuk Login)</label>
            <input type="email" name="email" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Telepon / WA (Opsional)</label>
            <input type="text" name="phone" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Mulai dengan 08..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password Sementara</label>
            <input type="text" name="password" required minLength={6} placeholder="Minimal 6 karakter" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Hak Akses (Role)</label>
            <select name="role" required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer">
              <option value="kasir">KASIR (Hanya Akses Pesanan & POS)</option>
              <option value="admin">ADMIN (Akses Penuh ke Semua Menu)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            Daftarkan Staf
          </button>
        </form>
      </div>

      {/* DAFTAR STAF */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">Daftar Karyawan Terdaftar</h2>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4 font-bold">Informasi Akun</th>
              <th className="px-6 py-4 font-bold">Jabatan</th>
              <th className="px-6 py-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!staffs || staffs.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Belum ada staf terdaftar.</td></tr>
            ) : (
              staffs.map((staff) => {
                const staffId = staff.id || staff.user_id; 
                const staffName = staff.full_name || staff.nama_lengkap || staff.name || 'Tanpa Nama';
                const staffPhone = staff.phone && staff.phone !== '-' ? staff.phone : 'Belum isi no. HP';
                const staffRole = (staff.role || 'kasir').toLowerCase();

                return (
                  <tr key={staffId} className="hover:bg-gray-50/50 transition group h-20">
                    
                    {/* KOLOM NAMA & KONTAK */}
                    <td className="px-6 py-4">
                      {editingId === staffId ? (
                        <div className="space-y-1">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full max-w-xs p-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900"
                            placeholder="Nama Lengkap"
                            autoFocus
                          />
                          <p className="text-xs text-gray-500 px-1">{staffPhone}</p>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-gray-900">{staffName}</p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Phone size={10} className="text-gray-400"/> {staffPhone}
                          </p>
                        </>
                      )}
                    </td>

                    {/* KOLOM JABATAN */}
                    <td className="px-6 py-4">
                      {editingId === staffId ? (
                        <select 
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="p-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 cursor-pointer"
                        >
                          <option value="kasir">KASIR</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      ) : (
                        staffRole === 'admin' 
                          ? <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">ADMIN UTAMA</span>
                          : <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">KASIR</span>
                      )}
                    </td>

                    {/* KOLOM AKSI (EDIT/DELETE) */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === staffId ? (
                          <>
                            <button onClick={() => handleSaveEdit(staffId)} disabled={isPending} className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition" title="Simpan">
                              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <button onClick={() => setEditingId(null)} disabled={isPending} className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg transition" title="Batal">
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setEditingId(staffId);
                                setEditName(staffName);
                                setEditRole(staffRole);
                              }} 
                              disabled={isPending}
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 lg:opacity-100"
                              title="Edit Akses"
                            >
                              <Edit2 size={16} />
                            </button>
                            {/* Tombol Reset Password */}
                            <button 
                            onClick={() => {
                                setTargetStaff({ id: staffId, name: staffName });
                                setResetModalOpen(true);
                            }}
                            className="p-2 bg-yellow-50 hover:bg-yellow-600 text-yellow-600 hover:text-white rounded-lg transition"
                            title="Reset Password Manual"
                            >
                            <KeyRound size={16} />
                            </button>                       
                            <button 
                              onClick={() => handleDelete(staffId, staffName)} 
                              disabled={isPending}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100 lg:opacity-100"
                              title="Hapus Akses"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* MODAL RESET PASSWORD */}
        {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Reset Password Akun</h3>
            <p className="text-xs text-gray-500">
                Masukkan password baru untuk akun <span className="font-bold text-gray-800">{targetStaff?.name}</span>. Pengguna dapat langsung login menggunakan password ini.
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <input 
                type="text" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
                minLength={6}
                placeholder="Password baru (min. 6 karakter)" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                autoFocus
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                    type="button" 
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                    Batal
                </button>
                <button 
                    type="submit" 
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                >
                    {isPending ? 'Menyimpan...' : 'Simpan Password'}
                </button>
                </div>
            </form>
            </div>
        </div>
        )}

      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-green-600 border border-green-500 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300">
          <CheckCircle2 size={24} className="text-white drop-shadow-sm" />
          <div>
            <p className="text-sm font-extrabold tracking-wide">{toastMessage}</p>
            <p className="text-xs text-green-100 mt-0.5">Database telah diperbarui.</p>
          </div>
        </div>
      )}
    </div>
  );
}