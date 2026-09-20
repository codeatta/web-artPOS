// utils/adminGuard.ts
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function checkAdminAccess(requireSuperAdmin = false) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, name')
    .eq('user_id', user.id)
    .single();

  const role = (profile?.role || user.user_metadata?.role || 'customer').toLowerCase();
  
  const isAdmin = role === 'admin';
  const isKasir = role === 'kasir';

  if (requireSuperAdmin && !isAdmin) {
    redirect('/unauthorized');
  }

  if (!isAdmin && !isKasir) {
    redirect('/unauthorized');
  }

  const queryClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  return { supabase, queryClient, user, role, isAdmin };
}