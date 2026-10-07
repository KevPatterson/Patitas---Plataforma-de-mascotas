import { supabase } from '../supabase/client';
import type { DuplicateDetection } from './types';

// Re-exportar para facilitar importaciones
export type { DuplicateDetection } from './types';

/**
 * Obtener duplicados detectados para una publicación
 */
export async function getDuplicatesForPublication(
  publicationId: string
): Promise<DuplicateDetection[]> {
  const { data, error } = await supabase
    .from('duplicate_detections')
    .select('*')
    .or(`publication_a_id.eq.${publicationId},publication_b_id.eq.${publicationId}`)
    .gte('duplicate_probability', 0.7)
    .order('duplicate_probability', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching duplicates:', error);
    return [];
  }

  return (data as DuplicateDetection[]) || [];
}

/**
 * Detectar duplicados de una publicación (llama a API)
 */
export async function detectDuplicates(
  publicationId: string,
  threshold = 0.7
): Promise<{
  duplicates: Array<{
    publicationId: string;
    similarityScore: number;
    duplicateProbability: number;
    reasons: string[];
  }>;
  totalCandidates: number;
}> {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) {
    throw new Error('No hay sesión activa');
  }

  const response = await fetch('/api/ai/detect-duplicates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session.access_token}`,
    },
    body: JSON.stringify({ publicationId, threshold }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al detectar duplicados');
  }

  const result = await response.json();
  return result;
}

/**
 * Marcar un duplicado como revisado (moderadores)
 */
export async function markDuplicateAsReviewed(
  detectionId: string,
  isDuplicate: boolean
): Promise<void> {
  const { data: userResponse } = await supabase.auth.getUser();
  const user = userResponse.user;

  if (!user) {
    throw new Error('No hay sesión activa');
  }

  const { error } = await supabase
    .from('duplicate_detections')
    .update({
      reviewed: true,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      is_duplicate: isDuplicate,
    })
    .eq('id', detectionId);

  if (error) {
    throw error;
  }
}

/**
 * Obtener duplicados pendientes de revisión (moderadores)
 */
export async function getPendingDuplicates(limit = 20): Promise<DuplicateDetection[]> {
  const { data, error } = await supabase
    .from('duplicate_detections')
    .select('*')
    .eq('reviewed', false)
    .gte('duplicate_probability', 0.8)
    .order('duplicate_probability', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching pending duplicates:', error);
    return [];
  }

  return (data as DuplicateDetection[]) || [];
}

/**
 * Calcular hash simple de texto (para comparación local)
 */
export function calculateTextHash(text: string): string {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Verificar si una publicación tiene duplicados detectados
 */
export async function hasDuplicates(publicationId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('duplicate_detections')
    .select('id', { count: 'exact', head: true })
    .or(`publication_a_id.eq.${publicationId},publication_b_id.eq.${publicationId}`)
    .gte('duplicate_probability', 0.8)
    .eq('reviewed', false);

  if (error) {
    console.error('Error checking duplicates:', error);
    return false;
  }

  return (count ?? 0) > 0;
}
