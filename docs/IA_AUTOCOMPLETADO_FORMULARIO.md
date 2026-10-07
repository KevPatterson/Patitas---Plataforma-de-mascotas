# Sistema de Autocompletado de Formulario con IA

## 📋 Descripción General

Sistema que permite a los usuarios subir una imagen de un animal al crear una publicación, y la IA extrae automáticamente los datos relevantes para rellenar el formulario (especie, raza, color, tamaño, características, etc.).

## 🎯 Objetivos

1. **Reducir fricción**: Simplificar el proceso de publicación
2. **Mejorar calidad**: Extraer datos precisos de las imágenes
3. **Aumentar conversión**: Más usuarios completan el formulario
4. **UX no intrusiva**: El usuario siempre puede revisar y editar

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │   ImageDataExtractor Component             │    │
│  │                                             │    │
│  │  1. Usuario sube imagen                    │    │
│  │  2. Convierte a base64                     │    │
│  │  3. Envía POST a /api/ai/extract-from-image│    │
│  │  4. Muestra loader mientras procesa        │    │
│  │  5. Recibe datos extraídos                 │    │
│  │  6. Actualiza formulario vía callback      │    │
│  └────────────────────────────────────────────┘    │
│                        ↓                             │
└────────────────────────┼──────────────────────────────┘
                         ↓
┌────────────────────────┼──────────────────────────────┐
│                    API Layer                          │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  /api/ai/extract-from-image                 │    │
│  │                                              │    │
│  │  1. Valida imagen (tipo, tamaño)           │    │
│  │  2. Rate limiting (5 req/min)              │    │
│  │  3. Llama a analyzeImageWithAI()           │    │
│  │  4. Normaliza datos extraídos              │    │
│  │  5. Retorna JSON con datos estructurados   │    │
│  └─────────────────────────────────────────────┘    │
│                        ↓                             │
└────────────────────────┼──────────────────────────────┘
                         ↓
┌────────────────────────┼──────────────────────────────┐
│                   IA Provider                         │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  analyzeImageWithAI(base64: string)         │    │
│  │                                              │    │
│  │  [Desarrollo] Mock Provider                │    │
│  │  - Retorna datos simulados                 │    │
│  │  - Delay de 2s para simular procesamiento  │    │
│  │                                              │    │
│  │  [Producción] Proveedor Real               │    │
│  │  - OpenAI GPT-4 Vision                     │    │
│  │  - Anthropic Claude Vision                 │    │
│  │  - Google Gemini Vision                    │    │
│  │  - Cloudflare Workers AI                   │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

## 📦 Componentes Implementados

### 1. `ImageDataExtractor` Component

**Ubicación**: `src/components/ai/image-data-extractor.tsx`

**Props**:
```typescript
type ImageDataExtractorProps = {
  onDataExtracted: (data: ExtractedData) => void;
  disabled?: boolean;
};
```

**Estado Interno**:
- `file`: Archivo de imagen seleccionado
- `preview`: URL de vista previa
- `processing`: Estado de procesamiento
- `error`: Mensaje de error si falla
- `extractedData`: Datos extraídos por la IA

**Flujo**:
1. Usuario selecciona imagen → validación (tipo, tamaño)
2. Muestra vista previa
3. Usuario hace clic en "Extraer datos con IA"
4. Convierte imagen a base64
5. Envía a API
6. Muestra loader
7. Recibe y muestra datos extraídos
8. Llama callback `onDataExtracted`

**Validaciones**:
- Tipos permitidos: JPG, PNG, WebP
- Tamaño máximo: 8 MB
- Muestra errores en UI si falla

### 2. API Endpoint

**Ubicación**: `api/ai/extract-from-image.ts`

**Método**: `POST`

**Request Body**:
```typescript
{
  image: string; // Base64 con prefijo data:image/...
}
```

**Response**:
```typescript
{
  species?: string;        // 'DOG', 'CAT', etc.
  breed?: string;          // 'Mestizo', 'Labrador', etc.
  sex?: string;            // 'MALE', 'FEMALE'
  size?: string;           // 'SMALL', 'MEDIUM', 'LARGE'
  ageApprox?: string;      // 'PUPPY', 'YOUNG', 'ADULT', 'SENIOR'
  color?: string;          // 'Marrón y blanco', etc.
  characteristics?: string; // 'Orejas caídas, cola larga'
  collar?: boolean;        // true si detecta collar
  plate?: boolean;         // true si detecta placa
  confidence: number;      // 0.0 - 1.0
}
```

**Seguridad**:
- Rate limiting: 5 requests/minuto por IP
- Validación de tamaño: máximo 8 MB
- Validación de formato base64
- Sin autenticación obligatoria (feature pública)

**Error Responses**:
- `400`: Imagen inválida o formato incorrecto
- `429`: Demasiadas solicitudes
- `500`: Error interno del servidor

### 3. Integración en Formulario

**Ubicación**: `src/routes/publish-page.tsx`

**Cambios**:
1. Import del componente `ImageDataExtractor`
2. Función `handleAIDataExtracted` para actualizar el formulario
3. Componente agregado al inicio del Paso 2

**Código**:
```typescript
const handleAIDataExtracted = (data: ExtractedData) => {
  setValues((current) => ({
    ...current,
    ...(data.species && { species: data.species }),
    ...(data.breed && { breed: data.breed }),
    // ... resto de campos
  }));
};

// En el JSX del Paso 2:
<ImageDataExtractor 
  onDataExtracted={handleAIDataExtracted}
  disabled={submitting}
/>
```

## 🔄 Flujo de Usuario Completo

```
1. Usuario accede a /publicar
   ↓
2. Completa Paso 1 (tipo de caso, título, descripción)
   ↓
3. Avanza a Paso 2 (información de la mascota)
   ↓
4. Ve el Asistente IA con zona de subida
   ↓
5. [OPCIÓN A] Ignora IA, completa formulario manualmente
   ↓
   [OPCIÓN B] Sube imagen al Asistente IA
   ↓
6. Hace clic en "Extraer datos con IA"
   ↓
7. Ve loader mientras procesa (2-5 segundos)
   ↓
8. Ve panel con datos extraídos y % de confianza
   ↓
9. Los campos del formulario se rellenan automáticamente
   ↓
10. Revisa y edita datos si es necesario
   ↓
11. Continúa con Paso 3, 4, 5 normalmente
   ↓
12. Publica el caso
```

## 🎨 UX y Diseño

### Principios
- **No obligatorio**: Usuario puede ignorar la IA
- **Transparente**: Muestra confianza y datos extraídos
- **Editable**: Usuario siempre puede modificar
- **Feedback claro**: Loaders, errores, confirmaciones

### Estados Visuales

1. **Inicial**: Zona de drop con ícono de upload
2. **Con imagen**: Vista previa + botón "Extraer"
3. **Procesando**: Loader con texto "Analizando imagen..."
4. **Éxito**: Panel verde con datos + badge de confianza
5. **Error**: Panel rojo con mensaje de error

### Colores y Estilos
- Tema principal: **Purple** (IA/Tecnología)
- Confirmación: **Turquoise** (Éxito)
- Error: **Lost Red** (Errores)
- Loader: **PawLoader** animado

## 🧪 Testing

### Testing Manual

1. **Caso feliz**:
   - Subir imagen válida de perro
   - Verificar extracción de datos
   - Confirmar que formulario se rellena

2. **Validaciones**:
   - Imagen muy grande (>8 MB) → error
   - Formato no permitido (.gif, .bmp) → error
   - Sin conexión → error de red

3. **Edge cases**:
   - Imagen de baja calidad → baja confianza
   - Imagen sin animal → error o confianza 0
   - Múltiples animales → extrae el más prominente

### Testing Automatizado (Futuro)

```typescript
describe('ImageDataExtractor', () => {
  it('should validate image type', () => { ... });
  it('should validate image size', () => { ... });
  it('should convert image to base64', () => { ... });
  it('should call onDataExtracted with results', () => { ... });
  it('should show error on API failure', () => { ... });
});

describe('/api/ai/extract-from-image', () => {
  it('should return 405 for non-POST', () => { ... });
  it('should return 400 for invalid image', () => { ... });
  it('should return 429 on rate limit', () => { ... });
  it('should return extracted data', () => { ... });
});
```

## 🚀 Integración con IA Real

### Configuración Actual (Mock)

El sistema actualmente usa un **MockProvider** que:
- Genera datos aleatorios simulados
- Delay de 2 segundos para simular procesamiento
- Útil para desarrollo y testing sin costos de API

### Migración a Proveedor Real

#### Opción 1: OpenAI GPT-4 Vision (Recomendado)

**Ventajas**:
- Muy preciso
- API estable y bien documentada
- Soporte para JSON estructurado

**Costo aproximado**:
- ~$0.01 por imagen (modelo gpt-4o)
- ~$0.03 por imagen (modelo gpt-4-vision-preview)

**Implementación**:
```typescript
async function analyzeImageWithAI(imageBase64: string): Promise<ExtractedData> {
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
            text: EXTRACTION_PROMPT,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      }],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

#### Opción 2: Anthropic Claude 3.5 Sonnet

**Ventajas**:
- Muy bueno con instrucciones complejas
- Contexto grande
- Precio competitivo

**Costo aproximado**:
- ~$0.003 por imagen

**Implementación**: Ver `docs/GUIA_IA_USUARIO.md`

#### Opción 3: Cloudflare Workers AI

**Ventajas**:
- Sin costo adicional (incluido en Workers)
- Baja latencia (edge computing)
- Sin límites de rate por IP

**Limitaciones**:
- Modelos menos potentes
- Menos control sobre el prompt

**Implementación**:
```typescript
async function analyzeImageWithAI(imageBase64: string): Promise<ExtractedData> {
  const response = await fetch(
    'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/llava-hf/llava-1.5-7b-hf',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
        prompt: EXTRACTION_PROMPT,
      }),
    }
  );

  const data = await response.json();
  // Parse y normalize la respuesta
  return parseCloudflareResponse(data);
}
```

### Prompt Optimizado

```
Analiza esta imagen de un animal doméstico y extrae la siguiente información.
Responde SOLO con un objeto JSON válido con esta estructura exacta:

{
  "species": "DOG" | "CAT" | "BIRD" | "RABBIT" | "OTHER",
  "breed": "nombre de la raza o 'Mestizo' si no es identificable",
  "sex": "MALE" | "FEMALE" | null si no es visible,
  "size": "SMALL" | "MEDIUM" | "LARGE" basado en el tamaño aparente,
  "ageApprox": "PUPPY" | "YOUNG" | "ADULT" | "SENIOR" basado en apariencia,
  "color": "descripción breve del color principal (ej. 'Marrón', 'Negro y blanco')",
  "characteristics": "lista de características físicas distintivas visibles (ej. 'orejas caídas, pelaje largo, mancha blanca en pecho')",
  "collar": true si se ve un collar, false si no,
  "plate": true si se ve una placa de identificación, false si no,
  "confidence": número entre 0 y 1 indicando tu nivel de confianza en la identificación
}

Reglas:
- Si no puedes identificar un campo con confianza, omítelo del JSON (no uses null)
- Sé específico pero conciso en las características
- Usa español para descripciones de texto
- Usa los valores exactos especificados para campos enum
- La confianza debe reflejar qué tan clara y visible es la información en la imagen
```

## 📊 Métricas y Monitoreo

### Métricas a Trackear

1. **Uso**:
   - Cuántos usuarios usan el Asistente IA
   - Porcentaje de formularios con IA vs manual
   - Tiempo ahorrado promedio

2. **Precisión**:
   - Confianza promedio de extracciones
   - Tasa de edición de datos post-extracción
   - Campos más frecuentemente corregidos

3. **Performance**:
   - Tiempo de respuesta del endpoint
   - Tasa de error
   - Rate limit hits

4. **Costos**:
   - Requests a proveedor de IA
   - Costo promedio por extracción
   - Costo mensual total

### Implementación Futura

```typescript
// Tracking de uso
await supabase.from('ai_extraction_logs').insert({
  user_id: user?.id,
  confidence: data.confidence,
  fields_extracted: Object.keys(data).length,
  provider: 'OPENAI',
  cost_cents: 1,
  processing_time_ms: 2340,
});
```

## 🔐 Seguridad y Privacidad

### Consideraciones

1. **Privacidad de Imágenes**:
   - ✅ Imagen NO se guarda en servidor
   - ✅ Imagen NO se guarda en BD
   - ✅ Solo se envía a proveedor de IA temporalmente
   - ✅ Provider de IA no entrena con las imágenes (según políticas de API)

2. **Rate Limiting**:
   - 5 requests/minuto por IP
   - Previene abuso del endpoint
   - Reduce costos de API de IA

3. **Validación**:
   - Tamaño máximo de imagen
   - Tipos de archivo permitidos
   - Validación de base64

4. **GDPR Compliance**:
   - Usuario da consentimiento implícito al usar el Asistente
   - Datos procesados no se almacenan
   - Proveedor de IA cumple GDPR (OpenAI, Anthropic sí)

## 🐛 Troubleshooting

### Problema: "Error al procesar la imagen"

**Causas**:
- Imagen muy grande
- Formato no soportado
- Red caída
- API key inválida (producción)

**Solución**:
- Verificar tamaño y formato
- Revisar logs de servidor
- Verificar variables de entorno

### Problema: Datos extraídos incorrectos

**Causas**:
- Imagen de baja calidad
- Mock provider en desarrollo
- Prompt no optimizado

**Solución**:
- Mejorar calidad de imagen
- Usar proveedor real
- Ajustar prompt del modelo

### Problema: Rate limit excedido

**Causas**:
- Usuario hace muchos intentos
- Ataque de abuso

**Solución**:
- Aumentar límite si es legítimo
- Bloquear IP si es abuso
- Implementar CAPTCHA

## 🎯 Próximos Pasos

1. **Corto plazo**:
   - [ ] Integrar proveedor real (OpenAI o Claude)
   - [ ] Agregar telemetría y logging
   - [ ] A/B testing del feature

2. **Mediano plazo**:
   - [ ] Extracción en otros idiomas
   - [ ] Soporte para múltiples animales en una imagen
   - [ ] Cache de resultados para imágenes similares

3. **Largo plazo**:
   - [ ] Modelo propio fine-tuned
   - [ ] Extracción de texto (OCR) de carteles en la imagen
   - [ ] Sugerencia de título automático

## 📚 Referencias

- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Anthropic Claude Vision](https://docs.anthropic.com/claude/docs/vision)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [MDN FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)

---

**Implementado por**: Sistema Patitas  
**Fecha**: 2026-10-07  
**Versión**: 1.0.0
