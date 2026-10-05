import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth-context';
import { supabase } from '../lib/supabase/client';
import { Button } from '../components/ui/button';

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
    title: string;
    slug: string;
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

export function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [reports, setReports] = useState<RecentReport[]>([]);
  const [publications, setPublications] = useState<RecentPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshDashboard = useCallback(async () => {
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const privileged = profile?.role === 'MODERATOR' || profile?.role === 'ADMIN';

    setIsPrivileged(privileged);

    if (!privileged) {
      setLoading(false);
      return;
    }

    const [publicationsCount, reportsCount, resolvedCount, usersCount, sightingsCount, adoptionsCount, recentReports, recentPublications] = await Promise.all([
      supabase.from('publications').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('publications').select('id', { count: 'exact', head: true }).eq('status', 'RESOLVED'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('sightings').select('id', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('adoption_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase
        .from('reports')
        .select(`
          id, 
          reason, 
          status, 
          created_at, 
          publication_id,
          publication:publications(title, slug)
        `)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('publications')
        .select('id, slug, title, type, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    setCounts({
      activePublications: publicationsCount.count ?? 0,
      pendingReports: reportsCount.count ?? 0,
      resolvedCases: resolvedCount.count ?? 0,
      totalUsers: usersCount.count ?? 0,
      recentSightings: sightingsCount.count ?? 0,
      adoptionRequests: adoptionsCount.count ?? 0,
    });
    
    setReports(
      ((recentReports.data ?? []) as Array<{
        id: string;
        reason: string;
        status: string;
        created_at: string;
        publication_id: string;
        publication: { title: string; slug: string } | { title: string; slug: string }[] | null;
      }>).map((item) => ({
        id: item.id,
        reason: item.reason,
        status: item.status,
        created_at: item.created_at,
        publication_id: item.publication_id,
        publication: Array.isArray(item.publication) ? item.publication[0] || null : item.publication,
      }))
    );
    
    setPublications((recentPublications.data ?? []) as RecentPublication[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!active) return;

      await refreshDashboard();
    }

    load();

    return () => {
      active = false;
    };
  }, [user, refreshDashboard]);

  if (authLoading || loading) {
    return <div className="soft-panel rounded-4xl p-6">Cargando panel...</div>;
  }

  if (!user) {
    return <div className="soft-panel rounded-4xl p-6">Debes iniciar sesión para acceder al panel.</div>;
  }

  if (!isPrivileged) {
    return <div className="soft-panel rounded-4xl p-6">No tienes permisos para acceder a esta sección.</div>;
  }

  const resolveReport = async (reportId: string) => {
    setActionLoadingId(reportId);
    setActionError(null);

    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ action: 'resolve-report', id: reportId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'No pudimos resolver el reporte.');
      }

      await refreshDashboard();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No pudimos resolver el reporte.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="space-y-6 py-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--color-muted)">Moderación</p>
        <h1 className="font-display text-4xl font-semibold text-(--color-text)">Panel administrativo</h1>
        <p className="text-(--color-muted)">Resumen operativo para revisar actividad, reportes y casos resueltos.</p>
      </div>

      {counts ? (
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
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reportes */}
        <div className="soft-panel rounded-4xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-(--color-text)">Reportes recientes</h2>
            <Button type="button" variant="ghost" onClick={refreshDashboard}>
              🔄
            </Button>
          </div>
          {actionError ? (
            <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">
              {actionError}
            </p>
          ) : null}
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
                  <Link
                    to={`/p/${report.publication.slug}`}
                    className="block text-sm font-medium text-(--color-primary) hover:underline"
                  >
                    {report.publication.title} →
                  </Link>
                ) : (
                  <p className="text-sm text-(--color-muted)">ID: {report.publication_id}</p>
                )}
                <p className="text-xs text-(--color-muted)">
                  {new Intl.DateTimeFormat('es-CU', { dateStyle: 'medium', timeStyle: 'short' }).format(
                    new Date(report.created_at)
                  )}
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
            {reports.length === 0 ? (
              <p className="text-center text-sm text-(--color-muted)">No hay reportes recientes.</p>
            ) : null}
          </div>
        </div>

        {/* Publicaciones recientes */}
        <div className="soft-panel rounded-4xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-(--color-text)">Publicaciones recientes</h2>
          <div className="space-y-3">
            {publications.map((pub) => (
              <Link
                key={pub.id}
                to={`/p/${pub.slug}`}
                className="block rounded-2xl border border-black/5 bg-white/80 p-4 transition hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-(--color-text)">{pub.title}</p>
                    <p className="mt-1 text-xs text-(--color-muted)">
                      {new Intl.DateTimeFormat('es-CU', { dateStyle: 'short', timeStyle: 'short' }).format(
                        new Date(pub.created_at)
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="rounded-full bg-(--color-primary)/10 px-3 py-1 text-xs font-bold text-(--color-primary)">
                      {pub.type}
                    </span>
                    <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-(--color-text)">
                      {pub.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {publications.length === 0 ? (
              <p className="text-center text-sm text-(--color-muted)">No hay publicaciones.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}