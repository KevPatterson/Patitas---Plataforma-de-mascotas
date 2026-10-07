import type {
  IAIProvider,
  TextAnalysisResult,
  ImageAnalysisResult,
  OCRResult,
  EmbeddingResult,
  ModerationResult,
  StructuredExtractionResult,
} from '../provider-interface';
import type { AIProvider } from '../types';

/**
 * Mock AI Provider para desarrollo y testing
 * Genera resultados simulados realistas con delays
 */
export class MockAIProvider implements IAIProvider {
  readonly name: AIProvider = 'CUSTOM';
  readonly models = {
    text: 'mock-text-v1',
    vision: 'mock-vision-v1',
    embedding: 'mock-embedding-v1',
    moderation: 'mock-moderation-v1',
  };

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async analyzeText(text: string): Promise<TextAnalysisResult> {
    await this.delay(500);

    // Extraer entidades básicas
    const phoneRegex = /(\+?53)?[\s-]?([5]\d{3})[\s-]?(\d{4})/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const phones = [...text.matchAll(phoneRegex)].map((m) => m[0]);
    const emails = [...text.matchAll(emailRegex)].map((m) => m[0]);

    const entities: Array<{ type: string; value: string; confidence: number }> = [];

    phones.forEach((phone) => {
      entities.push({ type: 'phone', value: phone, confidence: 0.9 });
    });

    emails.forEach((email) => {
      entities.push({ type: 'email', value: email, confidence: 0.95 });
    });

    // Detectar keywords simples
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    ['perro', 'gato', 'perdido', 'encontrado', 'collar', 'microchip', 'habana', 'varadero'].forEach((kw) => {
      if (lowerText.includes(kw)) {
        keywords.push(kw);
      }
    });

    return {
      summary: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
      keywords: keywords.length > 0 ? keywords : ['mascota', 'cuba'],
      sentiment: 'neutral',
      language: 'es',
      entities: entities.length > 0 ? entities : undefined,
    };
  }

  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    await this.delay(800);

    // Simulación: Generar resultados basados en hash de la URL
    const urlHash = imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const species = urlHash % 2 === 0 ? 'dog' : 'cat';
    const breeds = species === 'dog' 
      ? ['Labrador', 'Chihuahua', 'Mestizo', 'Pastor Alemán', 'Poodle']
      : ['Persa', 'Siamés', 'Mestizo', 'Angora', 'Maine Coon'];
    
    const colors = ['negro', 'blanco', 'marrón', 'gris', 'naranja', 'multicolor'];
    
    const breedIndex = urlHash % breeds.length;
    const colorIndex = (urlHash * 2) % colors.length;

    return {
      species: {
        value: species,
        confidence: 0.85 + (urlHash % 15) / 100,
      },
      breed: {
        value: breeds[breedIndex],
        confidence: 0.65 + (urlHash % 30) / 100,
      },
      colors: [
        {
          value: colors[colorIndex],
          confidence: 0.8 + (urlHash % 20) / 100,
        },
      ],
      features: [
        {
          key: 'collar',
          value: urlHash % 3 === 0 ? 'yes' : 'no',
          confidence: 0.7,
        },
        {
          key: 'size',
          value: urlHash % 4 === 0 ? 'small' : urlHash % 4 === 1 ? 'medium' : 'large',
          confidence: 0.75,
        },
      ],
    };
  }

  async extractText(imageUrl: string): Promise<OCRResult> {
    await this.delay(700);

    // Simulación: El 40% de las imágenes tienen texto
    const urlHash = imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hasText = urlHash % 10 < 4;

    if (!hasText) {
      return {
        text: '',
        confidence: 0.0,
        language: 'es',
      };
    }

    // Simular textos comunes en publicaciones
    const sampleTexts = [
      'PERDIDO - Llamar al 5555-1234',
      'RECOMPENSA $500',
      'Se perdió en La Habana Vieja',
      'Contacto: 5243-5678',
      'URGENTE: Perro perdido',
    ];

    const textIndex = urlHash % sampleTexts.length;

    return {
      text: sampleTexts[textIndex],
      confidence: 0.85 + (urlHash % 10) / 100,
      language: 'es',
      blocks: [
        {
          text: sampleTexts[textIndex],
          bbox: [10, 10, 200, 50],
          confidence: 0.85,
        },
      ],
    };
  }

  async generateTextEmbedding(text: string): Promise<EmbeddingResult> {
    await this.delay(300);

    // Generar embedding pseudo-aleatorio pero determinista basado en el texto
    const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const embedding = Array.from({ length: 1536 }, (_, i) => {
      const x = Math.sin(seed + i * 0.1) * 10000;
      return (x - Math.floor(x)) * 2 - 1; // Normalizar a [-1, 1]
    });

    return {
      embedding,
      dimension: 1536,
      model: this.models.embedding,
    };
  }

  async generateImageEmbedding(imageUrl: string): Promise<EmbeddingResult> {
    await this.delay(400);

    const seed = imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const embedding = Array.from({ length: 512 }, (_, i) => {
      const x = Math.sin(seed + i * 0.2) * 10000;
      return (x - Math.floor(x)) * 2 - 1;
    });

    return {
      embedding,
      dimension: 512,
      model: 'mock-image-embedding-v1',
    };
  }

  async moderateContent(content: string | { imageUrl: string }): Promise<ModerationResult> {
    await this.delay(400);

    const text = typeof content === 'string' ? content : '';
    const lowerText = text.toLowerCase();

    // Simulación de moderación básica
    const spamKeywords = ['viagra', 'casino', 'click aquí', 'gana dinero'];
    const offensiveKeywords = ['palabra ofensiva'];
    
    const hasSpam = spamKeywords.some((kw) => lowerText.includes(kw));
    const hasOffensive = offensiveKeywords.some((kw) => lowerText.includes(kw));

    if (hasSpam) {
      return {
        classification: 'SPAM',
        confidence: 0.95,
        reasons: ['Contiene palabras clave de spam'],
        categories: {
          spam: 0.95,
          offensive: 0.05,
        },
      };
    }

    if (hasOffensive) {
      return {
        classification: 'OFFENSIVE',
        confidence: 0.88,
        reasons: ['Contiene lenguaje ofensivo'],
        categories: {
          spam: 0.05,
          offensive: 0.88,
        },
      };
    }

    return {
      classification: 'SAFE',
      confidence: 0.98,
      categories: {
        spam: 0.01,
        offensive: 0.01,
      },
    };
  }

  async extractStructuredData(input: {
    text?: string;
    imageUrl?: string;
    context?: string;
  }): Promise<StructuredExtractionResult> {
    await this.delay(600);

    const text = input.text ?? '';
    const lowerText = text.toLowerCase();

    // Extraer información estructurada
    const result: StructuredExtractionResult = {
      confidence: 0.7,
    };

    // Extraer nombres comunes de mascotas
    const petNames = ['toby', 'max', 'luna', 'coco', 'rocky', 'bella', 'simba', 'milo', 'nala', 'chispa'];
    for (const name of petNames) {
      if (lowerText.includes(name)) {
        result.pet_name = name.charAt(0).toUpperCase() + name.slice(1);
        break;
      }
    }

    // Extraer teléfonos
    const phoneMatch = text.match(/(\+?53)?[\s-]?([5]\d{3})[\s-]?(\d{4})/);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
    }

    // Extraer email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      result.email = emailMatch[0];
    }

    // Detectar especies
    if (lowerText.includes('perro')) {
      result.species = 'dog';
    } else if (lowerText.includes('gato')) {
      result.species = 'cat';
    }

    // Detectar colores comunes
    const colors = ['negro', 'blanco', 'marrón', 'gris', 'naranja'];
    for (const color of colors) {
      if (lowerText.includes(color)) {
        result.color = color;
        break;
      }
    }

    // Detectar tamaños
    if (lowerText.includes('pequeño') || lowerText.includes('chico')) {
      result.size = 'SMALL';
    } else if (lowerText.includes('grande')) {
      result.size = 'LARGE';
    } else if (lowerText.includes('mediano')) {
      result.size = 'MEDIUM';
    }

    // Detectar provincias de Cuba
    const provinces = [
      'habana', 'pinar', 'matanzas', 'cienfuegos', 'villa clara', 
      'sancti spiritus', 'ciego de avila', 'camaguey', 'las tunas', 
      'holguin', 'granma', 'santiago', 'guantanamo'
    ];
    
    for (const province of provinces) {
      if (lowerText.includes(province)) {
        result.province = province.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }

    return result;
  }
}
