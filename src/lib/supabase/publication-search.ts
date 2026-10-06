import { supabase } from './client';

type PublicationRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND' | 'ABANDONED' | 'ADOPTION' | 'SIGHTING';
  status: 'ACTIVE' | 'RESOLVED' | 'EXPIRED' | 'HIDDEN' | 'DELETED';
  species: string;
  breed: string | null;
  color: string | null;
  sex: string | null;
  size: string | null;
  published_at: string;
  contact_mode?: 'INTERNAL' | 'PHONE' | 'WHATSAPP';
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  reward?: string | null;
  event_date?: string | null;
  event_time_approx?: string | null;
  owner_profile_id?: string;
  location: Array<{
    province: string;
    municipality: string;
    zone: string | null;
    approximate_lat: number | null;
    approximate_lng: number | null;
  }>;
  publication_images: Array<{
    storage_path: string;
    is_cover: boolean;
    alt_text: string | null;
  }>;
};

export type PublicationSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: PublicationRow['type'];
  status: PublicationRow['status'];
  species: string;
  breed: string | null;
  color: string | null;
  sex: string | null;
  size: string | null;
  publishedAt: string;
  province: string | null;
  municipality: string | null;
  zone: string | null;
  approximateLat: number | null;
  approximateLng: number | null;
  coverImageUrl: string | null;
};

type SearchFilters = {
  query?: string;
  type?: PublicationRow['type'] | 'ALL';
  species?: string;
  sex?: string;
  size?: string;
  province?: string;
  municipality?: string;
  status?: PublicationRow['status'] | 'ALL';
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
};

function mapPublication(row: PublicationRow): PublicationSummary {
  const cover = row.publication_images.find((image) => image.is_cover) ?? row.publication_images[0] ?? null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    species: row.species,
    breed: row.breed,
    color: row.color,
    sex: row.sex,
    size: row.size,
    publishedAt: row.published_at,
    province: row.location[0]?.province ?? null,
    municipality: row.location[0]?.municipality ?? null,
    zone: row.location[0]?.zone ?? null,
    approximateLat: row.location[0]?.approximate_lat ?? null,
    approximateLng: row.location[0]?.approximate_lng ?? null,
    coverImageUrl: cover ? supabase.storage.from('pet-images').getPublicUrl(cover.storage_path).data.publicUrl : null,
  };
}

export async function searchPublications(filters: SearchFilters) {
  const limit = filters.limit ?? 48;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from('publications')
    .select('id, slug, title, description, type, status, species, breed, color, sex, size, published_at, location:locations(province, municipality, zone, approximate_lat, approximate_lng), publication_images(storage_path, is_cover, alt_text)')
    .neq('status', 'DELETED')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.type && filters.type !== 'ALL') {
    query = query.eq('type', filters.type);
  }

  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  if (filters.province) {
    query = query.eq('location.province', filters.province);
  }

  if (filters.municipality) {
    query = query.eq('location.municipality', filters.municipality);
  }

  if (filters.species) {
    query = query.eq('species', filters.species);
  }

  if (filters.sex) {
    query = query.eq('sex', filters.sex);
  }

  if (filters.size) {
    query = query.eq('size', filters.size);
  }

  if (filters.since) {
    query = query.gte('published_at', filters.since);
  }

  if (filters.until) {
    query = query.lte('published_at', filters.until);
  }

  if (filters.query) {
    const normalized = filters.query.trim();

    if (normalized.length > 1) {
      query = query.or(
        [
          `title.ilike.%${normalized}%`,
          `description.ilike.%${normalized}%`,
          `species.ilike.%${normalized}%`,
          `breed.ilike.%${normalized}%`,
          `color.ilike.%${normalized}%`,
        ].join(',')
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as PublicationRow[]).map(mapPublication);
}

export async function countPublications(filters: SearchFilters): Promise<number> {
  let query = supabase
    .from('publications')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'DELETED');

  if (filters.type && filters.type !== 'ALL') {
    query = query.eq('type', filters.type);
  }

  if (filters.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }

  if (filters.province) {
    query = query.eq('location.province', filters.province);
  }

  if (filters.municipality) {
    query = query.eq('location.municipality', filters.municipality);
  }

  if (filters.species) {
    query = query.eq('species', filters.species);
  }

  if (filters.sex) {
    query = query.eq('sex', filters.sex);
  }

  if (filters.size) {
    query = query.eq('size', filters.size);
  }

  if (filters.since) {
    query = query.gte('published_at', filters.since);
  }

  if (filters.until) {
    query = query.lte('published_at', filters.until);
  }

  if (filters.query) {
    const normalized = filters.query.trim();

    if (normalized.length > 1) {
      query = query.or(
        [
          `title.ilike.%${normalized}%`,
          `description.ilike.%${normalized}%`,
          `species.ilike.%${normalized}%`,
          `breed.ilike.%${normalized}%`,
          `color.ilike.%${normalized}%`,
        ].join(',')
      );
    }
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getPublicationBySlug(slug: string) {
  const { data, error } = await supabase
    .from('publications')
    .select(`
      id, 
      slug, 
      title, 
      description, 
      type, 
      status, 
      species, 
      breed, 
      color, 
      sex, 
      size, 
      age_approx,
      characteristics,
      published_at, 
      contact_phone, 
      contact_whatsapp, 
      contact_mode, 
      reward, 
      event_date, 
      event_time_approx, 
      owner_profile_id,
      owner:profiles!owner_profile_id(username),
      location:locations(province, municipality, zone, approximate_lat, approximate_lng), 
      publication_images(storage_path, is_cover, alt_text)
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    | (PublicationRow & {
        age_approx: string | null;
        characteristics: string | null;
        contact_phone: string | null;
        contact_whatsapp: string | null;
        contact_mode: 'INTERNAL' | 'PHONE' | 'WHATSAPP';
        reward: string | null;
        event_date: string | null;
        event_time_approx: string | null;
        owner: { username: string } | null;
      })
    | null;
}