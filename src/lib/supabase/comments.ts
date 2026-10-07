import { supabase } from './client';

export type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_profile_id: string;
  author: {
    username: string;
    avatar_url: string | null;
  } | null;
};

export async function getComments(publicationId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      body,
      created_at,
      author_profile_id,
      author:profiles!author_profile_id(username, avatar_url)
    `)
    .eq('publication_id', publicationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as Array<{
    id: string;
    body: string;
    created_at: string;
    author_profile_id: string;
    author: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null;
  }>).map((item) => ({
    id: item.id,
    body: item.body,
    created_at: item.created_at,
    author_profile_id: item.author_profile_id,
    author: Array.isArray(item.author) ? item.author[0] || null : item.author,
  }));
}

export async function createComment(publicationId: string, authorProfileId: string, body: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      publication_id: publicationId,
      author_profile_id: authorProfileId,
      body: body.trim(),
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteComment(commentId: string, authorProfileId: string) {
  const { error } = await supabase
    .from('comments')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('author_profile_id', authorProfileId);

  if (error) {
    throw error;
  }
}

export async function updateComment(commentId: string, authorProfileId: string, body: string) {
  const { error } = await supabase
    .from('comments')
    .update({
      body: body.trim(),
    })
    .eq('id', commentId)
    .eq('author_profile_id', authorProfileId);

  if (error) {
    throw error;
  }
}
