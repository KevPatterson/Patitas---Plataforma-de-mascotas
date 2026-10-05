import { describe, expect, it } from 'vitest';
import { buildPublicationSlug } from './slug';

describe('buildPublicationSlug', () => {
  it('creates a normalized slug from accented text', () => {
    const slug = buildPublicationSlug('Toby perdido en Playa');

    expect(slug.startsWith('toby-perdido-en-playa-')).toBe(true);
  });

  it('falls back to a safe slug when the title is empty', () => {
    const slug = buildPublicationSlug('   ');

    expect(slug.startsWith('caso-')).toBe(true);
  });
});