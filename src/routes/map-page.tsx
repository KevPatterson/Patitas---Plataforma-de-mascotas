import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { searchPublications, type PublicationSummary } from '../lib/supabase/publication-search';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function MapPage() {
  const [results, setResults] = useState<PublicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const data = await searchPublications({ status: 'ACTIVE' });

      if (active) {
        setResults(data.filter((publication) => publication.approximateLat !== null && publication.approximateLng !== null));
        setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const center = useMemo(() => [23.1136, -82.3666] as [number, number], []);

  return (
    <section className="space-y-6 py-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--color-muted)">Mapa</p>
        <h1 className="font-display text-4xl font-semibold text-(--color-text)">Casos aproximados en el mapa</h1>
        <p className="text-(--color-muted)">Mostramos ubicaciones difuminadas para proteger privacidad y aun así ayudar a encontrar contexto geográfico.</p>
      </div>

      <div className="overflow-hidden rounded-4xl border border-black/5 shadow-(--shadow-soft)">
        {loading ? (
          <div className="soft-panel rounded-none p-8">Cargando mapa...</div>
        ) : (
          <MapContainer center={center} zoom={8} className="h-[70vh] w-full">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {results.map((publication) => (
              <Marker key={publication.id} position={[publication.approximateLat as number, publication.approximateLng as number]}>
                <Popup>
                  <div className="space-y-2 text-sm">
                    <p className="font-bold text-(--color-text)">{publication.title}</p>
                    <p>{publication.zone ?? publication.municipality ?? publication.province}</p>
                    <Link className="font-semibold text-(--color-primary) hover:underline" to={`/p/${publication.slug}`}>
                      Ver publicación
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </section>
  );
}