import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { MapPin, PawPrint, Layers } from 'lucide-react';
import { searchPublications, type PublicationSummary } from '../lib/supabase/publication-search';
import { TYPE_LABELS, TYPE_COLORS } from '../lib/constants/labels';
import { PawLoader } from '../components/ui/paw-loader';
import { setPageMeta } from '../lib/seo/page-meta';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ColoredMarker({ position, color, children }: { position: [number, number]; color: string; children: React.ReactNode }) {
  const icon = useMemo(() => L.divIcon({
    className: 'custom-marker',
    html: `<div style="width: 28px; height: 28px; border-radius: 50%; background: ${color}; border: 3px solid white; box-shadow: 0 4px 12px rgba(26, 35, 50, 0.25);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  }), [color]);

  return <Marker position={position} icon={icon}>{children}</Marker>;
}

export function MapPage() {
  const [results, setResults] = useState<PublicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'ALL' as 'ALL' | PublicationSummary['type'],
    species: '',
    province: '',
  });

  useEffect(() => {
    setPageMeta({
      title: 'Mapa de casos — Patitas',
      description: 'Explora en el mapa los casos de mascotas perdidas, encontradas, abandonadas y en adopción. Ubicaciones aproximadas para proteger privacidad.',
      canonicalPath: '/mapa',
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const searchFilters = {
          status: 'ACTIVE' as const,
          type: filters.type === 'ALL' ? undefined : filters.type,
          species: filters.species || undefined,
          province: filters.province || undefined,
          limit: 60,
        };
        const data = await searchPublications(searchFilters);
        if (active) {
          setResults(data.filter((p: { approximateLat: number | null; approximateLng: number | null }) => 
            p.approximateLat !== null && p.approximateLng !== null
          ));
        }
      } catch (error) {
        console.error('Error loading map:', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filters]);

  const center = useMemo(() => [23.1136, -82.3666] as [number, number], []);

  const typeOptions = [
    { value: 'ALL', label: 'Todos los tipos' },
    ...(Object.entries(TYPE_LABELS) as [string, string][]).map(([value, label]) => ({ value, label })),
  ];

  const speciesOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'Todas las especies' },
    { value: 'dog', label: 'Perro' },
    { value: 'cat', label: 'Gato' },
    { value: 'bird', label: 'Ave' },
    { value: 'rabbit', label: 'Conejo' },
    { value: 'rodent', label: 'Roedor' },
    { value: 'reptile', label: 'Reptil' },
    { value: 'other', label: 'Otro' },
  ];

  const provinceOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'Todas las provincias' },
    ...['Pinar del Río', 'Artemisa', 'La Habana', 'Mayabeque', 'Matanzas', 'Villa Clara', 'Cienfuegos', 'Sancti Spíritus', 'Ciego de Ávila', 'Camagüey', 'Las Tunas', 'Holguín', 'Granma', 'Santiago de Cuba', 'Guantánamo', 'Isla de la Juventud'].map((p) => ({ value: p, label: p })),
  ];

  return (
    <section className="space-y-8 py-10">
      {/* Hero del mapa */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-turquoise/10 via-cream to-purple/10 border-2 border-navy/10 p-8 md:p-12 shadow-md">
        <div className="blob-decoration absolute top-5 right-5 size-32 bg-orange/20" />
        <div className="blob-decoration absolute bottom-5 left-5 size-24 bg-turquoise/15" style={{ animationDelay: '2s' }} />
        
        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-6 text-turquoise animate-paw-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Explorar</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-navy">
            🗺️ Explora en el mapa
          </h1>
          <p className="text-lg text-navy/70 leading-relaxed max-w-2xl">
            Cada marcador representa un caso activo. Las ubicaciones están difuminadas para proteger la privacidad.
          </p>
          <div className="flex items-center gap-3 text-sm text-navy/60">
            <Layers className="size-4" />
            <span className="font-semibold">{results.length} {results.length === 1 ? 'caso' : 'casos'} en el mapa</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border-2 border-navy/10 bg-white p-6 shadow-md space-y-6">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-navy/60" />
          <h2 className="font-display text-xl font-extrabold text-navy">Filtros</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-navy/70">Tipo de caso</span>
            <select
              className="h-12 w-full rounded-xl border-2 border-navy/10 bg-white px-4 text-sm font-medium text-navy shadow-sm outline-none transition focus:border-orange focus:ring-4 focus:ring-orange/20"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as typeof filters.type }))}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-navy/70">Especie</span>
            <select
              className="h-12 w-full rounded-xl border-2 border-navy/10 bg-white px-4 text-sm font-medium text-navy shadow-sm outline-none transition focus:border-orange focus:ring-4 focus:ring-orange/20"
              value={filters.species}
              onChange={(e) => setFilters((f) => ({ ...f, species: e.target.value }))}
            >
              {speciesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-navy/70">Provincia</span>
            <select
              className="h-12 w-full rounded-xl border-2 border-navy/10 bg-white px-4 text-sm font-medium text-navy shadow-sm outline-none transition focus:border-orange focus:ring-4 focus:ring-orange/20"
              value={filters.province}
              onChange={(e) => setFilters((f) => ({ ...f, province: e.target.value }))}
            >
              {provinceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Leyenda */}
        <div className="pt-4 border-t-2 border-navy/10">
          <p className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-3">Leyenda</p>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(TYPE_LABELS) as [string, string][]).map(([type, label]) => (
              <span 
                key={type} 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-transform hover:scale-105" 
                style={{ 
                  backgroundColor: `${TYPE_COLORS[type]}20`, 
                  color: TYPE_COLORS[type] 
                }}
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="overflow-hidden rounded-3xl border-2 border-navy/10 shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 bg-white p-12">
            <PawLoader size="lg" />
            <p className="font-display text-lg font-semibold text-navy">Cargando casos en el mapa...</p>
          </div>
        ) : (
          <MapContainer center={center} zoom={8} className="h-[70vh] w-full">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {results.map((publication) => (
              <ColoredMarker
                key={publication.id}
                position={[publication.approximateLat as number, publication.approximateLng as number]}
                color={TYPE_COLORS[publication.type] ?? '#ff8c42'}
              >
                <Popup>
                  <div className="space-y-3 py-2 min-w-50">
                    <div className="flex items-center gap-2">
                      <span 
                        className="size-4 rounded-full shrink-0" 
                        style={{ backgroundColor: TYPE_COLORS[publication.type] ?? '#ff8c42' }} 
                      />
                      <span className="font-bold text-navy text-sm">{TYPE_LABELS[publication.type] ?? publication.type}</span>
                    </div>
                    <p className="font-display text-lg font-extrabold text-navy">{publication.title}</p>
                    <p className="text-sm text-navy/70 flex items-center gap-1">
                      <MapPin className="size-3" />
                      {publication.zone ?? publication.municipality ?? publication.province}
                    </p>
                    {publication.species ? (
                      <p className="text-xs text-navy/60">
                        <span className="font-semibold">Especie:</span> {publication.species}
                      </p>
                    ) : null}
                    <Link 
                      className="inline-block font-semibold text-orange hover:text-orange-dark transition-colors text-sm" 
                      to={`/p/${publication.slug}`}
                    >
                      Ver caso completo →
                    </Link>
                  </div>
                </Popup>
              </ColoredMarker>
            ))}
          </MapContainer>
        )}
      </div>
      
      {/* Info adicional */}
      <div className="rounded-2xl border-2 border-turquoise/20 bg-turquoise/5 p-6">
        <div className="flex gap-4">
          <div className="shrink-0">
            <div className="size-12 rounded-xl bg-turquoise/10 flex items-center justify-center">
              <PawPrint className="size-6 text-turquoise" />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-display text-lg font-bold text-navy">Privacidad protegida</h3>
            <p className="text-sm text-navy/70 leading-relaxed">
              Las ubicaciones mostradas en el mapa están difuminadas automáticamente (±350 metros aproximadamente). 
              Nunca revelamos direcciones exactas para proteger la privacidad de las personas y mascotas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MapPage;