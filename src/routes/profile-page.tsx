import { useParams } from 'react-router-dom';

export function ProfilePage() {
  const { username } = useParams();

  return (
    <section className="space-y-4 py-8">
      <h1 className="font-display text-4xl font-semibold text-(--color-text)">Perfil público</h1>
      <p className="max-w-2xl text-(--color-muted)">
        Vista pública para {username ?? 'usuario'} con publicaciones, casos resueltos y datos no sensibles.
      </p>
    </section>
  );
}