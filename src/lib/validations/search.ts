import { z } from 'zod';

export const searchSchema = z.object({
  q: z.string().max(100).optional(),
  type: z.enum(['ALL', 'LOST', 'FOUND', 'ABANDONED', 'ADOPTION', 'SIGHTING']).default('ALL'),
  species: z.string().optional(),
  sex: z.enum(['male', 'female', 'unknown']).optional(),
  size: z.enum(['small', 'medium', 'large', 'unknown']).optional(),
  province: z.string().optional(),
  municipality: z.string().optional(),
  status: z.enum(['ALL', 'ACTIVE', 'RESOLVED', 'EXPIRED', 'HIDDEN', 'DELETED']).default('ACTIVE'),
  since: z.string().optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;
