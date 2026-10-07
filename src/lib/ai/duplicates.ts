import { supabase } from '../supabase/client';
import type { DuplicateDetection } from './types';

export async function getDuplicatesForPublication(
  publicationId: string
): Promise<DuplicateDetection[]> {
  const { data, error } = await supabase
    .from('duplicate_detections')
    .select('*')
    .or(`publication_a_id.eq.${publicationId},publication_b_id.eq.${publicationId}`)
    .gte('duplicate_probability', 0.6) // Solo mostrar probabilidad >= 60%
    .order('duplicate_probability', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching duplicates:', error);
    return [];
  }

  return (data as DuplicateDetection[]) || [];
}

export async function createDuplicateDetection(input: {
  publicationAId: string;
  publicationBId: string;
  similarityScore: number;
  sameImageHash?: boolean;
  similarImage?: boolean;
  sameText?: boolean;
  similarText?: boolean;
  sameLocation?: boolean;
  sameDate?: boolean;
  duplicateProbability: number;
}): Promise<string | null> {
  // Asegurar que publication_a_id < publication_b_id
  const [pubAId, pubBId] =
    input.publicationAId < input.publicationBId
      ? [input.publicationAId, input.publicationBId]
      : [input.publicationBId, input.publicationAId];

  const { data, error } = await supabase
    .from('duplicate_detections')
    .insert({
      publication_a_id: pubAId,
      publication_b_id: pubBId,
      similarity_score: input.similarityScore,
      same_image_hash: input.sameImageHash ?? false,
      similar_image: input.similarImage ?? false,
      same_text: input.sameText ?? false,
      similar_text: input.similarText ?? false,
      same_location: input.sameLocation ?? false,
      same_date: input.sameDate ?? false,
      duplicate_probability: input.duplicateProbability,
      reviewed: false,
      metadata: {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating duplicate detection:', error);
    return null;
  }

  return data.id;
}

export async function markDuplicateAsReviewed(
  duplicateId: string,
  isDuplicate: boolean,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('duplicate_detections')
    .update({
      reviewed: true,
      is_duplicate: isDuplicate,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', duplicateId);

  if (error) {
    throw error;
  }
}

// Calcular probabilidad de duplicado basada en múltiples señales
export function calculateDuplicateProbability(signals: {
  sameImageHash?: boolean;
  similarImage?: boolean;
  sameText?: boolean;
  similarText?: boolean;
  sameLocation?: boolean;
  sameDate?: boolean;
  textSimilarity?: number; // 0-1
  imageSimilarity?: number; // 0-1
}): number {
  let probability = 0;
  let factors = 0;

  // Hash de imagen idéntico = casi certeza de duplicado
  if (signals.sameImageHash) {
    probability += 0.9;
    factors++;
  }

  // Imagen muy similar
  if (signals.similarImage && signals.imageSimilarity) {
    probability += signals.imageSimilarity * 0.7;
    factors++;
  }

  // Texto idéntico
  if (signals.sameText) {
    probability += 0.8;
    factors++;
  }

  // Texto muy similar
  if (signals.similarText && signals.textSimilarity) {
    probability += signals.textSimilarity * 0.6;
    factors++;
  }

  // Misma ubicación
  if (signals.sameLocation) {
    probability += 0.4;
    factors++;
  }

  // Misma fecha
  if (signals.sameDate) {
    probability += 0.3;
    factors++;
  }

  // Promedio ponderado
  return factors > 0 ? Math.min(probability / factors, 1) : 0;
}

// Detectar duplicados basándose en texto similar
export async function findTextDuplicates(
  publicationId: string,
  title: string,
  description: string,
  threshold = 0.7
): Promise<string[]> {
  // Usar pg_trgm para búsqueda de texto similar
  const searchText = `${title} ${description}`.toLowerCase().substring(0, 500);

  const { data, error } = await supabase
    .from('publications')
    .select('id, title, description')
    .neq('id', publicationId)
    .neq('status', 'DELETED')
    .or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%`)
    .limit(10);

  if (error || !data) {
    return [];
  }

  // Calcular similitud de Jaccard para cada resultado
  const candidates: Array<{ id: string; similarity: number }> = [];

  for (const pub of data) {
    const pubText = `${pub.title} ${pub.description}`.toLowerCase();
    const similarity = calculateJaccardSimilarity(searchText, pubText);

    if (similarity >= threshold) {
      candidates.push({ id: pub.id, similarity });
    }
  }

  return candidates
    .sort((a, b) => b.similarity - a.similarity)
    .map((c) => c.id);
}

// Similitud de Jaccard entre dos textos
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(text2.split(/\s+/).filter((w) => w.length > 3));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// Obtener duplicados pendientes de revisión (para moderadores)
export async function getPendingDuplicatesForReview(limit = 20): Promise<
  Array<
    DuplicateDetection & {
      publication_a: { title: string; slug: string };
      publication_b: { title: string; slug: string };
    }
  >
> {
  const { data, error } = await supabase
    .from('duplicate_detections')
    .select(
      `
      *,
      publication_a:publications!publication_a_id(title, slug),
      publication_b:publications!publication_b_id(title, slug)
    `
    )
    .eq('reviewed', false)
    .gte('duplicate_probability', 0.7)
    .order('duplicate_probability', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching pending duplicates:', error);
    return [];
  }

  return (data as Array<
    DuplicateDetection & {
      publication_a: { title: string; slug: string } | { title: string; slug: string }[];
      publication_b: { title: string; slug: string } | { title: string; slug: string }[];
    }
  >).map((item) => ({
    ...item,
    publication_a: Array.isArray(item.publication_a)
      ? item.publication_a[0]
      : item.publication_a,
    publication_b: Array.isArray(item.publication_b)
      ? item.publication_b[0]
      : item.publication_b,
  }));
}

// Hash simple de texto (para comparación rápida)
export async function generateTextHash(text: string): Promise<string> {
  // Normalizar texto
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Usar Web Crypto API para SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
