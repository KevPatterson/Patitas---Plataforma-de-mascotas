import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth-context';
import { getMyPublications, deleteMyPublication, resolveMyPublication, type MyPublication } from '../lib/supabase/my-publications';
import { PublicationCard } from '../components/publications/publication-card';
import { Button } from '../components/ui/button';
import { PawLoader } from '../components/ui/paw-loader';
import { EmptyState } from '../components/ui/empty-state';
import { Trash2, CheckCircle, Eye, PlusCircle, FileText, User as UserIcon, PawPrint, TrendingUp } from 'lucide-react';

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
      <section className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <PawLoader size="lg" />
        <p className="font-display text-lg font-semibold text-navy">Cargando tu panel...</p>
      </section>
    );
  }

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'publicaciones', label: 'Mis publicaciones', icon: <FileText className="h-4 w-4" /> },
    { id: 'perfil', label: 'Perfil', icon: <UserIcon className="h-4 w-4" /> },
  ];

  return (
    <section className="space-y-8 py-8">
      {/* Header del dashboard */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange/10 via-cream to-turquoise/10 border-2 border-navy/10 p-8 shadow-md">
        <div className="blob-decoration absolute top-5 right-5 w-24 h-24 bg-purple/20" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PawPrint className="h-5 w-5 text-orange animate-paw-bounce" />
              <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Tu espacio</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold text-navy">Panel de control</h1>
            <p className="text-navy/60 mt-1">Gestiona tus publicaciones y tu perfil</p>
          </div>
          <Link to="/publicar">
            <Button variant="primary" className="gap-2 shadow-lg">
              <PlusCircle className="h-5 w-5" />
              Publicar caso
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs de navegación */}
      <nav className="flex flex-wrap gap-2 border-b-2 border-navy/10 pb-2" aria-label="Pestañas del panel">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-base ease-smooth',
              activeTab === tab.id
                ? 'bg-navy text-white shadow-md scale-105'
                : 'text-navy/70 hover:bg-navy/5 hover:text-navy hover:scale-102',
            ].join(' ')}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* Contenido según tab activo */}
      {activeTab === 'resumen' && (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="group rounded-2xl border-2 border-turquoise/20 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-base hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-navy/70">Publicaciones activas</p>
              <Eye className="h-5 w-5 text-turquoise/40 group-hover:text-turquoise transition-colors" />
            </div>
            <p className="font-display text-4xl font-extrabold text-turquoise">{stats.active}</p>
          </div>
          
          <div className="group rounded-2xl border-2 border-found/20 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-base hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-navy/70">Casos resueltos</p>
              <CheckCircle className="h-5 w-5 text-found/40 group-hover:text-found transition-colors" />
            </div>
            <p className="font-display text-4xl font-extrabold text-found">{stats.resolved}</p>
          </div>
          
          <div className="group rounded-2xl border-2 border-purple/20 bg-white p-6 shadow-md hover:shadow-lg transition-all duration-base hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-navy/70">Total publicaciones</p>
              <FileText className="h-5 w-5 text-purple/40 group-hover:text-purple transition-colors" />
            </div>
            <p className="font-display text-4xl font-extrabold text-purple">{stats.total}</p>
          </div>
        </div>
      )}

      {activeTab === 'publicaciones' && (
        <div className="space-y-4">
          {publications.length === 0 ? (
            <EmptyState
              title="No tienes publicaciones aún"
              description="Crea tu primera publicación y ayuda a una patita a volver a casa."
              illustration="dog"
              action={
                <Link to="/publicar">
                  <Button variant="primary">
                    <PlusCircle className="h-5 w-5" />
                    Crear mi primera publicación
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                  <div className="absolute top-3 right-3 flex gap-2 z-10">
                    {pub.status !== 'RESOLVED' && (
                      <Button
                        variant="ghost"
                        onClick={() => handleResolve(pub.id)}
                        disabled={actionLoading === pub.id}
                        aria-label="Marcar como resuelto"
                        className="p-2 min-h-9 px-3 bg-white/90 hover:bg-found/10 border border-navy/10"
                      >
                        <CheckCircle className="h-4 w-4 text-found" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(pub.id)}
                      disabled={actionLoading === pub.id}
                      className="p-2 min-h-9 px-3 bg-white/90 hover:bg-lost/10 border border-navy/10"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-lost" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'perfil' && (
        <div className="max-w-2xl">
          <div className="rounded-2xl border-2 border-navy/10 bg-white p-8 shadow-md">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-navy/10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-turquoise flex items-center justify-center text-white text-2xl font-display font-extrabold">
                {user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-navy">Tu perfil</h2>
                <p className="text-sm text-navy/60">Información de tu cuenta</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-start justify-between py-3 border-b border-navy/5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy/60 mb-1">Usuario</p>
                  <p className="font-semibold text-navy">{user.user_metadata?.username ?? '—'}</p>
                </div>
              </div>
              
              <div className="flex items-start justify-between py-3 border-b border-navy/5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy/60 mb-1">Nombre completo</p>
                  <p className="font-semibold text-navy">{user.user_metadata?.full_name ?? '—'}</p>
                </div>
              </div>
              
              <div className="flex items-start justify-between py-3 border-b border-navy/5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy/60 mb-1">Correo</p>
                  <p className="font-semibold text-navy">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start justify-between py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy/60 mb-1">Miembro desde</p>
                  <p className="font-semibold text-navy">
                    {new Date(user.created_at).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;