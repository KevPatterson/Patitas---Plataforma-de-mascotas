import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PawPrint, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { Logo } from '../components/Logo';
import { PublicationCard } from '../components/publications/publication-card';
import { searchPublications, countPublications, type PublicationSummary } from '../lib/supabase/publication-search';
import { TYPE_LABELS, SPECIES_LABELS, SEX_LABELS, SIZE_LABELS, STATUS_LABELS } from '../lib/constants/labels';
import { CUBA, PROVINCES } from '../lib/constants/cuba';

type SearchFilters = {
  query?: string;
  type?: PublicationSummary['type'] | 'ALL';
  species?: string;
  sex?: string;
  size?: string;
  province?: string;
  municipality?: string;
  status?: PublicationSummary['status'] | 'ALL';
  since?: string;
  until?: string;
};

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<PublicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const LIMIT = 48;

  const filters = useMemo((): SearchFilters => {
    return {
      query: searchParams.get('q') || '',
      type: (searchParams.get('type') as SearchFilters['type']) || 'ALL',
      species: searchParams.get('species') || '',
      sex: searchParams.get('sex') || '',
      size: searchParams.get('size') || '',
      province: searchParams.get('province') || '',
      municipality: searchParams.get('municipality') || '',
      status: (searchParams.get('status') as SearchFilters['status']) || 'ACTIVE',
      since: searchParams.get('since') || '',
      until: searchParams.get('until') || '',
    };
  }, [searchParams]);

  const municipalities = useMemo(() => filters.province ? CUBA[filters.province as keyof typeof CUBA] ?? [] : [], [filters.province]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const searchFilters = { ...filters, limit: LIMIT, offset: (page - 1) * LIMIT };
        const [data, count] = await Promise.all([
          searchPublications(searchFilters),
          countPublications(searchFilters),
        ]);
        if (active) {
          setResults(data);
          setTotalCount(count);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Error al buscar');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filters, page]);

  function updateParam(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
    setPage(1);
  }

  function clearFilters() {
    setSearchParams({});
    setPage(1);
  }

  const totalPages = Math.ceil(totalCount / LIMIT);

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
          value={filters.query}
          onChange={(event) => updateParam('q', event.target.value || null)}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Tipo</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={filters.type}
              onChange={(event) => updateParam('type', event.target.value === 'ALL' ? null : event.target.value)}
            >
              <option value="ALL">Todos</option>
              {(Object.entries(TYPE_LABELS) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Especie</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={filters.species}
              onChange={(event) => updateParam('species', event.target.value || null)}
            >
              <option value="">Todas</option>
              {(Object.entries(SPECIES_LABELS) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Sexo</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={filters.sex}
              onChange={(event) => updateParam('sex', event.target.value || null)}
            >
              <option value="">Todos</option>
              {(Object.entries(SEX_LABELS) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
            <span style={{ fontFamily: 'Figtree, sans-serif' }}>Tamaño</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              style={{ fontFamily: 'Figtree, sans-serif' }}
              value={filters.size}
              onChange={(event) => updateParam('size', event.target.value || null)}
            >
              <option value="">Todos</option>
              {(Object.entries(SIZE_LABELS) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <Button type="button" variant="ghost" className="w-full md:w-auto" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? 'Ocultar filtros avanzados' : 'Filtros avanzados'} <ChevronDown className={`h-4 w-4 transition ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>

        {showAdvanced && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-top-2">
            <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
              <span style={{ fontFamily: 'Figtree, sans-serif' }}>Provincia</span>
              <select
                className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                style={{ fontFamily: 'Figtree, sans-serif' }}
                value={filters.province}
                onChange={(event) => {
                  updateParam('province', event.target.value || null);
                  updateParam('municipality', null);
                }}
              >
                <option value="">Todas</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
              <span style={{ fontFamily: 'Figtree, sans-serif' }}>Municipio</span>
              <select
                className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                style={{ fontFamily: 'Figtree, sans-serif' }}
                value={filters.municipality}
                onChange={(event) => updateParam('municipality', event.target.value || null)}
                disabled={municipalities.length === 0}
              >
                <option value="">Todos</option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
              <span style={{ fontFamily: 'Figtree, sans-serif' }}>Estado</span>
              <select
                className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                style={{ fontFamily: 'Figtree, sans-serif' }}
                value={filters.status}
                onChange={(event) => updateParam('status', event.target.value === 'ALL' ? null : event.target.value)}
              >
                <option value="ALL">Todos</option>
                {(Object.entries(STATUS_LABELS) as [string, string][]).filter(([k]) => k !== 'DELETED').map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
              <span style={{ fontFamily: 'Figtree, sans-serif' }}>Desde</span>
              <input
                type="date"
                className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                style={{ fontFamily: 'Figtree, sans-serif' }}
                value={filters.since}
                onChange={(event) => updateParam('since', event.target.value || null)}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
              <span style={{ fontFamily: 'Figtree, sans-serif' }}>Hasta</span>
              <input
                type="date"
                className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition placeholder:text-[#0B3B3C]/50 focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                style={{ fontFamily: 'Figtree, sans-serif' }}
                value={filters.until}
                onChange={(event) => updateParam('until', event.target.value || null)}
              />
            </label>
          </div>
        )}

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
            <Loader2 className="h-5 w-5 animate-spin" />
            Buscando...
          </div>
        </div>
      ) : null}

      {!loading && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-[#CFEFE6] bg-white p-8 text-center shadow-sm">
          <PawPrint className="h-16 w-16 text-[#0B3B3C]/30" />
          <p className="text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
            No se encontraron casos con los filtros actuales.
          </p>
          <Button variant="ghost" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      ) : null}

      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-[#0B3B3C]/60" style={{ fontFamily: 'Figtree, sans-serif' }}>
            {totalCount} resultado{totalCount !== 1 ? 's' : ''} · Página {page} de {totalPages || 1}
          </p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((pub) => (
              <PublicationCard key={pub.id} publication={pub} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </Button>
              <span className="px-4 text-sm font-semibold text-[#0B3B3C]">{page} / {totalPages}</span>
              <Button variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default SearchPage;