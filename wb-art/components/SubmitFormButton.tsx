// components/SubmitFormButton.tsx
'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Save, Loader2 } from 'lucide-react';

export default function SubmitFormButton({ label = "Simpan Data" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition w-full sm:w-auto disabled:opacity-70 disabled:cursor-wait shadow-sm"
    >
      {pending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
      {pending ? 'Menyimpan...' : label}
    </button>
  );
}