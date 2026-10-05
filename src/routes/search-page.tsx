import { useEffect, useState } from 'react';
import { SearchX, PawPrint, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { Logo } from '../components/Logo';
import { PublicationCard } from '../components/publications/publication-card';
import { searchPublications, type PublicationSummary } from '../lib/supabase/publication-search';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'ALL' | PublicationSummary['type']>('ALL');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState<'ALL' | PublicationSummary['status']>('ACTIVE');
  const [results, setResults] = useState<PublicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const data = await searchPublications({ query, type, province, status });

        if (active) {
          setResults(data);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'No pudimos cargar la búsqueda.');
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
  }, [province, query, status, type]);

  function clearFilters() {
    setQuery('');
    setType('ALL');
    setProvince('');
    setStatus('ACTIVE');
  }

  return (
    <section className="space-y-6 py-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0B3B3C]/60">Buscar</p>
        <h1
          className="text-4xl font-extrabold tracking-tight text-[#0B3B3C]"
          style={{ fontFamily: '"Baloo 2", cursive' }}
        >
          Encuentra casos por nombre, zona o tipo
        </h1>
        <p className="text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
          La búsqueda combina texto y filtros para encontrar mascotas perdidas, encontradas y en adopción.
        </p>
      </div>

      <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-5 shadow-sm space-y-4">
        <TextField
          label="Buscar"
          placeholder="Toby, gato negro, Playa..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Tipo</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
            >
              <option value="ALL">Todos</option>
              <option value="LOST">Perdido</option>
              <option value="FOUND">Encontrado</option>
              <option value="ABANDONED">Abandonado</option>
              <option value="ADOPTION">Adopción</option>
              <option value="SIGHTING">Avistamiento</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Provincia</span>
            <input
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              placeholder="La Habana"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Estado</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
            >
              <option value="ACTIVE">Activas</option>
              <option value="RESOLVED">Resueltas</option>
              <option value="ALL">Todas</option>
            </select>
          </label>
        </div>
        <Button type="button" variant="ghost" onClick={clearFilters}>
          Limpiar filtros
        </Button>
      </div>

      {errorMessage ? (
        <p className="rounded-[16px] bg-[#C2332C]/10 px-4 py-3 text-sm font-medium text-[#C2332C]" style={{ fontFamily: 'Figtree, sans-serif' }}>
          {errorMessage}
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-[#CFEFE6] bg-white p-8 text-center shadow-sm">
          <Logo variant="mark" size={48} />
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
            <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" aria-hidden="true" />
            Cargando resultados...
          </div>
          <div className="flex items-center gap-2 text-[#0B3B3C]/30">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      ) : null}

      {!loading && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-[#CFEFE6] bg-white p-8 text-center shadow-sm">
          <Logo variant="mark" size={48} />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#CFEFE6] text-[#0B3B3C]">
            <SearchX className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="max-w-md space-y-2">
            <p className="text-base font-extrabold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
              No encontramos peluditos con esos filtros
            </p>
            <p className="text-sm leading-6 text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
              No encontramos peluditos con esos filtros. Prueba con otras palabras o limpia los filtros — seguimos buscando
              juntos.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[#0B3B3C]/20">
            <PawPrint className="h-4 w-4" aria-hidden="true" />
          </div>
          <Button type="button" variant="secondary" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((publication) => (
          <PublicationCard key={publication.id} publication={publication} />
        ))}
      </div>
    </section>
  );
}
