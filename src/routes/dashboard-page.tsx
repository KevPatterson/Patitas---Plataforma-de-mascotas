import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth-context';
import { getMyPublications, deleteMyPublication, resolveMyPublication, type MyPublication } from '../lib/supabase/my-publications';
import { PublicationCard } from '../components/publications/publication-card';
import { Button } from '../components/ui/button';
import { Trash2, CheckCircle, Eye, Loader2 } from 'lucide-react';

type Tab = 'resumen' | 'publicaciones' | 'perfil';

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [publications, setPublications] = useState<MyPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ active: 0, resolved: 0, total: 0 });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMyPublications(user.id);
      setPublications(data);
      setStats({
        active: data.filter((p) => p.status === 'ACTIVE').length,
        resolved: data.filter((p) => p.status === 'RESOLVED').length,
        total: data.length,
      });
    } catch (error) {
      console.error('Error loading publications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [authLoading, user, navigate]);
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab, loadData]);

  const handleResolve = async (id: string) => {
    if (!user) return;
    setActionLoading(id);
    try {
      await resolveMyPublication(user.id, id);
      setPublications((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'RESOLVED' as const } : p))
      );
      setStats((s) => ({ ...s, active: s.active - 1, resolved: s.resolved + 1 }));
    } catch (error) {
      console.error('Error resolving:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('¿Eliminar esta publicación? No se puede deshacer.')) return;
    setActionLoading(id);
    try {
      await deleteMyPublication(user.id, id);
      const deletedPub = publications.find((p) => p.id === id);
      setPublications((prev) => prev.filter((p) => p.id !== id));
      setStats((s) => ({
        ...s,
        total: s.total - 1,
        active: s.active - (deletedPub?.status === 'ACTIVE' ? 1 : 0),
      }));
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <section className="soft-panel rounded-4xl p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-(--color-primary)" />
        <p className="mt-2 text-(--color-muted)">Cargando tu panel...</p>
      </section>
    );
  }

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <Eye className="h-5 w-5" /> },
    { id: 'publicaciones', label: 'Mis publicaciones', icon: <Eye className="h-5 w-5" /> },
    { id: 'perfil', label: 'Perfil', icon: <Eye className="h-5 w-5" /> },
  ];

  return (
    <section className="space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-(--color-text)">Panel de control</h1>
          <p className="text-(--color-muted)">Gestiona tus publicaciones y tu perfil</p>
        </div>
        <Link to="/publicar">
          <Button className="gap-2"><span>+</span> Publicar caso</Button>
        </Link>
      </div>

      <nav className="flex gap-2 border-b-2 border-[#CFEFE6] pb-2" aria-label="Pestañas del panel">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition',
              activeTab === tab.id
                ? 'bg-[#0F3D33] text-white'
                : 'text-[#0B3B3C]/70 hover:bg-[#0B3B3C]/5 hover:text-[#0B3B3C] dark:text-[#F5FBF9]/70 dark:hover:bg-white/10',
            ].join(' ')}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'resumen' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="soft-panel rounded-3xl p-6">
            <p className="text-sm font-medium text-(--color-muted)">Publicaciones activas</p>
            <p className="font-display text-4xl font-bold text-(--color-text)">{stats.active}</p>
          </div>
          <div className="soft-panel rounded-3xl p-6">
            <p className="text-sm font-medium text-(--color-muted)">Casos resueltos</p>
            <p className="font-display text-4xl font-bold text-(--color-success)">{stats.resolved}</p>
          </div>
          <div className="soft-panel rounded-3xl p-6">
            <p className="text-sm font-medium text-(--color-muted)">Total publicaciones</p>
            <p className="font-display text-4xl font-bold text-(--color-text)">{stats.total}</p>
          </div>
        </div>
      )}

      {activeTab === 'publicaciones' && (
        <div className="space-y-4">
          {publications.length === 0 ? (
            <div className="soft-panel rounded-4xl p-8 text-center">
              <p className="text-(--color-muted)">No tienes publicaciones aún.</p>
              <Link to="/publicar" className="mt-4 inline-block">
                <Button>Crear mi primera publicación</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {publications.map((pub) => (
                <div key={pub.id} className="relative">
                  <PublicationCard
                    publication={{
                      id: pub.id,
                      slug: pub.slug,
                      title: pub.title,
                      description: pub.description,
                      type: pub.type,
                      status: pub.status,
                      species: pub.species,
                      breed: pub.breed,
                      color: pub.color,
                      sex: pub.sex,
                      size: pub.size,
                      publishedAt: pub.publishedAt,
                      province: pub.province,
                      municipality: pub.municipality,
                      zone: pub.zone,
                      approximateLat: pub.approximateLat,
                      approximateLng: pub.approximateLng,
                      coverImageUrl: pub.coverImageUrl,
                    }}
                  />
                  <div className="absolute top-3 right-3 flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => handleResolve(pub.id)}
                      disabled={actionLoading === pub.id || pub.status === 'RESOLVED'}
                      aria-label="Marcar como resuelto"
                      className="p-2 min-h-[36px] px-3"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(pub.id)}
                      disabled={actionLoading === pub.id}
                      className="p-2 min-h-[36px] px-3 text-(--color-danger) hover:bg-[rgba(181,76,69,0.1)]"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'perfil' && (
        <div className="soft-panel rounded-4xl p-6 max-w-md">
          <h2 className="font-display text-2xl font-semibold text-(--color-text) mb-4">Tu perfil</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-(--color-muted)">Usuario</p>
              <p className="font-semibold text-(--color-text)">{user.user_metadata?.username ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-(--color-muted)">Nombre completo</p>
              <p className="font-semibold text-(--color-text)">{user.user_metadata?.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-(--color-muted)">Correo</p>
              <p className="font-semibold text-(--color-text)">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-(--color-muted)">Miembro desde</p>
              <p className="font-semibold text-(--color-text)">{new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;