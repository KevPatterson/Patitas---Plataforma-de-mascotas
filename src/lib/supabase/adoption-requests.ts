import { supabase } from './client';
import { getUser } from './auth';

export type AdoptionRequest = {
  id: string;
  publication_id: string;
  requester_profile_id: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  publication?: {
    title: string;
    slug: string;
    owner_profile_id: string;
  } | null;
  requester?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function createAdoptionRequest(publicationId: string, message: string): Promise<AdoptionRequest> {
  const user = await getUser();
  if (!user) throw new Error('Debes iniciar sesión para solicitar adopción.');

  const { data: pub, error: pubError } = await supabase
    .from('publications')
    .select('id, title, slug, owner_profile_id')
    .eq('id', publicationId)
    .single();

  if (pubError || !pub) throw new Error('Publicación no encontrada.');

  if (pub.owner_profile_id === user.id) {
    throw new Error('No puedes solicitar adopción de tu propia publicación.');
  }

  const { data, error } = await supabase
    .from('adoption_requests')
    .insert({
      publication_id: publicationId,
      requester_profile_id: user.id,
      message: message.trim() || null,
      status: 'PENDING',
    })
    .select('id, publication_id, requester_profile_id, message, status, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Ya has solicitado adopción para este caso.');
    throw error;
  }

  await supabase.from('notifications').insert({
    profile_id: pub.owner_profile_id,
    type: 'SYSTEM',
    title: 'Nueva solicitud de adopción',
    body: `Alguien quiere adoptar a ${pub.title}. Revisa la solicitud en tu panel.`,
    link: `/p/${pub.slug}`,
  });

  return data as AdoptionRequest;
}

export async function getAdoptionRequestsForPublication(publicationId: string): Promise<AdoptionRequest[]> {
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('adoption_requests')
    .select('id, publication_id, requester_profile_id, message, status, created_at, updated_at, requester:profiles!requester_profile_id(username, full_name, avatar_url)')
    .eq('publication_id', publicationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, requester: Array.isArray(r.requester) ? r.requester[0] : r.requester })) as AdoptionRequest[];
}

export async function getMyAdoptionRequests(): Promise<AdoptionRequest[]> {
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('adoption_requests')
    .select('id, publication_id, requester_profile_id, message, status, created_at, updated_at, publication:publications!publication_id(title, slug, owner_profile_id)')
    .eq('requester_profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, publication: Array.isArray(r.publication) ? r.publication[0] : r.publication })) as AdoptionRequest[];
}

export async function updateAdoptionRequestStatus(requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') {
  const user = await getUser();
  if (!user) throw new Error('No autorizado.');

  const { data: request, error: reqError } = await supabase
    .from('adoption_requests')
    .select('id, publication_id, requester_profile_id, publication:publications!publication_id(title, slug, owner_profile_id)')
    .eq('id', requestId)
    .single();

  if (reqError || !request) throw new Error('Solicitud no encontrada.');

  const pub = Array.isArray(request.publication) ? request.publication[0] : request.publication;
  const isOwner = pub?.owner_profile_id === user.id;
  const isRequester = request.requester_profile_id === user.id;

  if (!isOwner && !isRequester) throw new Error('No tienes permiso para modificar esta solicitud.');

  if (isOwner && !['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new Error('El propietario solo puede aceptar o rechazar.');
  }
  if (isRequester && status !== 'CANCELLED') {
    throw new Error('El solicitante solo puede cancelar.');
  }

  const { error } = await supabase
    .from('adoption_requests')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) throw error;

  if (status === 'ACCEPTED' && pub) {
    await supabase.from('notifications').insert({
      profile_id: request.requester_profile_id,
      type: 'SYSTEM',
      title: 'Solicitud de adopción aceptada',
      body: `Tu solicitud para adoptar a ${pub.title} fue aceptada. Contacta al propietario.`,
      link: `/p/${pub.slug}`,
    });
  } else if (status === 'REJECTED' && pub) {
    await supabase.from('notifications').insert({
      profile_id: request.requester_profile_id,
      type: 'SYSTEM',
      title: 'Solicitud de adopción rechazada',
      body: `Tu solicitud para adoptar a ${pub.title} fue rechazada.`,
      link: `/p/${pub.slug}`,
    });
  }
}