// Interfaz abstracta para proveedores de IA
// Esto permite cambiar de proveedor sin modificar toda la aplicación

import type { AIProvider } from './types';

export type TextAnalysisResult = {
  summary?: string;
  keywords?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  language?: string;
  entities?: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
};

export type ImageAnalysisResult = {
  species?: {
    value: string;
    confidence: number;
  };
  breed?: {
    value: string;
    confidence: number;
  };
  colors?: Array<{
    value: string;
    confidence: number;
  }>;
  features?: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
  objects?: Array<{
    label: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }>;
};

export type OCRResult = {
  text: string;
  confidence: number;
  language?: string;
  blocks?: Array<{
    text: string;
    bbox: [number, number, number, number];
    confidence: number;
  }>;
};

export type EmbeddingResult = {
  embedding: number[];
  dimension: number;
  model: string;
};

export type ModerationResult = {
  classification: 'SAFE' | 'SPAM' | 'FRAUD' | 'OFFENSIVE' | 'INAPPROPRIATE' | 'UNRELATED' | 'UNCERTAIN';
  confidence: number;
  reasons?: string[];
  categories?: Record<string, number>;
};

export type StructuredExtractionResult = {
  pet_name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  province?: string;
  municipality?: string;
  event_date?: string;
  species?: string;
  breed?: string;
  color?: string;
  size?: string;
  sex?: string;
  characteristics?: string[];
  confidence: number;
};

export interface IAIProvider {
  readonly name: AIProvider;
  readonly models: {
    text?: string;
    vision?: string;
    embedding?: string;
    moderation?: string;
  };

  // Análisis de texto
  analyzeText(text: string, options?: {
    language?: string;
    extractEntities?: boolean;
  }): Promise<TextAnalysisResult>;

  // Análisis de imagen
  analyzeImage(imageUrl: string, options?: {
    detectObjects?: boolean;
    detectText?: boolean;
  }): Promise<ImageAnalysisResult>;

  // OCR
  extractText(imageUrl: string, options?: {
    language?: string;
  }): Promise<OCRResult>;

  // Embeddings
  generateTextEmbedding(text: string): Promise<EmbeddingResult>;
  
  generateImageEmbedding(imageUrl: string): Promise<EmbeddingResult>;

  // Moderación
  moderateContent(content: string | { imageUrl: string }): Promise<ModerationResult>;

  // Extracción estructurada
  extractStructuredData(input: {
    text?: string;
    imageUrl?: string;
    context?: string;
  }): Promise<StructuredExtractionResult>;
}

// Función para obtener el proveedor configurado
export function getAIProvider(provider: AIProvider = 'OPENAI'): IAIProvider | null {
  // En el futuro, esto devolverá una implementación concreta
  // Por ahora, retorna null para indicar que no está implementado
  console.warn(`AI Provider ${provider} not yet implemented`);
  return null;
}

// Configuración de proveedores (para uso server-side)
export type AIProviderConfig = {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  models?: {
    text?: string;
    vision?: string;
    embedding?: string;
    moderation?: string;
  };
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute?: number;
  };
};

// Placeholder para futuras implementaciones
export class MockAIProvider implements IAIProvider {
  readonly name: AIProvider = 'CUSTOM';
  readonly models = {
    text: 'mock-text-model',
    vision: 'mock-vision-model',
    embedding: 'mock-embedding-model',
    moderation: 'mock-moderation-model',
  };

  async analyzeText(): Promise<TextAnalysisResult> {
    return {
      summary: 'Mock summary',
      keywords: ['mock', 'keywords'],
      sentiment: 'neutral',
      language: 'es',
    };
  }

  async analyzeImage(): Promise<ImageAnalysisResult> {
    return {
      species: { value: 'dog', confidence: 0.95 },
      colors: [{ value: 'brown', confidence: 0.9 }],
    };
  }

  async extractText(): Promise<OCRResult> {
    return {
      text: 'Mock OCR text',
      confidence: 0.9,
      language: 'es',
    };
  }

  async generateTextEmbedding(): Promise<EmbeddingResult> {
    // Generar embedding mock de 1536 dimensiones (estándar OpenAI)
    const embedding = Array.from({ length: 1536 }, () => Math.random());
    return {
      embedding,
      dimension: 1536,
      model: 'mock-embedding-model',
    };
  }

  async generateImageEmbedding(): Promise<EmbeddingResult> {
    // Generar embedding mock de 512 dimensiones
    const embedding = Array.from({ length: 512 }, () => Math.random());
    return {
      embedding,
      dimension: 512,
      model: 'mock-image-embedding-model',
    };
  }

  async moderateContent(): Promise<ModerationResult> {
    return {
      classification: 'SAFE',
      confidence: 0.99,
      categories: {
        spam: 0.01,
        offensive: 0.01,
      },
    };
  }

  async extractStructuredData(): Promise<StructuredExtractionResult> {
    return {
      species: 'dog',
      color: 'brown',
      confidence: 0.8,
    };
  }
}
