import { supabase } from './client';

export type MyPublication = {
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
  publishedAt: string;
  province: string | null;
  municipality: string | null;
  zone: string | null;
  approximateLat: number | null;
  approximateLng: number | null;
  coverImageUrl: string | null;
  contactMode: 'INTERNAL' | 'PHONE' | 'WHATSAPP' | 'EMAIL';
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
  reward: string | null;
};

export async function getMyPublications(userId: string): Promise<MyPublication[]> {
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
      published_at,
      contact_mode,
      contact_phone,
      contact_whatsapp,
      contact_email,
      reward,
      location:locations(province, municipality, zone, approximate_lat, approximate_lng),
      publication_images(storage_path, is_cover, alt_text)
    `)
    .eq('owner_profile_id', userId)
    .neq('status', 'DELETED')
    .order('published_at', { ascending: false });

  if (error) throw error;

  return (data as Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    type: MyPublication['type'];
    status: MyPublication['status'];
    species: string;
    breed: string | null;
    color: string | null;
    sex: string | null;
    size: string | null;
    published_at: string;
    contact_mode: MyPublication['contactMode'];
    contact_phone: string | null;
    contact_whatsapp: string | null;
    contact_email: string | null;
    reward: string | null;
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
  }>).map((row) => {
    const cover = row.publication_images.find((img) => img.is_cover) ?? row.publication_images[0] ?? null;
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
      coverImageUrl: cover
        ? supabase.storage.from('pet-images').getPublicUrl(cover.storage_path).data.publicUrl
        : null,
      contactMode: row.contact_mode,
      contactPhone: row.contact_phone,
      contactWhatsapp: row.contact_whatsapp,
      contactEmail: row.contact_email,
      reward: row.reward,
    };
  });
}

export async function deleteMyPublication(userId: string, publicationId: string) {
  const { error } = await supabase
    .from('publications')
    .update({ status: 'DELETED', deleted_at: new Date().toISOString() })
    .eq('id', publicationId)
    .eq('owner_profile_id', userId);

  if (error) throw error;
}

export async function resolveMyPublication(userId: string, publicationId: string) {
  const { error } = await supabase
    .from('publications')
    .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
    .eq('id', publicationId)
    .eq('owner_profile_id', userId);

  if (error) throw error;
}