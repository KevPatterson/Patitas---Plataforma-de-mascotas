import { useEffect } from 'react';
import { Search, MapPinned, Share2, BadgeCheck, PawPrint, Heart, Home } from 'lucide-react';
import { LinkButton } from '../components/ui/button';
import { StatCard } from '../components/ui/stat-card';
import { CasePill } from '../components/ui/case-pill';
import { Logo } from '../components/Logo';
import { setPageMeta } from '../lib/seo/page-meta';
import { generateWebsiteStructuredData, injectStructuredData, removeStructuredData } from '../lib/seo/structured-data';

const featuredCases = [
  {
    title: 'Toby',
    location: 'Playa, La Habana',
    tone: 'lost' as const,
    summary: 'Perro caramelo visto por última vez cerca de la costa.',
  },
  {
    title: 'Nina',
    location: 'Santa Clara',
    tone: 'found' as const,
    summary: 'Gata joven encontrada con collar azul y placa gastada.',
  },
  {
    title: 'Luna',
    location: 'Santiago de Cuba',
    tone: 'adoption' as const,
    summary: 'Cachorra sociable lista para adopción responsable.',
  },
];

const toneIcon: Record<string, typeof PawPrint> = {
  lost: PawPrint,
  found: Heart,
  adoption: Home,
};

export function HomePage() {
  useEffect(() => {
    setPageMeta({
      title: 'Patitas · Que ninguna patita se quede sin casa',
      description:
        'Plataforma comunitaria para reencontrar mascotas perdidas, reportar encontradas y promover adopciones responsables. Que ninguna patita se quede sin casa.',
    });

    const structuredData = generateWebsiteStructuredData({
      name: 'Patitas',
      description: 'Que ninguna patita se quede sin casa.',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://patitas.example',
    });
    injectStructuredData(structuredData, 'website-structured-data');

    return () => {
      removeStructuredData('website-structured-data');
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
            <StatCard value="1,248" label="Mascotas ayudadas" />
            <StatCard value="763" label="Encontradas" tone="success" />
            <StatCard value="521" label="Reunidas con sus familias" tone="success" />
            <StatCard value="312" label="En adopción" tone="warning" />
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
              {featuredCases.map((item, index) => {
                const Icon = toneIcon[item.tone];
                return (
                  <article
                    key={item.title}
                    className="rounded-[16px] border-2 border-[#CFEFE6] bg-[#F5FBF9] p-4"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-display text-2xl font-extrabold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
                            {item.title}
                          </h2>
                          <CasePill label={item.tone === 'lost' ? 'Perdida' : item.tone === 'found' ? 'Encontrada' : 'En adopción'} tone={item.tone} />
                        </div>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B3B3C]/60">{item.location}</p>
                        <p className="mt-3 text-sm leading-6 text-[#0B3B3C]/70">{item.summary}</p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#FF6B35] shadow-sm">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                    </div>
                  </article>
                );
              })}
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
            Toby, perro caramelo, Playa
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
