import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { searchPublications, type PublicationSummary } from '../lib/supabase/publication-search';
import { TYPE_LABELS, TYPE_COLORS } from '../lib/constants/labels';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ColoredMarker({ position, color, children }: { position: [number, number]; color: string; children: React.ReactNode }) {
  const icon = useMemo(() => L.divIcon({
    className: 'custom-marker',
    html: `<div style="width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
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
          setResults(data.filter((p) => p.approximateLat !== null && p.approximateLng !== null));
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
    <section className="space-y-6 py-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--color-muted)">Mapa</p>
        <h1 className="font-display text-4xl font-semibold text-(--color-text)">Casos aproximados en el mapa</h1>
        <p className="text-(--color-muted)">Mostramos ubicaciones difuminadas para proteger privacidad y aun así ayudar a encontrar contexto geográfico.</p>
      </div>

      <div className="soft-panel rounded-4xl p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm font-semibold text-(--color-text)">
            <span>Tipo de caso</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as typeof filters.type }))}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-(--color-text)">
            <span>Especie</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              value={filters.species}
              onChange={(e) => setFilters((f) => ({ ...f, species: e.target.value }))}
            >
              {speciesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-(--color-text)">
            <span>Provincia</span>
            <select
              className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-sm font-medium text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
              value={filters.province}
              onChange={(e) => setFilters((f) => ({ ...f, province: e.target.value }))}
            >
              {provinceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.entries(TYPE_LABELS) as [string, string][]).map(([type, label]) => (
            <span key={type} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${TYPE_COLORS[type]}20`, color: TYPE_COLORS[type] }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-4xl border border-black/5 shadow-(--shadow-soft)">
        {loading ? (
          <div className="soft-panel rounded-none p-8">Cargando mapa...</div>
        ) : (
          <MapContainer center={center} zoom={8} className="h-[70vh] w-full">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {results.map((publication) => (
              <ColoredMarker
                key={publication.id}
                position={[publication.approximateLat as number, publication.approximateLng as number]}
                color={TYPE_COLORS[publication.type] ?? '#FF6B35'}
              >
                <Popup>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[publication.type] ?? '#FF6B35' }} />
                      <span className="font-bold text-(--color-text)">{TYPE_LABELS[publication.type] ?? publication.type}</span>
                    </div>
                    <p className="font-semibold text-(--color-text)">{publication.title}</p>
                    <p>{publication.zone ?? publication.municipality ?? publication.province}</p>
                    <p className="text-xs text-(--color-muted)">{publication.species ? `Especie: ${publication.species}` : ''}</p>
                    <Link className="font-semibold text-(--color-primary) hover:underline" to={`/p/${publication.slug}`}>
                      Ver publicación
                    </Link>
                  </div>
                </Popup>
              </ColoredMarker>
            ))}
          </MapContainer>
        )}
      </div>
    </section>
  );
}

export default MapPage;