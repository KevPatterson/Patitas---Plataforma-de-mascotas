import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseAdmin } from '../_lib/supabase-admin';
import { rateLimit } from '../_lib/rate-limit';

// Configuración para manejar archivos
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Tipos para la respuesta
type ExtractedData = {
  species?: string;
  breed?: string;
  sex?: string;
  size?: string;
  ageApprox?: string;
  color?: string;
  characteristics?: string;
  collar?: boolean;
  plate?: boolean;
  confidence: number;
};

// Función para analizar imagen con IA (mock por ahora)
async function analyzeImageWithAI(imageBase64: string): Promise<ExtractedData> {
  // TODO: Integrar con un proveedor de IA real (OpenAI GPT-4 Vision, Claude, etc.)
  // Por ahora, devolvemos datos mock para demostración
  
  // Simular procesamiento con delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // En producción, aquí se haría:
  // 1. Enviar la imagen base64 a API de visión (OpenAI, Anthropic, etc.)
  // 2. Usar prompt estructurado para extraer datos específicos:
  //    - Especie del animal
  //    - Raza si es identificable
  //    - Sexo si es visible
  //    - Tamaño aproximado
  //    - Edad aproximada
  //    - Color principal y secundario
  //    - Características distintivas
  //    - Detección de collar o placa
  // 3. Validar y normalizar la respuesta

  // Ejemplo de implementación real con OpenAI:
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza esta imagen de un animal y extrae la siguiente información en formato JSON:
            {
              "species": "DOG o CAT",
              "breed": "raza específica o 'Mestizo'",
              "sex": "MALE o FEMALE si es identificable",
              "size": "SMALL, MEDIUM o LARGE",
              "ageApprox": "PUPPY, YOUNG, ADULT o SENIOR",
              "color": "descripción del color principal",
              "characteristics": "características físicas distintivas",
              "collar": true/false si tiene collar visible,
              "plate": true/false si tiene placa visible,
              "confidence": número entre 0 y 1
            }
            Si algún campo no es identificable, omítelo.`
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      }],
      max_tokens: 500,
    }),
  });
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
  */

  // Mock de respuesta basado en análisis aleatorio
  const mockSpecies = Math.random() > 0.5 ? 'DOG' : 'CAT';
  const mockBreeds = {
    DOG: ['Mestizo', 'Pastor Alemán', 'Labrador', 'Chihuahua', 'Bulldog'],
    CAT: ['Común Europeo', 'Siamés', 'Persa', 'Mestizo'],
  };

  return {
    species: mockSpecies,
    breed: mockBreeds[mockSpecies][Math.floor(Math.random() * mockBreeds[mockSpecies].length)],
    sex: Math.random() > 0.3 ? (Math.random() > 0.5 ? 'MALE' : 'FEMALE') : undefined,
    size: ['SMALL', 'MEDIUM', 'LARGE'][Math.floor(Math.random() * 3)] as 'SMALL' | 'MEDIUM' | 'LARGE',
    ageApprox: ['PUPPY', 'YOUNG', 'ADULT', 'SENIOR'][Math.floor(Math.random() * 4)] as 'PUPPY' | 'YOUNG' | 'ADULT' | 'SENIOR',
    color: ['Marrón', 'Negro', 'Blanco', 'Gris', 'Marrón y blanco', 'Negro y blanco'][Math.floor(Math.random() * 6)],
    characteristics: 'Orejas caídas, cola larga, pelaje corto',
    collar: Math.random() > 0.6,
    plate: Math.random() > 0.8,
    confidence: 0.75 + Math.random() * 0.2, // Entre 0.75 y 0.95
  };
}

// Función para convertir a español los valores extraídos
function normalizeExtractedData(data: ExtractedData): ExtractedData {
  // Mapeo de especies
  const speciesMap: Record<string, string> = {
    'DOG': 'DOG',
    'CAT': 'CAT',
    'perro': 'DOG',
    'gato': 'CAT',
    'dog': 'DOG',
    'cat': 'CAT',
  };

  // Mapeo de sexo
  const sexMap: Record<string, string> = {
    'MALE': 'MALE',
    'FEMALE': 'FEMALE',
    'macho': 'MALE',
    'hembra': 'FEMALE',
    'male': 'MALE',
    'female': 'FEMALE',
  };

  // Mapeo de tamaño
  const sizeMap: Record<string, string> = {
    'SMALL': 'SMALL',
    'MEDIUM': 'MEDIUM',
    'LARGE': 'LARGE',
    'pequeño': 'SMALL',
    'mediano': 'MEDIUM',
    'grande': 'LARGE',
    'small': 'SMALL',
    'medium': 'MEDIUM',
    'large': 'LARGE',
  };

  // Mapeo de edad
  const ageMap: Record<string, string> = {
    'PUPPY': 'PUPPY',
    'YOUNG': 'YOUNG',
    'ADULT': 'ADULT',
    'SENIOR': 'SENIOR',
    'cachorro': 'PUPPY',
    'joven': 'YOUNG',
    'adulto': 'ADULT',
    'anciano': 'SENIOR',
    'puppy': 'PUPPY',
    'young': 'YOUNG',
    'adult': 'ADULT',
    'senior': 'SENIOR',
  };

  return {
    ...data,
    species: data.species ? (speciesMap[data.species] || data.species) : undefined,
    sex: data.sex ? (sexMap[data.sex] || data.sex) : undefined,
    size: data.size ? (sizeMap[data.size] || data.size) : undefined,
    ageApprox: data.ageApprox ? (ageMap[data.ageApprox] || data.ageApprox) : undefined,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, {
      uniqueTokenPerInterval: 500,
      interval: 60000, // 1 minuto
      maxRequests: 5, // 5 solicitudes por minuto
    });

    if (!rateLimitResult.success) {
      return res.status(429).json({
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      });
    }

    // Obtener la imagen del body (esperamos base64)
    const { image } = req.body as { image?: string };

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ message: 'No se proporcionó ninguna imagen válida' });
    }

    // Remover el prefijo data:image si existe
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Validar que es base64 válido
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return res.status(400).json({ message: 'Formato de imagen inválido' });
    }

    // Calcular tamaño aproximado (base64 es ~33% más grande que el original)
    const approximateSize = (base64Data.length * 3) / 4;
    const maxSize = 8 * 1024 * 1024; // 8 MB

    if (approximateSize > maxSize) {
      return res.status(400).json({ message: 'La imagen excede 8 MB' });
    }

    // Analizar imagen con IA
    const extractedData = await analyzeImageWithAI(base64Data);

    // Normalizar datos
    const normalizedData = normalizeExtractedData(extractedData);

    // Devolver datos extraídos
    return res.status(200).json(normalizedData);

  } catch (error) {
    console.error('Error en extract-from-image:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Error al procesar la imagen',
    });
  }
}
