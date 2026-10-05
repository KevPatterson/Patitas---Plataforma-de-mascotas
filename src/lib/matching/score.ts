import type { PublicationSummary } from '../supabase/publication-search';

export function calculateMatchScore(source: PublicationSummary, candidate: PublicationSummary) {
  let score = 0;

  if (source.species.toLowerCase() === candidate.species.toLowerCase()) score += 30;
  if (source.province && candidate.province && source.province.toLowerCase() === candidate.province.toLowerCase()) score += 20;
  if (source.municipality && candidate.municipality && source.municipality.toLowerCase() === candidate.municipality.toLowerCase()) score += 15;
  if (source.color && candidate.color && source.color.toLowerCase() === candidate.color.toLowerCase()) score += 15;
  if (source.sex && candidate.sex && source.sex.toLowerCase() === candidate.sex.toLowerCase()) score += 10;
  if (source.size && candidate.size && source.size.toLowerCase() === candidate.size.toLowerCase()) score += 10;

  return Math.min(score, 100);
}