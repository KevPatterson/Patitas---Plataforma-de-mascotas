import { describe, expect, it } from 'vitest';
import { publicationFormSchema } from './publication';

describe('publicationFormSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = publicationFormSchema.safeParse({
      type: 'LOST',
      title: 'Toby perdido',
      description: 'Perro caramelo visto por última vez en Playa.',
      species: 'Perro',
      color: 'Marrón',
      contactMode: 'INTERNAL',
      province: 'La Habana',
      municipality: 'Playa',
      collar: false,
      plate: false,
    });

    expect(result.success).toBe(true);
  });

  it('rejects short titles', () => {
    const result = publicationFormSchema.safeParse({
      type: 'LOST',
      title: 'To',
      description: 'Perro caramelo visto por última vez en Playa.',
      species: 'Perro',
      color: 'Marrón',
      contactMode: 'INTERNAL',
      province: 'La Habana',
      municipality: 'Playa',
      collar: false,
      plate: false,
    });

    expect(result.success).toBe(false);
  });
});