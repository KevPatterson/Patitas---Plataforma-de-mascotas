import { z } from 'zod';

// Validación para crear un job de IA
export const createAIJobSchema = z.object({
  publicationId: z.string().uuid('ID de publicación inválido'),
  jobType: z.enum(['ocr', 'vision', 'embedding_text', 'embedding_image', 'moderation', 'extraction']),
  priority: z.number().int().min(1).max(10).optional(),
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'GOOGLE', 'CLOUDFLARE', 'CUSTOM']).optional(),
  model: z.string().optional(),
});

// Validación para atributos extraídos
export const extractedAttributeSchema = z.object({
  attribute_key: z.string().min(1),
  attribute_value: z.string().min(1),
  confidence: z.number().min(0).max(1),
  source: z.enum(['vision', 'ocr', 'hybrid']),
});

// Validación para crear un match
export const createMatchSchema = z.object({
  publicationAId: z.string().uuid(),
  publicationBId: z.string().uuid(),
  matchType: z.enum(['LOST_FOUND', 'SIGHTING', 'VISUAL', 'SEMANTIC']),
  overallScore: z.number().min(0).max(100),
  structuredScore: z.number().min(0).max(100).optional(),
  textScore: z.number().min(0).max(100).optional(),
  semanticScore: z.number().min(0).max(100).optional(),
  visualScore: z.number().min(0).max(100).optional(),
  reasons: z.array(z.string()).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
}).refine((data) => data.publicationAId !== data.publicationBId, {
  message: 'Las publicaciones deben ser diferentes',
  path: ['publicationBId'],
});

// Validación para confirmar/descartar un match
export const matchActionSchema = z.object({
  matchId: z.string().uuid(),
  action: z.enum(['confirm', 'dismiss']),
});

// Validación para crear detección de duplicado
export const createDuplicateDetectionSchema = z.object({
  publicationAId: z.string().uuid(),
  publicationBId: z.string().uuid(),
  similarityScore: z.number().min(0).max(100),
  sameImageHash: z.boolean().optional(),
  similarImage: z.boolean().optional(),
  sameText: z.boolean().optional(),
  similarText: z.boolean().optional(),
  sameLocation: z.boolean().optional(),
  sameDate: z.boolean().optional(),
  duplicateProbability: z.number().min(0).max(1),
}).refine((data) => data.publicationAId !== data.publicationBId, {
  message: 'Las publicaciones deben ser diferentes',
  path: ['publicationBId'],
});

// Validación para revisar duplicado
export const reviewDuplicateSchema = z.object({
  duplicateId: z.string().uuid(),
  isDuplicate: z.boolean(),
});

// Validación para moderación
export const moderationResultSchema = z.object({
  classification: z.enum(['SAFE', 'SPAM', 'FRAUD', 'OFFENSIVE', 'INAPPROPRIATE', 'UNRELATED', 'UNCERTAIN']),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional(),
  requiresHumanReview: z.boolean(),
});

// Validación para OCR result
export const ocrResultSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  language: z.string().optional(),
  boundingBoxes: z
    .array(
      z.object({
        text: z.string(),
        bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
        confidence: z.number(),
      })
    )
    .optional(),
});

// Validación para vision result
export const visionResultSchema = z.object({
  species: z
    .object({
      value: z.string(),
      confidence: z.number().min(0).max(1),
    })
    .optional(),
  breed: z
    .object({
      value: z.string(),
      confidence: z.number().min(0).max(1),
    })
    .optional(),
  colors: z
    .array(
      z.object({
        value: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .optional(),
  features: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .optional(),
});

// Validación para embedding
export const embeddingSchema = z.object({
  embedding: z.array(z.number()),
  dimension: z.number().int().positive(),
  model: z.string(),
});

export type CreateAIJobInput = z.infer<typeof createAIJobSchema>;
export type ExtractedAttributeInput = z.infer<typeof extractedAttributeSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type MatchActionInput = z.infer<typeof matchActionSchema>;
export type CreateDuplicateDetectionInput = z.infer<typeof createDuplicateDetectionSchema>;
export type ReviewDuplicateInput = z.infer<typeof reviewDuplicateSchema>;
export type ModerationResultInput = z.infer<typeof moderationResultSchema>;
export type OCRResultInput = z.infer<typeof ocrResultSchema>;
export type VisionResultInput = z.infer<typeof visionResultSchema>;
export type EmbeddingInput = z.infer<typeof embeddingSchema>;
