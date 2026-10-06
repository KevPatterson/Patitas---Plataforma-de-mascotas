import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error_description') ?? params.get('error');
      if (errorParam) {
        setError(errorParam);
        return;
      }
      try {
        if (code) {
          const { error: exError } = await supabase.auth.exchangeCodeForSession(code);
          if (exError) throw exError;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error('No se pudo completar el inicio de sesión.');
        }
        navigate('/', { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al completar autenticación.');
      }
    };
    run();
  }, [navigate]);

  return (
    <section className="grid min-h-[calc(100vh-8rem)] place-items-center py-10">
      <div className="soft-panel rounded-4xl p-8 text-center max-w-md w-full">
        {error ? <p className="text-sm font-semibold text-(--color-danger)">{error}</p> : <p className="text-sm text-(--color-muted)">Completando inicio de sesión...</p>}
      </div>
    </section>
  );
}

export default CallbackPage;
