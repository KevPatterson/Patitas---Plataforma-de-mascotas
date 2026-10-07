import { supabase } from '../supabase/client';
import type { AIJob, AIJobStatus, AIJobType, AIProvider } from './types';

export async function createAIJob(input: {
  publicationId: string;
  jobType: AIJobType;
  provider?: AIProvider;
  model?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await supabase
    .from('ai_processing_jobs')
    .insert({
      publication_id: input.publicationId,
      job_type: input.jobType,
      status: 'PENDING' as AIJobStatus,
      provider: input.provider || null,
      model: input.model || null,
      priority: input.priority ?? 5,
      retry_count: 0,
      max_retries: 3,
      metadata: input.metadata || {},
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function getAIJob(jobId: string): Promise<AIJob | null> {
  const { data, error } = await supabase
    .from('ai_processing_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    return null;
  }

  return data as AIJob;
}

export async function updateAIJobStatus(
  jobId: string,
  status: AIJobStatus,
  updates?: {
    error_message?: string;
    processing_time_ms?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (status === 'PROCESSING' && !updates) {
    updateData.started_at = new Date().toISOString();
  }

  if (status === 'COMPLETED' || status === 'FAILED') {
    updateData.completed_at = new Date().toISOString();
  }

  if (updates?.error_message) {
    updateData.error_message = updates.error_message;
  }

  if (updates?.processing_time_ms) {
    updateData.processing_time_ms = updates.processing_time_ms;
  }

  if (updates?.metadata) {
    updateData.metadata = updates.metadata;
  }

  const { error } = await supabase
    .from('ai_processing_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    throw error;
  }
}

export async function getPendingJobs(limit = 10): Promise<AIJob[]> {
  const { data, error } = await supabase
    .from('ai_processing_jobs')
    .select('*')
    .eq('status', 'PENDING')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data as AIJob[]) || [];
}

export async function getJobsForPublication(publicationId: string): Promise<AIJob[]> {
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

export async function retryFailedJob(jobId: string): Promise<void> {
  const job = await getAIJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.retry_count >= job.max_retries) {
    throw new Error('Max retries exceeded');
  }

  const { error } = await supabase
    .from('ai_processing_jobs')
    .update({
      status: 'PENDING' as AIJobStatus,
      retry_count: job.retry_count + 1,
      error_message: null,
      started_at: null,
      completed_at: null,
    })
    .eq('id', jobId);

  if (error) {
    throw error;
  }
}

export async function cancelJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_processing_jobs')
    .update({
      status: 'CANCELLED' as AIJobStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    throw error;
  }
}

// Crear múltiples jobs para una publicación
export async function createPublicationProcessingJobs(publicationId: string): Promise<string[]> {
  const jobTypes: AIJobType[] = ['vision', 'ocr', 'embedding_text', 'moderation'];
  
  const jobIds: string[] = [];

  for (const jobType of jobTypes) {
    try {
      const jobId = await createAIJob({
        publicationId,
        jobType,
        priority: jobType === 'moderation' ? 1 : 5, // Moderación tiene prioridad alta
      });
      jobIds.push(jobId);
    } catch (error) {
      console.error(`Error creating ${jobType} job:`, error);
    }
  }

  return jobIds;
}

// Verificar si una publicación tiene jobs pendientes
export async function hasActiveProcesamiento(publicationId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('ai_processing_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('publication_id', publicationId)
    .in('status', ['PENDING', 'PROCESSING']);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}
