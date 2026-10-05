type Publication = {
  id: string;
  species: string;
  color: string | null;
  size: string | null;
  sex: string | null;
  province: string;
  municipality: string;
  event_date: string | null;
};

type Match = {
  publicationId: string;
  score: number;
  reasons: string[];
};

function normalizeString(str: string | null | undefined): string {
  return (str ?? '').toLowerCase().trim();
}

function calculateDateProximity(date1: string | null, date2: string | null): number {
  if (!date1 || !date2) return 0;

  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffDays = Math.abs((d1.getTime() - d2.getTime()) / 86400000);

  if (diffDays <= 3) return 30;
  if (diffDays <= 7) return 20;
  if (diffDays <= 14) return 10;
  return 0;
}

function calculateColorSimilarity(color1: string | null, color2: string | null): number {
  if (!color1 || !color2) return 0;
  
  const c1 = normalizeString(color1);
  const c2 = normalizeString(color2);

  if (c1 === c2) return 25;
  
  // Colores similares
  const similar = [
    ['negro', 'oscuro'],
    ['blanco', 'claro'],
    ['marrón', 'caramelo', 'café'],
    ['gris', 'plateado'],
  ];

  for (const group of similar) {
    if (group.some((c) => c1.includes(c)) && group.some((c) => c2.includes(c))) {
      return 15;
    }
  }

  return 0;
}

export function calculateMatch(lost: Publication, found: Publication): Match | null {
  // Las especies deben coincidir
  if (normalizeString(lost.species) !== normalizeString(found.species)) {
    return null;
  }

  let score = 0;
  const reasons: string[] = [];

  // Especie (obligatorio, no suma puntos)
  reasons.push(`Misma especie: ${lost.species}`);

  // Ubicación (35 puntos máximo)
  if (normalizeString(lost.province) === normalizeString(found.province)) {
    score += 20;
    reasons.push('Misma provincia');

    if (normalizeString(lost.municipality) === normalizeString(found.municipality)) {
      score += 15;
      reasons.push('Mismo municipio');
    }
  }

  // Color (25 puntos máximo)
  const colorScore = calculateColorSimilarity(lost.color, found.color);
  if (colorScore > 0) {
    score += colorScore;
    reasons.push(colorScore === 25 ? 'Color idéntico' : 'Color similar');
  }

  // Tamaño (15 puntos)
  if (lost.size && found.size && normalizeString(lost.size) === normalizeString(found.size)) {
    score += 15;
    reasons.push('Mismo tamaño');
  }

  // Sexo (10 puntos)
  if (lost.sex && found.sex && normalizeString(lost.sex) === normalizeString(found.sex)) {
    score += 10;
    reasons.push('Mismo sexo');
  }

  // Fecha (30 puntos máximo)
  const dateScore = calculateDateProximity(lost.event_date, found.event_date);
  if (dateScore > 0) {
    score += dateScore;
    reasons.push('Fechas cercanas');
  }

  // Solo retornar matches con score >= 50%
  if (score < 50) {
    return null;
  }

  return {
    publicationId: found.id,
    score,
    reasons,
  };
}

export function findMatches(target: Publication, candidates: Publication[]): Match[] {
  const matches: Match[] = [];

  for (const candidate of candidates) {
    // No comparar consigo mismo
    if (candidate.id === target.id) continue;

    const match = calculateMatch(target, candidate);
    if (match) {
      matches.push(match);
    }
  }

  // Ordenar por score descendente
  return matches.sort((a, b) => b.score - a.score);
}
