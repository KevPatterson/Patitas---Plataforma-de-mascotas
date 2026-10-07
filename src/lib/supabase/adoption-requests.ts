import { supabase } from './client';

export type AdoptionRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type AdoptionRequest = {
  id: string;
  publication_id: string;
  requester_profile_id: string;
  message: string | null;
  status: AdoptionRequestStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  requester: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  publication: {
    id: string;
    slug: string;
    title: string;
    type: string;
    status: string;
    species: string;
    publication_images: Array<{
      storage_path: string;
      is_cover: boolean;
    }>;
  };
};

/**
 * Crear solicitud de adopción
 */
export async function createAdoptionRequest(
  publicationId: string,
  message?: string
): Promise<string> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('Debes iniciar sesión para solicitar adopción');
  }

  // Verificar que la publicación existe y es de tipo ADOPTION
  const { data: publication, error: pubError } = await supabase
    .from('publications')
    .select('id, type, owner_profile_id, status')
    .eq('id', publicationId)
    .single();

  if (pubError || !publication) {
    throw new Error('Publicación no encontrada');
  }

  if (publication.type !== 'ADOPTION') {
    throw new Error('Esta publicación no es de adopción');
  }

  if (publication.status !== 'ACTIVE') {
    throw new Error('Esta publicación ya no está activa');
  }

  if (publication.owner_profile_id === user.id) {
    throw new Error('No puedes solicitar adopción de tu propia publicación');
  }

  // Verificar que no exista una solicitud previa pendiente
  const { data: existing } = await supabase
    .from('adoption_requests')
    .select('id')
    .eq('publication_id', publicationId)
    .eq('requester_profile_id', user.id)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existing) {
    throw new Error('Ya tienes una solicitud pendiente para esta mascota');
  }

  // Crear solicitud
  const { data, error } = await supabase
    .from('adoption_requests')
    .insert({
      publication_id: publicationId,
      requester_profile_id: user.id,
      message: message || null,
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  // Crear notificación para el owner
  await supabase.from('notifications').insert({
    profile_id: publication.owner_profile_id,
    type: 'MESSAGE',
    title: '¡Nueva solicitud de adopción!',
    body: 'Alguien está interesado en adoptar tu mascota. Revisa su solicitud.',
    link: `/dashboard`,
  });

  return data.id;
}

/**
 * Obtener solicitudes enviadas por el usuario
 */
export async function getMyAdoptionRequests(): Promise<AdoptionRequest[]> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa');
  }

  const { data, error } = await supabase
    .from('adoption_requests')
    .select(`
      id,
      publication_id,
      requester_profile_id,
      message,
      status,
      created_at,
      updated_at,
      resolved_at,
      publication:publications!publication_id(
        id,
        slug,
        title,
        type,
        status,
        species,
        publication_images(storage_path, is_cover)
      )
    `)
    .eq('requester_profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Agregar datos del solicitante (el usuario actual)
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  type RawRequest = {
    id: string;
    publication_id: string;
    requester_profile_id: string;
    message: string | null;
    status: AdoptionRequestStatus;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    publication: Array<{
      id: string;
      slug: string;
      title: string;
      type: string;
      status: string;
      species: string;
      publication_images: Array<{
        storage_path: string;
        is_cover: boolean;
      }>;
    }>;
  };

  return (data as RawRequest[]).map((req) => ({
    ...req,
    publication: req.publication[0],
    requester: profile || { username: 'Usuario', full_name: null, avatar_url: null },
  })) as AdoptionRequest[];
}

/**
 * Obtener solicitudes recibidas para las publicaciones del usuario
 */
export async function getReceivedAdoptionRequests(): Promise<AdoptionRequest[]> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa');
  }

  const { data, error } = await supabase
    .from('adoption_requests')
    .select(`
      id,
      publication_id,
      requester_profile_id,
      message,
      status,
      created_at,
      updated_at,
      resolved_at,
      requester:profiles!requester_profile_id(username, full_name, avatar_url),
      publication:publications!publication_id(
        id,
        slug,
        title,
        type,
        status,
        species,
        publication_images(storage_path, is_cover)
      )
    `)
    .eq('publication.owner_profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  type RawRequest = {
    id: string;
    publication_id: string;
    requester_profile_id: string;
    message: string | null;
    status: AdoptionRequestStatus;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    requester: Array<{
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    }>;
    publication: Array<{
      id: string;
      slug: string;
      title: string;
      type: string;
      status: string;
      species: string;
      publication_images: Array<{
        storage_path: string;
        is_cover: boolean;
      }>;
    }>;
  };

  return (data as RawRequest[]).map((req) => ({
    ...req,
    requester: req.requester[0],
    publication: req.publication[0],
  })) as AdoptionRequest[];
}

/**
 * Actualizar estado de solicitud (solo owner de la publicación)
 */
export async function updateAdoptionRequestStatus(
  requestId: string,
  status: 'ACCEPTED' | 'REJECTED'
): Promise<void> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa');
  }

  const { error } = await supabase
    .from('adoption_requests')
    .update({
      status,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw error;
  }

  // Obtener datos de la solicitud para notificar
  const { data: request } = await supabase
    .from('adoption_requests')
    .select('requester_profile_id, publication:publications(title)')
    .eq('id', requestId)
    .single();

  if (request) {
    // Notificar al solicitante
    await supabase.from('notifications').insert({
      profile_id: request.requester_profile_id,
      type: 'PUBLICATION_UPDATE',
      title: status === 'ACCEPTED' ? '¡Solicitud aceptada!' : 'Solicitud rechazada',
      body:
        status === 'ACCEPTED'
          ? `Tu solicitud de adopción para "${(request.publication as { title?: string })?.title}" fue aceptada. El propietario se pondrá en contacto contigo.`
          : `Tu solicitud de adopción para "${(request.publication as { title?: string })?.title}" fue rechazada.`,
      link: `/dashboard`,
    });
  }
}

/**
 * Cancelar solicitud (solo requester)
 */
export async function cancelAdoptionRequest(requestId: string): Promise<void> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa');
  }

  const { error } = await supabase
    .from('adoption_requests')
    .update({
      status: 'CANCELLED',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('requester_profile_id', user.id);

  if (error) {
    throw error;
  }
}

/**
 * Contar solicitudes pendientes recibidas
 */
export async function countPendingRequests(): Promise<number> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from('adoption_requests')
    .select('id', { count: 'exact', head: true })
    .eq('publication.owner_profile_id', user.id)
    .eq('status', 'PENDING');

  if (error) {
    console.error('Error counting pending requests:', error);
    return 0;
  }

  return count ?? 0;
}
