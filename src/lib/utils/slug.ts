export function buildPublicationSlug(title: string) {
  const slugBase = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);

  const suffix = Math.random().toString(36).slice(2, 7);

  return `${slugBase || 'caso'}-${suffix}`;
}