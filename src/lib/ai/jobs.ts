import { supabase } from '../supabase/client';
import type { AIJob, AIJobType, AIJobStatus } from './types';

/**
 * Crear un job de procesamiento de IA
 */
export async function createAIJob(input: {
  publicationId: string;
  jobType: AIJobType;
  priority?: number;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await supabase
    .from('ai_processing_jobs')
    .insert({
      publication_id: input.publicationId,
      job_type: input.jobType,
      status: 'PENDING' as AIJobStatus,
      priority: input.priority ?? 5,
      retry_count: 0,
      max_retries: 3,
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

/**
 * Obtener jobs de una publicación
 */
export async function getPublicationJobs(publicationId: string): Promise<AIJob[]> {
  const { data, error } = await supabase
    .from('ai_processing_jobs')
    .select('*')
    .eq('publication_id', publicationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as AIJob[]) || [];
}

/**
 * Actualizar estado de un job
 */
export async function updateJobStatus(
  jobId: string,
  status: AIJobStatus,
  errorMessage?: string
): Promise<void> {
  const updates: {
    status: AIJobStatus;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
  } = {
    status,
  };

  if (status === 'PROCESSING') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'COMPLETED' || status === 'FAILED') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('ai_processing_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    throw error;
  }
}

/**
 * Verificar si una publicación tiene jobs pendientes
 */
export async function hassPendingJobs(publicationId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('ai_processing_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('publication_id', publicationId)
    .in('status', ['PENDING', 'PROCESSING']);

  if (error) {
    console.error('Error checking pending jobs:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Obtener resumen del estado de procesamiento de una publicación
 */
export async function getProcessingSummary(publicationId: string): Promise<{
  ocr: AIJobStatus | null;
  vision: AIJobStatus | null;
  embedding_text: AIJobStatus | null;
  embedding_image: AIJobStatus | null;
  moderation: AIJobStatus | null;
  extraction: AIJobStatus | null;
}> {
  const { data, error } = await supabase
    .from('ai_processing_jobs')
    .select('job_type, status')
    .eq('publication_id', publicationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching processing summary:', error);
    return {
      ocr: null,
      vision: null,
      embedding_text: null,
      embedding_image: null,
      moderation: null,
      extraction: null,
    };
  }

  const summary: Record<AIJobType, AIJobStatus | null> = {
    ocr: null,
    vision: null,
    embedding_text: null,
    embedding_image: null,
    moderation: null,
    extraction: null,
  };

  // Tomar el estado más reciente de cada tipo
  data?.forEach((job) => {
    const jobType = job.job_type as AIJobType;
    if (summary[jobType] === null) {
      summary[jobType] = job.status as AIJobStatus;
    }
  });

  return summary;
}
