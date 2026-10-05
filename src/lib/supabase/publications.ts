import { supabase } from './client';

type CreateLocationInput = {
  province: string;
  municipality: string;
  zone?: string;
  approximateLat?: string;
  approximateLng?: string;
};

type CreatePublicationInput = {
  ownerProfileId: string;
  slug: string;
  locationId: string | null;
  type: 'LOST' | 'FOUND' | 'ABANDONED' | 'ADOPTION' | 'SIGHTING';
  title: string;
  description: string;
  species: string;
  breed?: string;
  sex?: string;
  size?: string;
  ageApprox?: string;
  color: string;
  characteristics?: string;
  collar: boolean;
  plate: boolean;
  reward?: string;
  contactMode: 'INTERNAL' | 'PHONE' | 'WHATSAPP';
  contactPhone?: string;
  contactWhatsapp?: string;
  eventDate?: string;
  eventTimeApprox?: string;
};

export async function createLocation(input: CreateLocationInput) {
  const { data, error } = await supabase
    .from('locations')
    .insert({
      province: input.province,
      municipality: input.municipality,
      zone: input.zone || null,
      approximate_lat: input.approximateLat ? Number(input.approximateLat) : null,
      approximate_lng: input.approximateLng ? Number(input.approximateLng) : null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function createPublication(input: CreatePublicationInput) {
  const { data, error } = await supabase
    .from('publications')
    .insert({
      owner_profile_id: input.ownerProfileId,
      slug: input.slug,
      location_id: input.locationId,
      type: input.type,
      title: input.title,
      description: input.description,
      species: input.species,
      breed: input.breed || null,
      sex: input.sex || null,
      size: input.size || null,
      age_approx: input.ageApprox || null,
      color: input.color,
      characteristics: input.characteristics || null,
      collar: input.collar,
      plate: input.plate,
      reward: input.reward || null,
      contact_mode: input.contactMode,
      contact_phone: input.contactPhone || null,
      contact_whatsapp: input.contactWhatsapp || null,
      event_date: input.eventDate || null,
      event_time_approx: input.eventTimeApprox || null,
    })
    .select('id, slug')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function uploadPublicationImages(publicationId: string, files: File[]) {
  const uploads = await Promise.all(
    files.map(async (file, index) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten imágenes.');
      }

      if (file.size > 8 * 1024 * 1024) {
        throw new Error('Cada imagen debe pesar menos de 8 MB.');
      }

      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${publicationId}/${Date.now()}-${index}.${extension}`;
      const { data, error } = await supabase.storage.from('pet-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (error) {
        throw error;
      }

      return {
        storagePath: data.path,
        altText: file.name,
        sortOrder: index,
        isCover: index === 0,
      };
    })
  );

  const { error } = await supabase.from('publication_images').insert(
    uploads.map((upload) => ({
      publication_id: publicationId,
      storage_path: upload.storagePath,
      alt_text: upload.altText,
      sort_order: upload.sortOrder,
      is_cover: upload.isCover,
    }))
  );

  if (error) {
    throw error;
  }
}