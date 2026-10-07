import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Icon, type LatLngExpression } from 'leaflet';
import { MapPin, Filter, X, Layers, PawPrint } from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/ui/status-badge';
import { searchPublications, type PublicationSummary } from '../lib/supabase/publication-search';
import { TYPE_LABELS, SPECIES_LABELS } from '../lib/constants/labels';
import { setPageMeta } from '../lib/seo/page-meta';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet en Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Iconos personalizados por tipo - forma de patita
const createCustomIcon = (type: PublicationSummary['type']) => {
  const colors: Record<PublicationSummary['type'], string> = {
    LOST: '#E63946',
    FOUND: '#38C9A3',
    ABANDONED: '#6B6585',
    ADOPTION: '#9B51E0',
    SIGHTING: '#FF9E00',
  };

  const svgIcon = `
    <svg width="40" height="45" viewBox="0 0 40 45" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${type}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      
      <!-- Huella de patita -->
      <g filter="url(#shadow-${type})">
        <!-- 4 dedos -->
        <ellipse cx="12" cy="13" rx="3.5" ry="5" transform="rotate(-20 12 13)" fill="${colors[type]}" stroke="#231942" stroke-width="1.5"/>
        <ellipse cx="18" cy="9" rx="3.5" ry="5" transform="rotate(-8 18 9)" fill="${colors[type]}" stroke="#231942" stroke-width="1.5"/>
        <ellipse cx="25" cy="9" rx="3.5" ry="5" transform="rotate(8 25 9)" fill="${colors[type]}" stroke="#231942" stroke-width="1.5"/>
        <ellipse cx="31" cy="13" rx="3.5" ry="5" transform="rotate(20 31 13)" fill="${colors[type]}" stroke="#231942" stroke-width="1.5"/>
        
        <!-- Almohadilla principal -->
        <path d="M 20 40 C 20 40 10 32 10 24 C 10 18 14 14 20 14 C 26 14 30 18 30 24 C 30 32 20 40 20 40 Z" 
              fill="${colors[type]}" 
              stroke="#231942" 
              stroke-width="1.5"/>
        
        <!-- Badge con tipo -->
        <circle cx="20" cy="25" r="6" fill="white" opacity="0.95"/>
        <text x="20" y="28.5" text-anchor="middle" font-size="9" font-weight="bold" fill="#231942">
          ${type === 'LOST' ? '?' : type === 'FOUND' ? '!' : type === 'ADOPTION' ? '♥' : type === 'SIGHTING' ? '👁' : '📍'}
        </text>
      </g>
    </svg>
  `;

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgIcon)}`,
    iconSize: [40, 45],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Componente para recentrar el mapa
function MapRecenter({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function MapPage() {
  const [publications, setPublications] = useState<PublicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'ALL' as PublicationSummary['type'] | 'ALL',
    species: '',
  });

  // Centro de Cuba (La Habana)
  const defaultCenter: LatLngExpression = [23.1136, -82.3666];
  const mapCenter = defaultCenter;

  useEffect(() => {
    setPageMeta({
      title: 'Mapa de casos — Patitas',
      description: 'Visualiza en el mapa todas las mascotas perdidas, encontradas y en adopción cerca de ti.',
      canonicalPath: '/mapa',
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const searchFilters: {
          type?: PublicationSummary['type'] | 'ALL';
          species?: string;
          status: 'ACTIVE';
          limit: number;
        } = {
          status: 'ACTIVE',
          limit: 500, // Más publicaciones para el mapa
        };

        if (filters.type !== 'ALL') {
          searchFilters.type = filters.type;
        }

        if (filters.species) {
          searchFilters.species = filters.species;
        }

        const data = await searchPublications(searchFilters);

        // Filtrar solo publicaciones con coordenadas
        const withCoords = data.filter(
          (pub: PublicationSummary) => pub.approximateLat !== null && pub.approximateLng !== null
        );

        if (active) {
          setPublications(withCoords);
        }
      } catch (error) {
        console.error('Error loading map data:', error);
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
  }, [filters]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'ALL',
      species: '',
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== 'ALL' && key !== 'status'
  ).length;

  const stats = useMemo(() => {
    return {
      total: publications.length,
      lost: publications.filter((p) => p.type === 'LOST').length,
      found: publications.filter((p) => p.type === 'FOUND').length,
      adoption: publications.filter((p) => p.type === 'ADOPTION').length,
      sighting: publications.filter((p) => p.type === 'SIGHTING').length,
    };
  }, [publications]);

  return (
    <section className="space-y-6 py-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-turquoise/10 via-cream to-purple/10 border-2 border-navy/10 p-8 shadow-md">
        <div className="blob-decoration absolute top-5 right-5 size-24 bg-orange/20" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="size-5 text-turquoise" />
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60">Geolocalización</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-navy mb-2">Mapa de casos</h1>
          <p className="text-navy/70 max-w-2xl">
            Visualiza todas las mascotas cerca de ti. Las coordenadas son aproximadas para proteger la privacidad.
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border-2 border-navy/10 bg-white p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-navy">{stats.total}</p>
          <p className="text-xs font-medium text-navy/60">Total</p>
        </div>
        <div className="rounded-2xl border-2 border-lost/20 bg-lost/5 p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-lost">{stats.lost}</p>
          <p className="text-xs font-medium text-navy/60">Perdidas</p>
        </div>
        <div className="rounded-2xl border-2 border-found/20 bg-found/5 p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-found">{stats.found}</p>
          <p className="text-xs font-medium text-navy/60">Encontradas</p>
        </div>
        <div className="rounded-2xl border-2 border-purple/20 bg-purple/5 p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-purple">{stats.adoption}</p>
          <p className="text-xs font-medium text-navy/60">Adopción</p>
        </div>
        <div className="rounded-2xl border-2 border-orange/20 bg-orange/5 p-4 text-center">
          <p className="font-display text-2xl font-extrabold text-orange">{stats.sighting}</p>
          <p className="text-xs font-medium text-navy/60">Avistamientos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border-2 border-navy/10 bg-white p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-navy/60" />
            <h2 className="font-display text-lg font-bold text-navy">Filtros</h2>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-orange text-white text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="text-sm gap-1">
                <X className="size-4" />
                Limpiar
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Layers className="size-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-up">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-navy">Tipo</span>
              <select
                className="h-11 w-full rounded-xl border-2 border-navy/10 bg-white px-4 text-sm font-medium text-navy shadow-sm outline-none transition hover:border-navy/20 focus:border-orange focus:ring-4 focus:ring-orange/20"
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
              >
                <option value="ALL">Todos</option>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-navy">Especie</span>
              <select
                className="h-11 w-full rounded-xl border-2 border-navy/10 bg-white px-4 text-sm font-medium text-navy shadow-sm outline-none transition hover:border-navy/20 focus:border-orange focus:ring-4 focus:ring-orange/20"
                value={filters.species}
                onChange={(e) => updateFilter('species', e.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(SPECIES_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-navy/10 shadow-lg">
        {loading ? (
          <div className="flex h-[600px] items-center justify-center bg-navy/5">
            <div className="text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-navy/20 border-t-orange"></div>
              <p className="text-sm font-semibold text-navy/70">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={7}
            className="h-[600px] w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter center={mapCenter} />

            <MarkerClusterGroup chunkedLoading>
              {publications.map((pub) => {
                if (!pub.approximateLat || !pub.approximateLng) return null;

                return (
                  <Marker
                    key={pub.id}
                    position={[pub.approximateLat, pub.approximateLng]}
                    icon={createCustomIcon(pub.type)}
                  >
                    <Popup maxWidth={300} className="custom-popup">
                      <div className="space-y-3 p-2">
                        <StatusBadge status={pub.type} />
                        <h3 className="font-display text-lg font-bold text-navy">
                          {pub.title}
                        </h3>
                        {pub.coverImageUrl && (
                          <img
                            src={pub.coverImageUrl}
                            alt={pub.title}
                            className="w-full h-32 object-cover rounded-xl"
                          />
                        )}
                        <p className="text-sm text-navy/70 line-clamp-2">
                          {pub.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {pub.species && (
                            <span className="rounded-full bg-turquoise/10 border border-turquoise/20 px-2 py-1 font-medium text-turquoise-dark">
                              {pub.species}
                            </span>
                          )}
                          {pub.color && (
                            <span className="rounded-full bg-purple/10 border border-purple/20 px-2 py-1 font-medium text-purple-dark">
                              {pub.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-navy/60">
                          📍 {[pub.zone, pub.municipality, pub.province].filter(Boolean).join(', ')}
                        </p>
                        <Link to={`/p/${pub.slug}`}>
                          <Button variant="primary" className="w-full text-sm">
                            Ver detalles →
                          </Button>
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        )}
      </div>

      {/* Leyenda */}
      <div className="rounded-2xl border-2 border-navy/10 bg-white p-6 shadow-md">
        <h3 className="font-display text-lg font-bold text-navy mb-4">Leyenda del mapa</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex items-center gap-3">
            <PawPrint className="size-8 text-lost fill-lost/20" />
            <span className="text-sm font-medium text-navy">Perdida</span>
          </div>
          <div className="flex items-center gap-3">
            <PawPrint className="size-8 text-found fill-found/20" />
            <span className="text-sm font-medium text-navy">Encontrada</span>
          </div>
          <div className="flex items-center gap-3">
            <PawPrint className="size-8 text-purple fill-purple/20" />
            <span className="text-sm font-medium text-navy">Adopción</span>
          </div>
          <div className="flex items-center gap-3">
            <PawPrint className="size-8 text-orange fill-orange/20" />
            <span className="text-sm font-medium text-navy">Avistamiento</span>
          </div>
          <div className="flex items-center gap-3">
            <PawPrint className="size-8 text-navy/60 fill-navy/10" />
            <span className="text-sm font-medium text-navy">Abandonada</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-navy/60 leading-relaxed">
          🐾 Cada huella representa un caso. Las ubicaciones son aproximadas (±500m) para proteger la privacidad. Los grupos de huellas representan múltiples casos en la misma zona.
        </p>
      </div>
    </section>
  );
}

export default MapPage;
