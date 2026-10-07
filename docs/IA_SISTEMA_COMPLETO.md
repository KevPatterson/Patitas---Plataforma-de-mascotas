# Sistema de IA Completo - Patitas

## Descripción General

El sistema de IA de Patitas está diseñado con una arquitectura flexible que permite cambiar de proveedor sin modificar el código de la aplicación. Soporta procesamiento asíncrono mediante jobs para operaciones costosas.

## Arquitectura

```
┌─────────────────────────────────────────┐
│         Frontend (React)                 │
│  • Upload imagen                         │
│  • Llamada a /api/ai/extract-from-image │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      API Endpoints (Vercel Functions)    │
│  • extract-from-image.ts                 │
│  • process-publication.ts                │
│  • process-job.ts                        │
│  • detect-duplicates.ts                  │
│  • calculate-matches.ts                  │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      AI Provider Abstraction             │
│  • getAIProvider()                       │
│  • CloudflareProvider                    │
│  • OpenAIProvider (futuro)               │
│  • MockProvider (desarrollo)             │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌─────────────┐  ┌──────────────┐
│ Cloudflare  │  │ OpenAI API   │
│ Workers AI  │  │ (futuro)     │
└─────────────┘  └──────────────┘
```

## Capacidades Implementadas

### 1. OCR (Optical Character Recognition)

Extrae texto visible de imágenes de mascotas perdidas/encontradas.

**Casos de uso:**
- Extraer teléfonos de carteles
- Leer ubicaciones escritas
- Detectar fechas y recompensas
- Identificar nombres de mascotas

**Endpoint:** `POST /api/ai/extract-from-image`

**Ejemplo de respuesta:**
```json
{
  "ok": true,
  "extracted": {
    "phone": "53501234567",
    "location": "La Habana",
    "province": "La Habana",
    "reward": "$500",
    "date": "15/01/2024",
    "ocrText": "PERDIDO\nPerro marrón\nTeléfono: 53501234...",
    "confidence": { "ocr": 0.92 }
  }
}
```

### 2. Computer Vision

Analiza imágenes para extraer características visuales de mascotas.

**Atributos detectados:**
- Especie (perro, gato, etc.)
- Raza (si es identificable)
- Color principal
- Tamaño estimado
- Presencia de collar/placa
- Características distintivas

**Ejemplo de respuesta:**
```json
{
  "ok": true,
  "extracted": {
    "species": "DOG",
    "color": "Marrón",
    "size": "MEDIUM",
    "collar": true,
    "characteristics": "usa collar, aspecto amigable",
    "visionDescription": "A brown dog wearing a collar...",
    "confidence": { "vision": 0.85 }
  }
}
```

### 3. Embeddings de Texto

Genera representaciones vectoriales del contenido textual para búsqueda semántica.

**Dimensiones:**
- Cloudflare: 768 (bge-base-en-v1.5)
- OpenAI: 1536 (text-embedding-3-small)

**Uso:**
- Búsqueda semántica de publicaciones
- Matching por similitud de descripción
- Detección de duplicados textuales

### 4. Embeddings de Imagen

Genera representaciones vectoriales de imágenes para búsqueda visual.

**Dimensiones:**
- Cloudflare: 2048 (resnet-50)
- OpenAI: 512 (clip-vit-base-patch32)

**Uso:**
- Búsqueda visual de mascotas similares
- Matching visual para encontrar la misma mascota
- Detección de imágenes duplicadas

### 5. Moderación Automática

Clasifica contenido para detectar spam, fraude o contenido inapropiado.

**Clasificaciones:**
- `SAFE`: Contenido seguro
- `SPAM`: Spam o publicidad
- `FRAUD`: Posible fraude/estafa
- `OFFENSIVE`: Contenido ofensivo
- `INAPPROPRIATE`: Contenido inapropiado
- `UNRELATED`: No relacionado con mascotas
- `UNCERTAIN`: Requiere revisión humana

### 6. Detección de Duplicados

Identifica publicaciones que podrían ser duplicados combinando múltiples señales.

**Factores de similitud:**
- Título (30%)
- Descripción (25%)
- Ubicación (20%)
- Fecha (15%)
- Imagen (10%)

**Threshold:** 0.7 (configurable)

## Configuración

### Opción 1: Mock Provider (Desarrollo)

Útil para desarrollo local sin necesidad de API keys.

```env
AI_PROVIDER=MOCK
```

**Características:**
- Retorna datos simulados
- Sin costo
- Sin necesidad de configuración adicional
- Delays artificiales para simular latencia

### Opción 2: Cloudflare AI (Recomendado)

Proveedor económico y rápido integrado con Cloudflare Workers.

```env
AI_PROVIDER=CLOUDFLARE
CLOUDFLARE_ACCOUNT_ID=tu-account-id
CLOUDFLARE_API_TOKEN=tu-api-token
```

**Modelos utilizados:**
- OCR/Vision: `@cf/llava-hf/llava-1.5-7b-hf`
- Text Embedding: `@cf/baai/bge-base-en-v1.5`
- Image Embedding: `@cf/microsoft/resnet-50`
- Moderation: `@cf/meta/llama-3-8b-instruct`

**Ventajas:**
- Muy económico (primeros 10,000 requests/día gratis)
- Baja latencia (edge computing)
- Sin cold starts
- Modelos actualizados automáticamente

**Limitaciones:**
- OCR menos preciso que servicios especializados
- Embedding dimensions fijos por modelo

### Opción 3: OpenAI (Futuro)

Para máxima precisión en producción.

```env
AI_PROVIDER=OPENAI
OPENAI_API_KEY=sk-...
```

**Modelos planeados:**
- Vision: `gpt-4-vision-preview`
- Text Embedding: `text-embedding-3-small`
- Moderation: `text-moderation-latest`

## Flujo de Procesamiento

### 1. Extracción Inmediata (Autocompletado)

Cuando el usuario sube una imagen en el formulario:

```typescript
// Frontend
const response = await fetch('/api/ai/extract-from-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: publicImageUrl,
  }),
});

const { extracted } = await response.json();

// Autocompletar formulario
form.setValue('species', extracted.species);
form.setValue('color', extracted.color);
form.setValue('phone', extracted.phone);
// etc.
```

### 2. Procesamiento Asíncrono (Jobs)

Después de crear la publicación, procesar tareas pesadas:

```typescript
// Frontend (opcional - el usuario puede iniciarlo manualmente)
await fetch('/api/ai/process-publication', {
  method: 'POST',
  body: JSON.stringify({
    publicationId: publication.id,
    tasks: ['ocr', 'vision', 'embedding_text', 'embedding_image', 'moderation'],
  }),
});
```

**Estados del job:**
- `PENDING`: En cola
- `PROCESSING`: Ejecutándose
- `COMPLETED`: Completado exitosamente
- `PARTIAL`: Parcialmente completado
- `FAILED`: Falló (con reintentos)

### 3. Procesamiento por Worker/Cron

```typescript
// Worker/Cron (ejecutar cada minuto)
const { data: pendingJobs } = await supabase
  .from('ai_processing_jobs')
  .select('id')
  .eq('status', 'PENDING')
  .order('priority', { ascending: true })
  .limit(10);

for (const job of pendingJobs) {
  await fetch('/api/ai/process-job', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${INTERNAL_API_KEY}`,
    },
    body: JSON.stringify({ jobId: job.id }),
  });
}
```

## Base de Datos

### Tablas de IA

```sql
ai_processing_jobs          -- Cola de procesamiento
ai_ocr_results             -- Resultados de OCR
ai_vision_results          -- Resultados de Computer Vision
ai_extracted_attributes    -- Atributos extraídos
ai_text_embeddings         -- Embeddings de texto
ai_image_embeddings        -- Embeddings de imagen
ai_moderation_results      -- Resultados de moderación
duplicate_detections       -- Detecciones de duplicados
```

### Ejemplo de consulta de embeddings

```sql
-- Buscar publicaciones similares usando embeddings
SELECT 
  pub.id,
  pub.title,
  1 - (emb.embedding <=> target.embedding) AS similarity
FROM publications pub
JOIN ai_text_embeddings emb ON emb.publication_id = pub.id
CROSS JOIN (
  SELECT embedding 
  FROM ai_text_embeddings 
  WHERE publication_id = 'target-id'
) target
WHERE pub.status = 'ACTIVE'
ORDER BY emb.embedding <=> target.embedding
LIMIT 10;
```

## Rate Limiting

Para proteger los recursos de IA:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/api/ai/extract-from-image` | 30 | 1 hora |
| `/api/ai/process-publication` | 20 | 1 hora |
| `/api/ai/detect-duplicates` | 20 | 1 hora |

## Costos Estimados

### Cloudflare AI (por 1000 requests)

- LLaVA (OCR/Vision): $0.01
- BGE (Text Embedding): $0.004
- ResNet (Image Embedding): $0.005
- LLaMA (Moderation): $0.01

**Total estimado:** ~$0.03 por publicación procesada completamente

### OpenAI (por 1000 requests)

- GPT-4 Vision: $0.01 - $0.03
- Text Embedding: $0.0001
- Moderation: Gratis

**Total estimado:** ~$0.01 - $0.03 por publicación

## Monitoreo

Consultas útiles para monitorear el sistema:

```sql
-- Jobs pendientes
SELECT COUNT(*) FROM ai_processing_jobs WHERE status = 'PENDING';

-- Jobs fallidos
SELECT * FROM ai_processing_jobs 
WHERE status = 'FAILED' 
ORDER BY created_at DESC LIMIT 10;

-- Tiempo promedio de procesamiento
SELECT 
  job_type,
  AVG(processing_time_ms) as avg_time,
  COUNT(*) as total
FROM ai_processing_jobs 
WHERE status = 'COMPLETED'
GROUP BY job_type;

-- Publicaciones sin procesar
SELECT COUNT(*) FROM publications p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_processing_jobs j
  WHERE j.publication_id = p.id
  AND j.status = 'COMPLETED'
);
```

## Mejores Prácticas

1. **Usar Mock en desarrollo**: Evita costos innecesarios
2. **Rate limiting**: Protege contra abuso
3. **Procesamiento asíncrono**: No bloquear al usuario
4. **Confidence scores**: Siempre mostrar confianza al usuario
5. **Fallbacks**: El sistema debe funcionar sin IA
6. **Caché**: Evitar reprocesar las mismas imágenes
7. **Batch processing**: Procesar múltiples jobs a la vez
8. **Monitoring**: Revisar logs y métricas regularmente

## Troubleshooting

### Error: "Missing Cloudflare AI credentials"

Asegúrate de configurar:
```env
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

### Jobs se quedan en PENDING

Verifica que el worker/cron esté ejecutándose:
```bash
# Procesar manualmente un job
curl -X POST https://tu-app.vercel.app/api/ai/process-job \
  -H "Authorization: Bearer ${INTERNAL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"jobId": "job-id-aqui"}'
```

### OCR no detecta texto

- Verifica que la imagen tenga texto visible
- Asegúrate de que la imagen sea de buena calidad
- El texto debe ser legible para humanos

### Embeddings no funcionan

Verifica que pgvector esté instalado:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Roadmap

- [ ] OpenAI Provider
- [ ] Batch processing para múltiples publicaciones
- [ ] Dashboard de métricas de IA
- [ ] A/B testing de modelos
- [ ] Fine-tuning de modelos
- [ ] Búsqueda multi-modal (texto + imagen)
- [ ] API pública para terceros
