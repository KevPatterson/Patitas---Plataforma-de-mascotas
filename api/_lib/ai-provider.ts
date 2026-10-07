/**
 * Capa de abstracción para proveedores de IA
 * Permite cambiar de proveedor sin modificar toda la aplicación
 */

export type AIProvider = 'CLOUDFLARE' | 'OPENAI' | 'MOCK';

export type OCRResult = {
  text: string;
  confidence: number;
  language?: string;
  boundingBoxes?: Array<{
    text: string;
    bbox: [number, number, number, number];
    confidence: number;
  }>;
};

export type VisionResult = {
  labels: Array<{ label: string; confidence: number }>;
  objects?: Array<{
    object: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }>;
  description?: string;
};

export type TextEmbeddingResult = {
  embedding: number[];
  dimension: number;
};

export type ImageEmbeddingResult = {
  embedding: number[];
  dimension: number;
};

export type ModerationResult = {
  classification: 'SAFE' | 'SPAM' | 'FRAUD' | 'OFFENSIVE' | 'INAPPROPRIATE' | 'UNRELATED' | 'UNCERTAIN';
  confidence: number;
  reason?: string;
  categories?: Record<string, number>;
};

export interface IAIProvider {
  /**
   * Extraer texto de una imagen (OCR)
   */
  extractTextFromImage(imageUrl: string): Promise<OCRResult>;

  /**
   * Analizar imagen con Computer Vision
   */
  analyzeImage(imageUrl: string, prompt?: string): Promise<VisionResult>;

  /**
   * Generar embedding de texto
   */
  generateTextEmbedding(text: string): Promise<TextEmbeddingResult>;

  /**
   * Generar embedding de imagen
   */
  generateImageEmbedding(imageUrl: string): Promise<ImageEmbeddingResult>;

  /**
   * Moderar contenido
   */
  moderateContent(text: string, imageUrl?: string): Promise<ModerationResult>;
}

/**
 * Obtener proveedor de IA configurado
 */
export function getAIProvider(): IAIProvider {
  const provider = (process.env.AI_PROVIDER || 'MOCK') as AIProvider;

  switch (provider) {
    case 'CLOUDFLARE':
      // Lazy import para no cargar si no se usa
      return getCloudflareProvider();
    case 'OPENAI':
      throw new Error('OpenAI provider not implemented yet');
    case 'MOCK':
    default:
      return getMockProvider();
  }
}

/**
 * Proveedor mock para testing/desarrollo
 */
function getMockProvider(): IAIProvider {
  return {
    async extractTextFromImage(_imageUrl: string): Promise<OCRResult> {
      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        text: 'PERDIDO\nPerro raza mestiza\nColor marrón\nTeléfono: 53501234\nRecompensa: $500',
        confidence: 0.85,
        language: 'es',
        boundingBoxes: [
          { text: 'PERDIDO', bbox: [10, 10, 100, 40], confidence: 0.95 },
          { text: 'Perro raza mestiza', bbox: [10, 50, 200, 80], confidence: 0.90 },
          { text: 'Color marrón', bbox: [10, 90, 150, 120], confidence: 0.88 },
          { text: 'Teléfono: 53501234', bbox: [10, 130, 180, 160], confidence: 0.92 },
          { text: 'Recompensa: $500', bbox: [10, 170, 180, 200], confidence: 0.87 },
        ],
      };
    },

    async analyzeImage(_imageUrl: string, _prompt?: string): Promise<VisionResult> {
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        labels: [
          { label: 'dog', confidence: 0.98 },
          { label: 'brown', confidence: 0.92 },
          { label: 'collar', confidence: 0.75 },
          { label: 'outdoor', confidence: 0.85 },
        ],
        objects: [
          { object: 'dog', confidence: 0.97, bbox: [100, 50, 400, 350] },
          { object: 'collar', confidence: 0.68, bbox: [180, 120, 220, 140] },
        ],
        description: 'A brown dog wearing a collar, photographed outdoors',
      };
    },

    async generateTextEmbedding(_text: string): Promise<TextEmbeddingResult> {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generar embedding mock de 1536 dimensiones (compatible con OpenAI)
      const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);

      return {
        embedding,
        dimension: 1536,
      };
    },

    async generateImageEmbedding(_imageUrl: string): Promise<ImageEmbeddingResult> {
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Generar embedding mock de 512 dimensiones
      const embedding = Array.from({ length: 512 }, () => Math.random() * 2 - 1);

      return {
        embedding,
        dimension: 512,
      };
    },

    async moderateContent(_text: string, _imageUrl?: string): Promise<ModerationResult> {
      await new Promise((resolve) => setTimeout(resolve, 200));

      return {
        classification: 'SAFE',
        confidence: 0.95,
        categories: {
          spam: 0.02,
          fraud: 0.01,
          offensive: 0.01,
          inappropriate: 0.01,
        },
      };
    },
  };
}

/**
 * Proveedor de Cloudflare AI
 */
function getCloudflareProvider(): IAIProvider {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Missing Cloudflare AI credentials: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN required');
  }

  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`;

  return {
    async extractTextFromImage(imageUrl: string): Promise<OCRResult> {
      // Descargar la imagen
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');

      // Cloudflare AI no tiene OCR directo, usar vision model
      const response = await fetch(`${baseUrl}/@cf/llava-hf/llava-1.5-7b-hf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          prompt: 'Extract all visible text from this image. Include phone numbers, addresses, dates, and any other text you can see. Format as plain text.',
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI OCR failed: ${response.statusText}`);
      }

      const data = await response.json();
      const extractedText = data.result?.response || '';

      return {
        text: extractedText,
        confidence: 0.8, // Cloudflare no provee confidence para OCR
        language: 'es',
      };
    },

    async analyzeImage(imageUrl: string, prompt?: string): Promise<VisionResult> {
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');

      const analysisPrompt = prompt || 
        'Analyze this image of a pet. Identify: species (dog/cat/other), breed if visible, color, size (small/medium/large), age estimation, visible features (collar, tags, distinctive marks). Respond in JSON format with keys: species, breed, color, size, age, features.';

      const response = await fetch(`${baseUrl}/@cf/llava-hf/llava-1.5-7b-hf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          prompt: analysisPrompt,
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI vision failed: ${response.statusText}`);
      }

      const data = await response.json();
      const description = data.result?.response || '';

      // Parsear la respuesta para extraer labels
      const labels = parseVisionResponse(description);

      return {
        labels,
        description,
      };
    },

    async generateTextEmbedding(text: string): Promise<TextEmbeddingResult> {
      const response = await fetch(`${baseUrl}/@cf/baai/bge-base-en-v1.5`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI embedding failed: ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.result?.data?.[0] || [];

      return {
        embedding,
        dimension: embedding.length,
      };
    },

    async generateImageEmbedding(imageUrl: string): Promise<ImageEmbeddingResult> {
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');

      const response = await fetch(`${baseUrl}/@cf/microsoft/resnet-50`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI image embedding failed: ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.result?.embedding || [];

      return {
        embedding,
        dimension: embedding.length,
      };
    },

    async moderateContent(text: string, _imageUrl?: string): Promise<ModerationResult> {
      // Cloudflare no tiene modelo de moderación específico, usar LLM
      const response = await fetch(`${baseUrl}/@cf/meta/llama-3-8b-instruct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this content for moderation. Is it: spam, fraud, offensive, inappropriate, or safe? Content: "${text}". Respond with ONE word: SAFE, SPAM, FRAUD, OFFENSIVE, INAPPROPRIATE, or UNRELATED.`,
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI moderation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const result = (data.result?.response || 'SAFE').trim().toUpperCase();

      const validClassifications = ['SAFE', 'SPAM', 'FRAUD', 'OFFENSIVE', 'INAPPROPRIATE', 'UNRELATED'];
      const classification = validClassifications.includes(result) 
        ? result as ModerationResult['classification']
        : 'UNCERTAIN';

      return {
        classification,
        confidence: 0.75,
      };
    },
  };
}

/**
 * Parsear respuesta de vision para extraer labels
 */
function parseVisionResponse(description: string): Array<{ label: string; confidence: number }> {
  const labels: Array<{ label: string; confidence: number }> = [];

  // Intentar parsear como JSON
  try {
    const parsed = JSON.parse(description);
    if (parsed.species) labels.push({ label: parsed.species, confidence: 0.9 });
    if (parsed.breed) labels.push({ label: parsed.breed, confidence: 0.85 });
    if (parsed.color) labels.push({ label: parsed.color, confidence: 0.9 });
    if (parsed.size) labels.push({ label: parsed.size, confidence: 0.8 });
    return labels;
  } catch {
    // No es JSON, extraer keywords
  }

  // Extraer keywords comunes
  const keywords = ['dog', 'cat', 'perro', 'gato', 'brown', 'marrón', 'black', 'negro', 'white', 'blanco', 'collar', 'small', 'medium', 'large'];
  const lowerDesc = description.toLowerCase();

  for (const keyword of keywords) {
    if (lowerDesc.includes(keyword)) {
      labels.push({ label: keyword, confidence: 0.7 });
    }
  }

  return labels;
}
