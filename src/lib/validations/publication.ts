import { z } from 'zod';

export const publicationTypeSchema = z.enum(['LOST', 'FOUND', 'ABANDONED', 'ADOPTION', 'SIGHTING']);

export const publicationFormSchema = z.object({
  type: publicationTypeSchema,
  title: z.string().min(3, 'Ingresa un título claro.'),
  description: z.string().min(20, 'Agrega una descripción más detallada.'),
  species: z.string().min(2, 'Indica la especie.'),
  breed: z.string().optional(),
  sex: z.string().optional(),
  size: z.string().optional(),
  ageApprox: z.string().optional(),
  color: z.string().min(2, 'Describe el color principal.'),
  characteristics: z.string().optional(),
  collar: z.boolean().default(false),
  plate: z.boolean().default(false),
  reward: z.string().optional(),
  contactMode: z.enum(['INTERNAL', 'PHONE', 'WHATSAPP']),
  contactPhone: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  province: z.string().min(2, 'Indica la provincia.'),
  municipality: z.string().min(2, 'Indica el municipio.'),
  zone: z.string().optional(),
  approximateLat: z.string().optional(),
  approximateLng: z.string().optional(),
  eventDate: z.string().optional(),
  eventTimeApprox: z.string().optional(),
});

export type PublicationFormValues = z.infer<typeof publicationFormSchema>;