import { supabase } from './client';

type CreateReportInput = {
  publicationId: string;
  reporterId?: string | null;
  reason: 'FALSE_INFO' | 'SPAM' | 'SCAM' | 'DUPLICATE' | 'REUNITED' | 'INAPPROPRIATE' | 'OTHER';
  description?: string;
};

export async function createReport(input: CreateReportInput) {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      publication_id: input.publicationId,
      reporter_id: input.reporterId ?? null,
      reason: input.reason,
      description: input.description || null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}