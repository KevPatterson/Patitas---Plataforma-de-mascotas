import { supabase } from '../supabase/client';
import type { AIMatch, MatchStatus, MatchType } from './types';

export async function getMatchesForPublication(publicationId: string): Promise<AIMatch[]> {
  const { data, error } = await supabase
    .from('ai_matches')
    .select('*')
    .or(`publication_a_id.eq.${publicationId},publication_b_id.eq.${publicationId}`)
    .gte('overall_score', 60) // Solo mostrar matches con score >= 60
    .order('overall_score', { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return (data as AIMatch[]) || [];
}

export async function createMatch(input: {
  publicationAId: string;
  publicationBId: string;
  matchType: MatchType;
  overallScore: number;
  structuredScore?: number;
  textScore?: number;
  semanticScore?: number;
  visualScore?: number;
  reasons?: string[];
  provider?: string;
  model?: string;
}): Promise<string> {
  // Asegurar que publication_a_id < publication_b_id para unicidad
  const [pubAId, pubBId] =
    input.publicationAId < input.publicationBId
      ? [input.publicationAId, input.publicationBId]
      : [input.publicationBId, input.publicationAId];

  const { data, error } = await supabase
    .from('ai_matches')
    .insert({
      publication_a_id: pubAId,
      publication_b_id: pubBId,
      match_type: input.matchType,
      overall_score: input.overallScore,
      structured_score: input.structuredScore || null,
      text_score: input.textScore || null,
      semantic_score: input.semanticScore || null,
      visual_score: input.visualScore || null,
      provider: input.provider || null,
      model: input.model || null,
      status: 'PENDING' as MatchStatus,
      viewed_by_a: false,
      viewed_by_b: false,
      reasons: input.reasons || [],
      metadata: {},
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function markMatchAsViewed(matchId: string, publicationId: string): Promise<void> {
  // Determinar si el usuario es A o B
  const { data: match } = await supabase
    .from('ai_matches')
    .select('publication_a_id, publication_b_id')
    .eq('id', matchId)
    .single();

  if (!match) {
    throw new Error('Match not found');
  }

  const isUserA = match.publication_a_id === publicationId;
  const updateField = isUserA ? 'viewed_by_a' : 'viewed_by_b';

  const { error } = await supabase
    .from('ai_matches')
    .update({
      [updateField]: true,
      status: 'VIEWED' as MatchStatus,
    })
    .eq('id', matchId);

  if (error) {
    throw error;
  }
}

export async function confirmMatch(matchId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_matches')
    .update({
      status: 'CONFIRMED' as MatchStatus,
      confirmed_by: userId,
    })
    .eq('id', matchId);

  if (error) {
    throw error;
  }
}

export async function dismissMatch(matchId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_matches')
    .update({
      status: 'DISMISSED' as MatchStatus,
      dismissed_by: userId,
    })
    .eq('id', matchId);

  if (error) {
    throw error;
  }
}

// Calcular match score estructurado (llamar a función de DB)
export async function calculateStructuredScore(
  pubAId: string,
  pubBId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_structured_match_score', {
    pub_a_id: pubAId,
    pub_b_id: pubBId,
  });

  if (error) {
    console.error('Error calculating structured score:', error);
    return 0;
  }

  return (data as number) || 0;
}

// Buscar publicaciones similares usando embeddings
export async function findSimilarPublicationsByText(
  publicationId: string,
  threshold = 0.7,
  limit = 10
): Promise<Array<{ publicationId: string; similarity: number }>> {
  // Obtener el embedding de la publicación actual
  const { data: embedding } = await supabase
    .from('ai_text_embeddings')
    .select('embedding')
    .eq('publication_id', publicationId)
    .eq('text_source', 'combined')
    .single();

  if (!embedding || !embedding.embedding) {
    return [];
  }

  // Buscar similares usando la función de DB
  try {
    const { data, error } = await supabase.rpc('search_similar_publications_by_text', {
      query_embedding: embedding.embedding,
      similarity_threshold: threshold,
      result_limit: limit,
    });

    if (error) {
      console.error('Error searching similar publications:', error);
      return [];
    }

    return (
      (data as Array<{ publication_id: string; similarity: number }>)?.map((item) => ({
        publicationId: item.publication_id,
        similarity: item.similarity,
      })) || []
    );
  } catch (error) {
    console.warn('pgvector not available for semantic search:', error);
    return [];
  }
}

// Crear match híbrido combinando múltiples scores
export async function createHybridMatch(input: {
  publicationAId: string;
  publicationBId: string;
  structuredScore?: number;
  textScore?: number;
  semanticScore?: number;
  visualScore?: number;
}): Promise<string | null> {
  const scores: number[] = [];
  const reasons: string[] = [];

  if (input.structuredScore !== undefined && input.structuredScore > 0) {
    scores.push(input.structuredScore);
    if (input.structuredScore > 70) reasons.push('Atributos estructurados similares');
  }

  if (input.textScore !== undefined && input.textScore > 0) {
    scores.push(input.textScore);
    if (input.textScore > 70) reasons.push('Descripción similar');
  }

  if (input.semanticScore !== undefined && input.semanticScore > 0) {
    scores.push(input.semanticScore);
    if (input.semanticScore > 70) reasons.push('Similitud semántica alta');
  }

  if (input.visualScore !== undefined && input.visualScore > 0) {
    scores.push(input.visualScore);
    if (input.visualScore > 80) reasons.push('Similitud visual alta');
  }

  if (scores.length === 0) {
    return null;
  }

  // Calcular promedio ponderado
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Solo crear match si el score es >= 60
  if (overallScore < 60) {
    return null;
  }

  return createMatch({
    publicationAId: input.publicationAId,
    publicationBId: input.publicationBId,
    matchType: 'LOST_FOUND',
    overallScore,
    structuredScore: input.structuredScore,
    textScore: input.textScore,
    semanticScore: input.semanticScore,
    visualScore: input.visualScore,
    reasons,
  });
}
