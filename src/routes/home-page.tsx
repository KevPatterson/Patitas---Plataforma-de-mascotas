import { useEffect, useState } from 'react';
import { Search, MapPin, Heart, BadgeCheck, PawPrint, TrendingUp, Users, Map as MapIcon } from 'lucide-react';
import { LinkButton } from '../components/ui/button';
import { StatCard } from '../components/ui/stat-card';
import { PublicationCard } from '../components/publications/publication-card';
import { PawLoader, PawTrail } from '../components/ui/paw-loader';
import { EmptyState } from '../components/ui/empty-state';
import { setPageMeta } from '../lib/seo/page-meta';
import { generateWebsiteStructuredData, injectStructuredData, removeStructuredData } from '../lib/seo/structured-data';
import { searchPublications, countPublications } from '../lib/supabase/publication-search';

export function HomePage() {
  const [recentCases, setRecentCases] = useState<Awaited<ReturnType<typeof searchPublications>>>([]);
  const [stats, setStats] = useState({ LOST: 0, FOUND: 0, ADOPTION: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPageMeta({
      title: 'Patitas — Cada patita merece volver a casa',
      description: 'Plataforma comunitaria para mascotas perdidas, encontradas y en adopción en Cuba. Ayuda a reunir familias con sus mejores amigos.',
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
          searchPublications({ status: 'ACTIVE', limit: 6, offset: 0 }),
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
    <div className="space-y-16 pb-16 pt-6 md:pt-10">
      {/* 🎨 HERO ANIME - Sección principal */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange/5 via-cream to-turquoise/5 border-2 border-navy/10 shadow-xl">
        {/* Decoraciones de fondo */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="blob-decoration absolute top-10 right-10 size-32 bg-orange/20" />
        <div className="blob-decoration absolute bottom-10 left-10 size-40 bg-turquoise/15" style={{ animationDelay: '2s' }} />
        
        {/* Contenido del hero */}
        <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-12 p-8 md:p-12 lg:p-16">
          {/* Lado izquierdo: Texto y CTAs */}
          <div className="flex flex-col justify-center space-y-6 z-10">
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-bold text-navy shadow-sm border border-navy/10 self-start">
              <PawPrint className="size-4 text-orange animate-paw-bounce" aria-hidden="true" />
              Plataforma comunitaria en Cuba
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-navy animate-fade-up">
              Cada patita merece volver a casa
            </h1>
            
            <p className="text-lg md:text-xl leading-relaxed text-navy/70 max-w-xl animate-fade-up" style={{ animationDelay: '100ms' }}>
              Ayuda a encontrar, proteger y dar un nuevo hogar a quienes más lo necesitan. Juntos hacemos la diferencia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
              <LinkButton href="/buscar" variant="primary" className="group">
                <Search className="size-5 transition-transform duration-base group-hover:scale-110" />
                Buscar una patita
              </LinkButton>
              <LinkButton href="/publicar" variant="secondary" className="group">
                <PawPrint className="size-5 transition-transform duration-base group-hover:rotate-12" />
                Publicar un caso
              </LinkButton>
            </div>

            {/* Mini stats en el hero */}
            <div className="grid grid-cols-3 gap-3 pt-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
              <div className="rounded-xl bg-white/60 backdrop-blur-sm p-3 border border-navy/10">
                <p className="font-display text-2xl font-extrabold text-lost">{stats.LOST}</p>
                <p className="text-xs font-medium text-navy/70">Perdidos</p>
              </div>
              <div className="rounded-xl bg-white/60 backdrop-blur-sm p-3 border border-navy/10">
                <p className="font-display text-2xl font-extrabold text-found">{stats.FOUND}</p>
                <p className="text-xs font-medium text-navy/70">Encontrados</p>
              </div>
              <div className="rounded-xl bg-white/60 backdrop-blur-sm p-3 border border-navy/10">
                <p className="font-display text-2xl font-extrabold text-purple">{stats.ADOPTION}</p>
                <p className="text-xs font-medium text-navy/70">En adopción</p>
              </div>
            </div>
          </div>

          {/* Lado derecho: Ilustración placeholder (aquí irían las ilustraciones anime) */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Placeholder para ilustraciones anime de mascotas */}
              <div className="relative aspect-square flex items-center justify-center">
                {/* Círculo decorativo de fondo */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange/20 to-turquoise/20 animate-float" />
                
                {/* Iconos de huellas decorativas */}
                <div className="absolute top-10 left-10 animate-paw-bounce" style={{ animationDelay: '0s' }}>
                  <PawPrint className="size-8 text-orange/40" />
                </div>
                <div className="absolute top-20 right-16 animate-paw-bounce" style={{ animationDelay: '400ms' }}>
                  <PawPrint className="size-6 text-turquoise/40" />
                </div>
                <div className="absolute bottom-16 left-16 animate-paw-bounce" style={{ animationDelay: '800ms' }}>
                  <PawPrint className="size-10 text-purple/40" />
                </div>
                <div className="absolute bottom-10 right-10 animate-paw-bounce" style={{ animationDelay: '1200ms' }}>
                  <PawPrint className="size-7 text-orange/40" />
                </div>
                
                {/* Texto placeholder para ilustraciones */}
                <div className="relative z-10 text-center p-8 rounded-2xl bg-white/40 backdrop-blur-sm border-2 border-dashed border-navy/20">
                  <p className="font-display text-lg font-bold text-navy/60 mb-2">
                    🐶 🐱
                  </p>
                  <p className="text-sm text-navy/50">
                    Ilustraciones anime de mascotas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🐾 CASOS CERCA DE TI */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="size-5 text-turquoise" />
              <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Casos activos</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-navy">
              🐾 Casos cerca de ti
            </h2>
            <p className="text-navy/60 mt-1">Últimos casos publicados en tu zona</p>
          </div>
          <LinkButton href="/buscar" variant="ghost" className="hidden sm:flex">
            Ver todos →
          </LinkButton>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <PawTrail />
            <p className="text-sm text-navy/60">Cargando casos recientes...</p>
          </div>
        ) : recentCases.length === 0 ? (
          <EmptyState
            title="No hay casos recientes"
            description="Sé el primero en publicar un caso y ayudar a una patita."
            illustration="cat"
            action={<LinkButton href="/publicar" variant="primary">Publicar caso</LinkButton>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentCases.map((pub) => (
              <PublicationCard key={pub.id} publication={pub} />
            ))}
          </div>
        )}

        <div className="text-center pt-4">
          <LinkButton href="/buscar" variant="ghost" className="sm:hidden">
            Ver todos los casos →
          </LinkButton>
        </div>
      </section>

      {/* 🗺️ EXPLORA EN EL MAPA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-turquoise/10 to-purple/10 border-2 border-navy/10 p-8 md:p-12">
        <div className="relative z-10 grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapIcon className="size-5 text-turquoise" />
              <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Geolocalización</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-navy mb-4">
              🗺️ Explora en el mapa
            </h2>
            <p className="text-lg text-navy/70 mb-6 leading-relaxed">
              Visualiza todos los casos cerca de ti. Cada marcador es una historia esperando un final feliz.
            </p>
            <LinkButton href="/mapa" variant="secondary">
              Abrir mapa →
            </LinkButton>
          </div>
          <div className="relative aspect-video rounded-2xl bg-navy/5 border-2 border-dashed border-navy/20 flex items-center justify-center">
            <MapIcon className="size-16 text-navy/20" />
          </div>
        </div>
      </section>

      {/* 🐾 MODO RESCATE - Cómo funciona */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="size-5 text-orange" />
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Modo rescate</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-navy">
            Es más fácil de lo que piensas
          </h2>
          <p className="text-navy/60 max-w-2xl mx-auto">
            Tres pasos simples para hacer la diferencia
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Paso 1 */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-navy/10 p-8 shadow-md hover:shadow-xl transition-all duration-base hover:-translate-y-2">
            <div className="absolute top-4 right-4 text-6xl font-display font-extrabold text-orange/10">01</div>
            <div className="relative space-y-4">
              <div className="size-12 rounded-xl bg-orange/10 flex items-center justify-center">
                <PawPrint className="size-6 text-orange" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-navy">PUBLICA</h3>
              <p className="text-navy/70 leading-relaxed">
                Describe la mascota y comparte su ubicación. Todo es seguro y privado.
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-navy/10 p-8 shadow-md hover:shadow-xl transition-all duration-base hover:-translate-y-2">
            <div className="absolute top-4 right-4 text-6xl font-display font-extrabold text-turquoise/10">02</div>
            <div className="relative space-y-4">
              <div className="size-12 rounded-xl bg-turquoise/10 flex items-center justify-center">
                <Users className="size-6 text-turquoise" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-navy">CONECTA</h3>
              <p className="text-navy/70 leading-relaxed">
                La comunidad ayuda a difundir el caso. Miles de ojos buscando.
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border-2 border-navy/10 p-8 shadow-md hover:shadow-xl transition-all duration-base hover:-translate-y-2">
            <div className="absolute top-4 right-4 text-6xl font-display font-extrabold text-purple/10">03</div>
            <div className="relative space-y-4">
              <div className="size-12 rounded-xl bg-purple/10 flex items-center justify-center">
                <BadgeCheck className="size-6 text-purple" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-navy">REENCUENTRA</h3>
              <p className="text-navy/70 leading-relaxed">
                La historia termina con una mascota de vuelta en casa. ❤️
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 ESTADÍSTICAS DE LA COMUNIDAD */}
      <section className="grid gap-6 md:grid-cols-4">
        <StatCard 
          value={stats.total.toLocaleString()} 
          label="Casos activos" 
          icon={<TrendingUp className="size-8" />}
        />
        <StatCard 
          value={stats.LOST.toLocaleString()} 
          label="Perdidos" 
          tone="warning"
          icon={<PawPrint className="size-8" />}
        />
        <StatCard 
          value={stats.FOUND.toLocaleString()} 
          label="Encontrados" 
          tone="success"
          icon={<BadgeCheck className="size-8" />}
        />
        <StatCard 
          value={stats.ADOPTION.toLocaleString()} 
          label="En adopción" 
          tone="adoption"
          icon={<Heart className="size-8" />}
        />
      </section>
    </div>
  );
}

export default HomePage;