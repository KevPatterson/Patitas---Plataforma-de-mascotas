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

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  // Eliminar avatar anterior si existe
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (existingFiles && existingFiles.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove(existingFiles.map(f => `${userId}/${f.name}`));
  }

  // Subir nuevo avatar
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const avatarUrl = urlData.publicUrl;

  // Actualizar profile con la nueva URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  return avatarUrl;
}

export async function deleteAvatar(userId: string) {
  // Eliminar archivos del storage
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (existingFiles && existingFiles.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove(existingFiles.map(f => `${userId}/${f.name}`));
  }

  // Actualizar profile para quitar la URL
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}
