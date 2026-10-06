import { z } from 'zod';
import { SEX_LABELS, SIZE_LABELS, AGE_LABELS } from '../constants/labels';

export const publicationTypeSchema = z.enum(['LOST', 'FOUND', 'ABANDONED', 'ADOPTION', 'SIGHTING']);

const sexEnum = z.enum(Object.keys(SEX_LABELS) as [string, ...string[]]);
const sizeEnum = z.enum(Object.keys(SIZE_LABELS) as [string, ...string[]]);
const ageEnum = z.enum(Object.keys(AGE_LABELS) as [string, ...string[]]);

export const publicationFormSchema = z.object({
  type: publicationTypeSchema,
  title: z.string().min(3, 'Ingresa un título claro.'),
  description: z.string().min(20, 'Agrega una descripción más detallada.'),
  species: z.string().min(2, 'Indica la especie.'),
  breed: z.string().optional(),
  sex: sexEnum.optional(),
  size: sizeEnum.optional(),
  ageApprox: ageEnum.optional(),
  color: z.string().min(2, 'Describe el color principal.'),
  characteristics: z.string().optional(),
  collar: z.boolean().default(false),
  plate: z.boolean().default(false),
  reward: z.string().optional(),
  contactMode: z.enum(['INTERNAL', 'PHONE', 'WHATSAPP', 'EMAIL']),
  contactPhone: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  contactEmail: z.string().email('Correo inválido').optional().or(z.literal('')),
  microchip: z.string().max(120).optional().or(z.literal('')),
  province: z.string().min(2, 'Indica la provincia.'),
  municipality: z.string().min(2, 'Indica el municipio.'),
  zone: z.string().optional(),
  approximateLat: z.string().optional(),
  approximateLng: z.string().optional(),
  eventDate: z.string().optional(),
  eventTimeApprox: z.string().optional(),
}).refine((data) => {
  if (data.contactMode === 'PHONE') return data.contactPhone && data.contactPhone.trim().length > 0;
  if (data.contactMode === 'WHATSAPP') return data.contactWhatsapp && data.contactWhatsapp.trim().length > 0;
  if (data.contactMode === 'EMAIL') return data.contactEmail && data.contactEmail.trim().length > 0;
  return true;
}, {
  message: 'Debes ingresar el dato de contacto correspondiente al modo seleccionado.',
  path: ['contactMode'],
});

export type PublicationFormValues = z.infer<typeof publicationFormSchema>;