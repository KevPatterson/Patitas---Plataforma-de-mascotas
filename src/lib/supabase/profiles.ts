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
    .select('id, username, full_name, avatar_url, bio, city, country, created_at')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, city, country, created_at')
    .ilike('username', username)
    .is('deleted_at', null)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserPublications(userId: string) {
  const { data, error } = await supabase
    .from('publications')
    .select(
      `
      id,
      slug,
      title,
      type,
      status,
      species,
      published_at,
      publication_images(storage_path, is_cover)
    `
    )
    .eq('owner_profile_id', userId)
    .in('status', ['ACTIVE', 'RESOLVED'])
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (
    data?.map((pub) => {
      const cover = pub.publication_images?.find((img: { is_cover: boolean }) => img.is_cover) ?? 
                   pub.publication_images?.[0] ?? null;

      return {
        id: pub.id,
        slug: pub.slug,
        title: pub.title,
        type: pub.type,
        status: pub.status,
        species: pub.species,
        published_at: pub.published_at,
        coverImageUrl: cover
          ? supabase.storage.from('pet-images').getPublicUrl(cover.storage_path).data.publicUrl
          : null,
      };
    }) || []
  );
}

export async function updateProfile(userId: string, updates: {
  username?: string;
  full_name?: string;
  bio?: string;
  city?: string;
}) {
  const updateData: Record<string, unknown> = {};

  if (updates.username !== undefined) updateData.username = updates.username;
  if (updates.full_name !== undefined) updateData.full_name = updates.full_name;
  if (updates.bio !== undefined) updateData.bio = updates.bio;
  if (updates.city !== undefined) updateData.city = updates.city;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
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
