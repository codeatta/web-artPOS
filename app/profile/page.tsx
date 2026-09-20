// app/profile/page.tsx
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileWrapper from '@/components/ProfileWrapper'; // Atau gabungkan state modal di Client Wrapper

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Ambil data profil
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Ambil daftar alamat pengiriman
  const { data: addresses } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const signOutAction = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <ProfileWrapper 
      user={user} 
      profile={profile} 
      addresses={addresses || []} 
      signOutAction={signOutAction} 
    />
  );
}