import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { TextareaField } from '../ui/textarea-field';
import { createComment, deleteComment, getComments, type Comment } from '../../lib/supabase/comments';

type CommentsSectionProps = {
  publicationId: string;
  currentUserId: string | null;
};

function formatRelativeTime(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return new Intl.DateTimeFormat('es-CU', { dateStyle: 'short' }).format(past);
}

export function CommentsSection({ publicationId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      const data = await getComments(publicationId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicationId]);

  const handleSubmit = async () => {
    if (!currentUserId) {
      setErrorMessage('Necesitas entrar para comentar.');
      return;
    }

    if (!body.trim() || body.trim().length < 3) {
      setErrorMessage('El comentario debe tener al menos 3 caracteres.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await createComment(publicationId, currentUserId, body);
      setBody('');
      await loadComments();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos publicar tu comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      await deleteComment(commentId, currentUserId);
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="font-display text-2xl font-semibold text-(--color-text)">Comentarios</h3>
        <span className="rounded-full bg-black/5 px-3 py-1 text-sm font-bold text-(--color-text)">
          {comments.length}
        </span>
      </div>

      {currentUserId ? (
        <div className="space-y-3 rounded-2xl border border-black/5 bg-white/80 p-5">
          <TextareaField
            label="Agregar comentario"
            placeholder="Comparte información útil sobre este caso..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          {errorMessage ? (
            <p className="rounded-xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">
              {errorMessage}
            </p>
          ) : null}

          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : '💬 Publicar comentario'}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-black/5 p-5 text-center text-sm text-(--color-muted)">
          Necesitas entrar para comentar
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-black/5 bg-white/80 p-5 text-center text-sm text-(--color-muted)">
          Cargando comentarios...
        </div>
      ) : null}

      {!loading && comments.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white/80 p-5 text-center text-sm text-(--color-muted)">
          Aún no hay comentarios. Sé el primero en compartir información útil.
        </div>
      ) : null}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-[0_6px_16px_rgba(15,61,51,0.04)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary-light) text-lg font-bold text-(--color-primary)">
                  {comment.author?.username?.[0]?.toUpperCase() ?? '?'}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-(--color-text)">
                      {comment.author?.username ?? 'Usuario'}
                    </p>
                    <span className="text-xs text-(--color-muted)">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>
                  <p className="leading-7 text-(--color-text)">{comment.body}</p>
                </div>
              </div>

              {comment.author && currentUserId === comment.author.username ? (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs font-semibold text-(--color-muted) hover:text-(--color-danger)"
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
