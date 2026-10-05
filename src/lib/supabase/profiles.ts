import { supabase } from './client';

export async function ensureProfile(username: string, fullName?: string | null) {
  const { data: userResponse, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa.');
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    username,
    full_name: fullName ?? user.user_metadata?.full_name ?? null,
  });

  if (error) {
    throw error;
  }
}