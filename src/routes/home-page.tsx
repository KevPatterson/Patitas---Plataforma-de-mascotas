import { useEffect, useState } from 'react';
import { Search, MapPinned, Share2, BadgeCheck, PawPrint, Loader2 } from 'lucide-react';
import { LinkButton } from '../components/ui/button';
import { StatCard } from '../components/ui/stat-card';
import { CasePill } from '../components/ui/case-pill';
import { Logo } from '../components/Logo';
import { setPageMeta } from '../lib/seo/page-meta';
import { generateWebsiteStructuredData, injectStructuredData, removeStructuredData } from '../lib/seo/structured-data';
import { searchPublications, countPublications } from '../lib/supabase/publication-search';
import { TYPE_LABELS } from '../lib/constants/labels';


export function HomePage() {
  const [recentCases, setRecentCases] = useState<Awaited<ReturnType<typeof searchPublications>>>([]);
  const [stats, setStats] = useState({ LOST: 0, FOUND: 0, ADOPTION: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Patitas — Plataforma comunitaria para mascotas en Cuba',
      description: 'Encuentra mascotas perdidas, reporta animales encontrados y ayuda a reunirlos con sus familias.',
    });

    const structuredData = generateWebsiteStructuredData({
      name: 'Patitas',
      description: 'Plataforma comunitaria para casos de mascotas perdidas, encontradas y en adopción en Cuba.',
      url: 'https://patitas.cu',
    });
    injectStructuredData(structuredData, 'website-structured-data');

    return () => {
      removeStructuredData('website-structured-data');
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [recent, lostCount, foundCount, adoptionCount, totalCount] = await Promise.all([
          searchPublications({ status: 'ACTIVE', limit: 8, offset: 0 }),
          countPublications({ type: 'LOST', status: 'ACTIVE' }),
          countPublications({ type: 'FOUND', status: 'ACTIVE' }),
          countPublications({ type: 'ADOPTION', status: 'ACTIVE' }),
          countPublications({ status: 'ACTIVE' }),
        ]);

        if (active) {
          setRecentCases(recent);
          setStats({
            LOST: lostCount,
            FOUND: foundCount,
            ADOPTION: adoptionCount,
            total: totalCount,
          });
        }
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-10 pb-10 pt-4 md:pt-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#CFEFE6] bg-white px-4 py-2 text-sm font-semibold text-[#0B3B3C] shadow-sm">
            <PawPrint className="h-4 w-4 text-[#FF6B35]" aria-hidden="true" />
            Plataforma comunitaria para casos reales en Cuba
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo variant="full" size={56} className="text-[#0B3B3C]" />
            </div>
            <h1 className="max-w-xl text-balance font-display text-3xl font-extrabold leading-tight text-[#0B3B3C] sm:text-5xl" style={{ fontFamily: '"Baloo 2", cursive' }}>
              Que ninguna patita se quede sin casa.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Encuentra mascotas perdidas, reporta animales encontrados y ayuda a reunirlos con sus familias en una plataforma estructurada, buscable y geolocalizada.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/buscar" variant="primary">
              Buscar mascota
            </LinkButton>
            <LinkButton href="/publicar" variant="secondary">
              Publicar un caso
            </LinkButton>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard value={stats.total.toLocaleString()} label="Casos activos" />
            <StatCard value={stats.LOST.toLocaleString()} label="Perdidos" tone="warning" />
            <StatCard value={stats.FOUND.toLocaleString()} label="Encontrados" tone="success" />
            <StatCard value={stats.ADOPTION.toLocaleString()} label="En adopción" tone="default" />
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[24px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,53,0.12),transparent_36%),radial-gradient(circle_at_80%_0%,rgba(207,239,230,0.6),transparent_26%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[24px] border-2 border-[#CFEFE6] bg-white p-5 shadow-[0_18px_50px_rgba(11,59,60,0.08)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B3B3C]/60">Muro comunitario</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
                  Casos recientes
                </p>
              </div>
              <div className="rounded-full bg-[#0B3B3C] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white">Cuba</div>
            </div>
            <div className="mt-5 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
                  <p className="text-sm text-[#0B3B3C]/60">Cargando casos recientes...</p>
                </div>
              ) : recentCases.length === 0 ? (
                <div className="text-center py-8 text-[#0B3B3C]/60">
                  <PawPrint className="h-12 w-12 mx-auto mb-4 text-[#0B3B3C]/30" />
                  <p>No hay casos recientes.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {recentCases.map((pub) => (
                    <article
                      key={pub.id}
                      className="rounded-[16px] border-2 border-[#CFEFE6] bg-[#F5FBF9] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-display text-xl font-extrabold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
                              {pub.title}
                            </h2>
                            <CasePill label={TYPE_LABELS[pub.type] ?? pub.type} tone={pub.type.toLowerCase() as 'lost' | 'found' | 'adoption'} />
                          </div>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B3B3C]/60">
                            {pub.province ? `${pub.province}${pub.municipality ? `, ${pub.municipality}` : ''}` : 'Ubicación no especificada'}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[#0B3B3C]/70 line-clamp-2">{pub.description}</p>
                        </div>
                        <LinkButton href={`/p/${pub.slug}`} variant="ghost" className="shrink-0">
                          Ver
                        </LinkButton>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[16px] border-2 border-[#CFEFE6] bg-white p-5">
          <div className="flex items-center gap-2 text-[#0B3B3C]">
            <Search className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B3B3C]/60">Búsqueda</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
            Busca por nombre, zona, especie o color
          </p>
        </div>
        <div className="rounded-[16px] border-2 border-[#CFEFE6] bg-white p-5">
          <div className="flex items-center gap-2 text-[#0B3B3C]">
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B3B3C]/60">Mapa</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
            Ubicaciones aproximadas, nunca direcciones exactas
          </p>
        </div>
        <div className="rounded-[16px] border-2 border-[#CFEFE6] bg-white p-5">
          <div className="flex items-center gap-2 text-[#0B3B3C]">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B3B3C]/60">Compartir</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
            Enlaces listos para WhatsApp, Facebook y Telegram
          </p>
        </div>
        <div className="rounded-[16px] border-2 border-[#CFEFE6] bg-white p-5">
          <div className="flex items-center gap-2 text-[#0B3B3C]">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B3B3C]/60">Resolver</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
            Cada caso puede cerrarse con un estado visible y humano
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;