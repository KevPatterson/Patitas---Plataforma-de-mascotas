import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth-context';
import { supabase } from '../lib/supabase/client';
import { Button } from '../components/ui/button';
import { UserPlus, Shield } from 'lucide-react';

type DashboardCounts = {
  activePublications: number;
  pendingReports: number;
  resolvedCases: number;
  totalUsers: number;
  recentSightings: number;
  adoptionRequests: number;
};

type RecentReport = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  publication_id: string;
  publication?: {
    slug: string;
    title: string;
  } | null;
};

type RecentPublication = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
};

type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  created_at: string;
  deleted_at: string | null;
};

type Tab = 'dashboard' | 'reports' | 'users' | 'publications';

export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [publications, setPublications] = useState<RecentPublication[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setActionError(null);

    try {
      const [countsResults, reportsRes, pubsRes, usersRes] = await Promise.all([
        Promise.all([
          supabase.from('publications').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
          supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
          supabase.from('publications').select('id', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('sightings').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('adoption_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        ]),
        supabase.from('reports').select('id, reason, status, created_at, publication_id, publication:publications(slug, title)').order('created_at', { ascending: false }).limit(20),
        supabase.from('publications').select('id, slug, title, type, status, created_at').order('created_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('id, username, full_name, avatar_url, role, created_at, deleted_at').order('created_at', { ascending: false }).limit(100),
      ]);

      const [activePubs, pendingReports, resolvedCases, totalUsers, recentSightings, adoptionRequests] = countsResults;

      setCounts({
        activePublications: activePubs.count ?? 0,
        pendingReports: pendingReports.count ?? 0,
        resolvedCases: resolvedCases.count ?? 0,
        totalUsers: totalUsers.count ?? 0,
        recentSightings: recentSightings.count ?? 0,
        adoptionRequests: adoptionRequests.count ?? 0,
      });

      setReports(((reportsRes.data ?? []).map((r) => ({ ...r, publication: Array.isArray(r.publication) ? r.publication[0] : r.publication })) as RecentReport[]));
      setPublications((pubsRes.data ?? []) as RecentPublication[]);
      setUsers((usersRes.data ?? []) as UserProfile[]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsPrivileged(false);
      setIsAdmin(false);
      return;
    }
    refreshDashboard();
    const profileRes = supabase.from('profiles').select('role').eq('id', user.id).single();
    profileRes.then(({ data }) => {
      if (data) {
        setIsPrivileged(data.role === 'MODERATOR' || data.role === 'ADMIN');
        setIsAdmin(data.role === 'ADMIN');
      }
    });
  }, [user, authLoading, refreshDashboard]);

  const apiCall = async (action: string, id: string, extra?: Record<string, unknown>) => {
    setActionLoadingId(id);
    setActionError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) throw new Error('No hay sesión activa');

      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, id, ...extra }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en la acción');
      }

      refreshDashboard();
      return result;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error en la acción');
      throw error;
    } finally {
      setActionLoadingId(null);
    }
  };

  const resolveReport = async (reportId: string) => {
    await apiCall('resolve-report', reportId);
  };

  const setUserRole = async (userId: string, newRole: 'USER' | 'MODERATOR' | 'ADMIN') => {
    await apiCall('set-role', userId, { role: newRole });
  };

  if (authLoading || loading) {
    return <div className="soft-panel rounded-4xl p-6">Cargando panel...</div>;
  }

  if (!user) {
    return <div className="soft-panel rounded-4xl p-6">Debes iniciar sesión para acceder al panel.</div>;
  }

  if (!isPrivileged) {
    return <div className="soft-panel rounded-4xl p-6">No tienes permisos para acceder a esta sección.</div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Resumen', icon: <Shield className="size-5" /> },
    { id: 'reports', label: 'Reportes', icon: <Shield className="size-5" /> },
    { id: 'publications', label: 'Publicaciones', icon: <UserPlus className="size-5" /> },
    { id: 'users', label: 'Usuarios', icon: <UserPlus className="size-5" /> },
  ];

  return (
    <section className="space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-(--color-text)">Panel administrativo</h1>
          <p className="text-(--color-muted)">Resumen operativo para revisar actividad, reportes y casos resueltos.</p>
        </div>
        <Button type="button" variant="ghost" onClick={refreshDashboard}>
          <span className="size-5 animate-spin" style={{ display: loading ? 'block' : 'none' }}>🔄</span>
          Actualizar
        </Button>
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

      {actionError && (
        <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">
          {actionError}
        </p>
      )}

      {activeTab === 'dashboard' && counts && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="soft-panel rounded-[1.6rem] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-(--color-muted)">Publicaciones activas</p>
            <p className="mt-2 font-display text-3xl font-semibold">{counts.activePublications}</p>
          </div>
          <div className="soft-panel rounded-[1.6rem] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-(--color-muted)">Reportes pendientes</p>
            <p className="mt-2 font-display text-3xl font-semibold text-(--color-warning)">{counts.pendingReports}</p>
          </div>
          <div className="soft-panel rounded-[1.6rem] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-(--color-muted)">Casos resueltos</p>
            <p className="mt-2 font-display text-3xl font-semibold text-(--color-success)">{counts.resolvedCases}</p>
          </div>
          <div className="soft-panel rounded-[1.6rem] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-(--color-muted)">Usuarios totales</p>
            <p className="mt-2 font-display text-3xl font-semibold">{counts.totalUsers}</p>
          </div>
          <div className="soft-panel rounded-[1.6rem] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-(--color-muted)">Avistamientos (7 días)</p>
            <p className="mt-2 font-display text-3xl font-semibold text-(--color-accent)">{counts.recentSightings}</p>
          </div>
          <div className="soft-panel rounded-[1.6rem] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-(--color-muted)">Adopciones pendientes</p>
            <p className="mt-2 font-display text-3xl font-semibold text-(--color-primary)">{counts.adoptionRequests}</p>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="soft-panel rounded-4xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-(--color-text)">Reportes recientes</h2>
            <Button type="button" variant="ghost" onClick={refreshDashboard}>🔄</Button>
          </div>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl border border-black/5 bg-white/80 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-(--color-text)">{report.reason}</p>
                  <span className="rounded-full bg-[rgba(15,61,51,0.08)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-(--color-primary)">
                    {report.status}
                  </span>
                </div>
                {report.publication ? (
                  <Link to={`/p/${report.publication.slug}`} className="block text-sm font-medium text-(--color-primary) hover:underline">
                    {report.publication.title} →
                  </Link>
                ) : (
                  <p className="text-sm text-(--color-muted)">ID: {report.publication_id}</p>
                )}
                <p className="text-xs text-(--color-muted)">
                  {new Intl.DateTimeFormat('es-CU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.created_at))}
                </p>
                {report.status === 'PENDING' ? (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => resolveReport(report.id)}
                      disabled={actionLoadingId === report.id}
                    >
                      {actionLoadingId === report.id ? 'Resolviendo...' : 'Resolver'}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
            {reports.length === 0 ? <p className="text-center text-sm text-(--color-muted)">No hay reportes recientes.</p> : null}
          </div>
        </div>
      )}

      {activeTab === 'publications' && (
        <div className="soft-panel rounded-4xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-(--color-text)">Publicaciones recientes</h2>
          <div className="space-y-3">
            {publications.map((pub) => (
              <Link key={pub.id} to={`/p/${pub.slug}`} className="block rounded-2xl border border-black/5 bg-white/80 p-4 transition hover:bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-(--color-text)">{pub.title}</p>
                    <p className="mt-1 text-xs text-(--color-muted)">
                      {new Intl.DateTimeFormat('es-CU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(pub.created_at))}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="rounded-full bg-(--color-primary)/10 px-3 py-1 text-xs font-bold text-(--color-primary)">{pub.type}</span>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-(--color-text)">{pub.status}</span>
                  </div>
                </div>
              </Link>
            ))}
            {publications.length === 0 ? <p className="text-center text-sm text-(--color-muted)">No hay publicaciones.</p> : null}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="soft-panel rounded-4xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-(--color-text)">Gestión de usuarios</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-(--color-muted)">
                  <th className="pb-3 font-semibold">Usuario</th>
                  <th className="pb-3 font-semibold">Nombre</th>
                  <th className="pb-3 font-semibold">Rol</th>
                  <th className="pb-3 font-semibold">Registrado</th>
                  <th className="pb-3 font-semibold">Estado</th>
                  <th className="pb-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-black/5">
                    <td className="py-3 font-medium text-(--color-text)">@{u.username}</td>
                    <td className="py-3 text-(--color-muted)">{u.full_name ?? '—'}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                        u.role === 'ADMIN' ? 'bg-(--color-danger)/10 text-(--color-danger)' :
                        u.role === 'MODERATOR' ? 'bg-(--color-warning)/10 text-(--color-warning)' :
                        'bg-(--color-primary)/10 text-(--color-primary)'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-(--color-muted)">
                      {new Intl.DateTimeFormat('es-CU', { dateStyle: 'short' }).format(new Date(u.created_at))}
                    </td>
                    <td className="py-3">
                      <span className={u.deleted_at ? 'text-(--color-danger)' : 'text-(--color-success)'}>
                        {u.deleted_at ? 'Eliminado' : 'Activo'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => setUserRole(u.id, e.target.value as 'USER' | 'MODERATOR' | 'ADMIN')}
                          disabled={actionLoadingId === u.id || !isAdmin}
                          className="h-10 rounded-2xl border-2 border-[#CFEFE6] bg-white px-3 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20 cursor-pointer"
                        >
                          <option value="USER">Usuario</option>
                          <option value="MODERATOR">Moderador</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        {actionLoadingId === u.id && <span className="size-5 animate-spin text-(--color-primary)">⏳</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-center text-sm text-(--color-muted) py-8">No hay usuarios.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminPage;