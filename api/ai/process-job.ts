import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase-admin';

/**
 * Endpoint interno para procesar un job de IA específico
 * POST /api/ai/process-job
 * 
 * Body: {
 *   jobId: string;
 * }
 * 
 * Este endpoint es llamado internamente para procesar jobs pendientes.
 * En producción real, esto debería ser un worker asíncrono (cron, queue, etc.)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar autorización (internal secret)
  const authHeader = req.headers.authorization;
  const internalSecret = process.env.INTERNAL_API_SECRET;

  if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let payload: { jobId?: string } = {};

  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!payload.jobId) {
    return res.status(400).json({ error: 'Missing jobId' });
  }

  // Obtener el job
  const { data: job, error: jobError } = await supabaseAdmin
    .from('ai_processing_jobs')
    .select('*')
    .eq('id', payload.jobId)
    .single();

  if (jobError || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Verificar que el job esté en estado procesable
  if (job.status !== 'PENDING' && job.status !== 'FAILED') {
    return res.status(400).json({ error: `Job is in ${job.status} state, cannot process` });
  }

  // Verificar max retries
  if (job.retry_count >= job.max_retries) {
    await supabaseAdmin
      .from('ai_processing_jobs')
      .update({
        status: 'FAILED',
        error_message: 'Max retries exceeded',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payload.jobId);

    return res.status(400).json({ error: 'Max retries exceeded' });
  }

  // Actualizar estado a PROCESSING
  const startTime = Date.now();

  await supabaseAdmin
    .from('ai_processing_jobs')
    .update({
      status: 'PROCESSING',
      started_at: new Date().toISOString(),
      retry_count: job.retry_count + 1,
    })
    .eq('id', payload.jobId);

  try {
    // Procesar según el tipo de job
    await processJobByType(job);

    // Actualizar estado a COMPLETED
    const processingTime = Date.now() - startTime;

    await supabaseAdmin
      .from('ai_processing_jobs')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        error_message: null,
      })
      .eq('id', payload.jobId);

    return res.status(200).json({
      ok: true,
      message: 'Job processed successfully',
      processingTime,
    });
  } catch (error) {
    console.error(`Error processing job ${payload.jobId}:`, error);

    // Actualizar estado a FAILED
    await supabaseAdmin
      .from('ai_processing_jobs')
      .update({
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', payload.jobId);

    return res.status(500).json({
      ok: false,
      error: 'Job processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Procesar job según su tipo
 */
async function processJobByType(job: {
  id: string;
  publication_id: string;
  job_type: string;
  provider: string | null;
  model: string | null;
}): Promise<void> {
  switch (job.job_type) {
    case 'embedding_text':
      await processTextEmbedding(job);
      break;

    case 'embedding_image':
      await processImageEmbedding(job);
      break;

    case 'ocr':
      await processOCR(job);
      break;

    case 'vision':
      await processVision(job);
      break;

    case 'moderation':
      await processModeration(job);
      break;

    case 'extraction':
      await processExtraction(job);
      break;

    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}

/**
 * Procesar embedding de texto
 */
async function processTextEmbedding(job: {
  id: string;
  publication_id: string;
}): Promise<void> {
  // Obtener la publicación
  const { data: publication } = await supabaseAdmin
    .from('publications')
    .select('title, description, species, breed, color, characteristics')
    .eq('id', job.publication_id)
    .single();

  if (!publication) {
    throw new Error('Publication not found');
  }

  // Combinar texto relevante
  const textParts: string[] = [
    publication.title || '',
    publication.description || '',
    publication.species || '',
    publication.breed || '',
    publication.color || '',
    publication.characteristics || '',
  ].filter(Boolean);

  const combinedText = textParts.join(' ');

  // Mock: Generar embedding (en producción, usar proveedor real)
  const embedding = generateMockEmbedding(combinedText, 1536);

  // Guardar embedding
  await supabaseAdmin.from('ai_text_embeddings').upsert({
    publication_id: job.publication_id,
    job_id: job.id,
    provider: 'CUSTOM',
    model: 'mock-embedding-v1',
    model_version: '1.0',
    embedding_dimension: 1536,
    embedding_data: embedding,
    text_source: 'combined',
  });
}

/**
 * Procesar embedding de imagen
 */
async function processImageEmbedding(job: {
  id: string;
  publication_id: string;
}): Promise<void> {
  // Obtener imágenes de la publicación
  const { data: images } = await supabaseAdmin
    .from('publication_images')
    .select('id, storage_path')
    .eq('publication_id', job.publication_id)
    .limit(5);

  if (!images || images.length === 0) {
    throw new Error('No images found for publication');
  }

  // Procesar cada imagen
  for (const image of images) {
    // Mock: Generar embedding (en producción, usar proveedor real)
    const embedding = generateMockEmbedding(image.storage_path, 512);

    // Calcular hash de imagen (en producción, usar hash real)
    const imageHash = Buffer.from(image.storage_path).toString('base64').slice(0, 32);

    await supabaseAdmin.from('ai_image_embeddings').upsert({
      publication_image_id: image.id,
      job_id: job.id,
      provider: 'CUSTOM',
      model: 'mock-image-embedding-v1',
      model_version: '1.0',
      embedding_dimension: 512,
      embedding_data: embedding,
      image_hash: imageHash,
    });
  }
}

/**
 * Procesar OCR
 */
async function processOCR(job: {
  id: string;
  publication_id: string;
}): Promise<void> {
  // Obtener imágenes de la publicación
  const { data: images } = await supabaseAdmin
    .from('publication_images')
    .select('id, storage_path')
    .eq('publication_id', job.publication_id)
    .limit(5);

  if (!images || images.length === 0) {
    return; // No hay imágenes, no es un error
  }

  // Mock: Extraer texto de imágenes
  for (const image of images) {
    // Simulación: 40% de las imágenes tienen texto
    const seed = image.storage_path.length;
    const hasText = seed % 10 < 4;

    if (!hasText) continue;

    const sampleTexts = [
      'PERDIDO - Llamar al 5555-1234',
      'RECOMPENSA',
      'Contacto: 5243-5678',
      'Se perdió en La Habana',
      'URGENTE',
    ];

    const text = sampleTexts[seed % sampleTexts.length];

    await supabaseAdmin.from('ai_ocr_results').insert({
      publication_image_id: image.id,
      job_id: job.id,
      provider: 'CUSTOM',
      model: 'mock-ocr-v1',
      extracted_text: text,
      confidence: 0.85,
      language: 'es',
      metadata: {},
    });

    // Extraer atributos del texto
    const phoneMatch = text.match(/(\d{4})-(\d{4})/);
    if (phoneMatch) {
      await supabaseAdmin.from('ai_extracted_attributes').insert({
        publication_id: job.publication_id,
        attribute_key: 'phone',
        attribute_value: phoneMatch[0],
        confidence: 0.9,
        source: 'ocr',
        metadata: {},
      });
    }
  }
}

/**
 * Procesar Vision (análisis de imágenes)
 */
async function processVision(job: {
  id: string;
  publication_id: string;
}): Promise<void> {
  // Obtener imágenes de la publicación
  const { data: images } = await supabaseAdmin
    .from('publication_images')
    .select('id, storage_path')
    .eq('publication_id', job.publication_id)
    .limit(5);

  if (!images || images.length === 0) {
    return;
  }

  // Procesar primera imagen (cover)
  const image = images[0];
  const seed = image.storage_path.length;

  // Crear resultado de vision
  const { data: visionResult } = await supabaseAdmin
    .from('ai_vision_results')
    .insert({
      publication_image_id: image.id,
      job_id: job.id,
      provider: 'CUSTOM',
      model: 'mock-vision-v1',
      model_version: '1.0',
      metadata: {},
    })
    .select('id')
    .single();

  if (!visionResult) return;

  // Extraer atributos simulados
  const species = seed % 2 === 0 ? 'dog' : 'cat';
  const colors = ['negro', 'blanco', 'marrón', 'gris', 'naranja'];
  const sizes = ['SMALL', 'MEDIUM', 'LARGE'];

  const attributes = [
    {
      vision_result_id: visionResult.id,
      publication_id: job.publication_id,
      attribute_key: 'species',
      attribute_value: species,
      confidence: 0.9,
      source: 'vision' as const,
      metadata: {},
    },
    {
      vision_result_id: visionResult.id,
      publication_id: job.publication_id,
      attribute_key: 'color',
      attribute_value: colors[seed % colors.length],
      confidence: 0.85,
      source: 'vision' as const,
      metadata: {},
    },
    {
      vision_result_id: visionResult.id,
      publication_id: job.publication_id,
      attribute_key: 'size',
      attribute_value: sizes[seed % sizes.length],
      confidence: 0.75,
      source: 'vision' as const,
      metadata: {},
    },
  ];

  await supabaseAdmin.from('ai_extracted_attributes').insert(attributes);
}

/**
 * Procesar moderación
 */
async function processModeration(job: {
  id: string;
  publication_id: string;
}): Promise<void> {
  // Obtener la publicación
  const { data: publication } = await supabaseAdmin
    .from('publications')
    .select('title, description')
    .eq('id', job.publication_id)
    .single();

  if (!publication) {
    throw new Error('Publication not found');
  }

  const text = `${publication.title} ${publication.description}`.toLowerCase();

  // Mock: Moderación básica
  const spamKeywords = ['viagra', 'casino', 'click aquí', 'gana dinero'];
  const hasSpam = spamKeywords.some((kw) => text.includes(kw));

  const classification = hasSpam ? 'SPAM' : 'SAFE';
  const confidence = hasSpam ? 0.95 : 0.98;

  await supabaseAdmin.from('ai_moderation_results').insert({
    publication_id: job.publication_id,
    job_id: job.id,
    provider: 'CUSTOM',
    model: 'mock-moderation-v1',
    classification,
    confidence,
    reason: hasSpam ? 'Contiene palabras clave de spam' : null,
    requires_human_review: hasSpam,
    metadata: {},
  });
}

/**
 * Procesar extracción estructurada
 */
async function processExtraction(job: {
  id: string;
  publication_id: string;
}): Promise<void> {
  // Obtener la publicación y OCR results
  const { data: publication } = await supabaseAdmin
    .from('publications')
    .select('title, description')
    .eq('id', job.publication_id)
    .single();

  if (!publication) {
    throw new Error('Publication not found');
  }

  const text = `${publication.title} ${publication.description}`.toLowerCase();

  // Extraer información estructurada
  const petNames = ['toby', 'max', 'luna', 'coco', 'rocky', 'bella'];
  for (const name of petNames) {
    if (text.includes(name)) {
      await supabaseAdmin.from('ai_extracted_attributes').insert({
        publication_id: job.publication_id,
        attribute_key: 'pet_name',
        attribute_value: name.charAt(0).toUpperCase() + name.slice(1),
        confidence: 0.8,
        source: 'hybrid',
        metadata: {},
      });
      break;
    }
  }
}

/**
 * Generar embedding mock determinista
 */
function generateMockEmbedding(text: string, dimension: number): number[] {
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array.from({ length: dimension }, (_, i) => {
    const x = Math.sin(seed + i * 0.1) * 10000;
    return (x - Math.floor(x)) * 2 - 1; // Normalizar a [-1, 1]
  });
}
