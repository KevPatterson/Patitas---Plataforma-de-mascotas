import { useEffect, useState } from 'react';
import { Heart, Loader2, PawPrint, SearchX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { Logo } from '../components/Logo';
import { PublicationCard } from '../components/publications/publication-card';
import { searchPublications, type PublicationSummary } from '../lib/supabase/publication-search';
import { setPageMeta } from '../lib/seo/page-meta';

export function AdoptionsPage() {
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState('');
  const [size, setSize] = useState('');
  const [province, setProvince] = useState('');
  const [results, setResults] = useState<PublicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Adopciones · Patitas',
      description: 'Encuentra mascotas en adopción responsable. Ayúdalas a encontrar un hogar.',
      canonicalPath: '/adopciones',
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const data = await searchPublications({
          query,
          type: 'ADOPTION',
          province,
          status: 'ACTIVE',
        });

        if (active) {
          // Filtros adicionales del lado del cliente
          let filtered = data;

          if (species) {
            filtered = filtered.filter((p) => p.species?.toLowerCase().includes(species.toLowerCase()));
          }

          if (size) {
            filtered = filtered.filter((p) => p.size?.toLowerCase().includes(size.toLowerCase()));
          }

          setResults(filtered);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'No pudimos cargar las adopciones.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [province, query, size, species]);

  const hasActiveFilters = Boolean(query || species || size || province);

  function handleClearFilters() {
    setQuery('');
    setSpecies('');
    setSize('');
    setProvince('');
  }

  return (
    <section className="space-y-6 py-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0B3B3C]/60">Adopciones</p>
        <h1
          className="font-display text-4xl font-extrabold tracking-tight text-[#0B3B3C]"
          style={{ fontFamily: '"Baloo 2", cursive' }}
        >
          Mascotas en adopción responsable
        </h1>
        <p className="text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
          Estas mascotas están buscando un hogar. Adoptar es un acto de amor que cambia dos vidas: la tuya y la de
          ellos.
        </p>
      </div>

      <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-5 shadow-sm space-y-4">
        <TextField
          label="Buscar"
          placeholder="Nombre, características..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Especie</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={species}
              onChange={(event) => setSpecies(event.target.value)}
            >
              <option value="">Todas</option>
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="ave">Ave</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Tamaño</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={size}
              onChange={(event) => setSize(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Provincia</span>
            <input
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/40 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              placeholder="La Habana"
            />
          </label>
          <div className="flex items-end">
            <Button type="button" variant="ghost" className="w-full" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-[16px] border border-[#C2332C]/15 bg-[rgba(194,51,44,0.08)] px-4 py-3 text-sm font-medium text-[#C2332C]">
          {errorMessage}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-[24px] border-2 border-[#CFEFE6] bg-white p-8 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" aria-hidden="true" />
          <span className="text-sm font-semibold text-[#0B3B3C]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            Cargando adopciones...
          </span>
        </div>
      ) : null}

      {!loading && results.length === 0 ? (
        <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <Logo variant="mark" size={48} />
            <div className="flex items-center gap-2 rounded-full border border-[#CFEFE6] bg-[#F5FBF9] px-3 py-1.5">
              <PawPrint className="h-4 w-4 text-[#FF6B35]" aria-hidden="true" />
              <Heart className="h-4 w-4 text-[#FF6B35]" aria-hidden="true" />
              <SearchX className="h-4 w-4 text-[#0B3B3C]/40" aria-hidden="true" />
            </div>
            <h2
              className="font-display text-xl font-extrabold tracking-tight text-[#0B3B3C]"
              style={{ fontFamily: '"Baloo 2", cursive' }}
            >
              Aún no hay patitas en adopción
            </h2>
            <p className="text-sm leading-6 text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Aún no hay patitas en adopción con esos filtros. Vuelve pronto — pronto llegará una nueva historia.
            </p>
            {hasActiveFilters ? (
              <Button type="button" variant="secondary" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Explorar de nuevo
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((publication) => (
          <PublicationCard key={publication.id} publication={publication} />
        ))}
      </div>

      {!loading && results.length > 0 ? (
        <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CFEFE6] text-[#0B3B3C]">
              <Heart className="h-5 w-5 text-[#0B3B3C]" aria-hidden="true" />
            </div>
            <p
              className="font-display text-lg font-extrabold text-[#0B3B3C]"
              style={{ fontFamily: '"Baloo 2", cursive' }}
            >
              ¿Quieres adoptar?
            </p>
            <p className="text-sm leading-6 text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Contacta al responsable desde la publicación. La adopción responsable requiere compromiso y cariño.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
