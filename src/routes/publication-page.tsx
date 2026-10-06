import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Calendar, CheckCircle, MapPin, PawPrint, X, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TextareaField } from '../components/ui/textarea-field';
import { StatusBadge } from '../components/ui/status-badge';
import { Logo } from '../components/Logo';
import { createReport } from '../lib/supabase/reports';
import { useAuth } from '../app/auth-context';
import { getPublicationBySlug, searchPublications } from '../lib/supabase/publication-search';
import { setPageMeta } from '../lib/seo/page-meta';
import { ShareMenu } from '../components/publications/share-menu';
import { ResolvedCelebration } from '../components/publications/resolved-celebration';
import { SightingForm } from '../components/publications/sighting-form';
import { SightingsTimeline } from '../components/publications/sightings-timeline';
import { CommentsSection } from '../components/publications/comments-section';
import { resolvePublication, getSightings } from '../lib/supabase/publication-actions';
import { findMatches } from '../lib/matching/match-calculator';
import { createAdoptionRequest } from '../lib/supabase/adoption-requests';
import { generateLostPetStructuredData, injectStructuredData, removeStructuredData } from '../lib/seo/structured-data';
export function PublicationPage() {
  const { user } = useAuth();
  const { slug } = useParams();
  const [publication, setPublication] = useState<Awaited<ReturnType<typeof getPublicationBySlug>> | null>(null);
  const [sightings, setSightings] = useState<Awaited<ReturnType<typeof getSightings>>>([]);
  const [matches, setMatches] = useState<Array<{ publicationId: string; score: number; reasons: string[]; publication: { slug: string; title: string; coverImageUrl: string | null } }>>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<'FALSE_INFO' | 'SPAM' | 'SCAM' | 'DUPLICATE' | 'REUNITED' | 'INAPPROPRIATE' | 'OTHER'>('FALSE_INFO');
  const [reportDescription, setReportDescription] = useState('');
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [showAdoptForm, setShowAdoptForm] = useState(false);
  const [adoptMessage, setAdoptMessage] = useState('');
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);
  const [adoptSuccess, setAdoptSuccess] = useState(false);
  const loadSightings = async () => {
    if (!publication) return;
    const data = await getSightings(publication.id);
    setSightings(data);
  };

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug) return;

      const data = await getPublicationBySlug(slug);

      if (active) {
        setPublication(data);
        setLoading(false);
      }

      if (data) {
        // Cargar avistamientos
        const sightingsData = await getSightings(data.id);
        if (active) {
          setSightings(sightingsData);
        }

        // Calcular coincidencias solo para publicaciones LOST o FOUND
        if (data.type === 'LOST' || data.type === 'FOUND') {
          const oppositeType = data.type === 'LOST' ? 'FOUND' : 'LOST';
          const candidates = await searchPublications({ type: oppositeType, status: 'ACTIVE' });

          const targetPub = {
            id: data.id,
            species: data.species,
            color: data.color,
            size: data.size,
            sex: data.sex,
            province: data.location?.[0]?.province ?? '',
            municipality: data.location?.[0]?.municipality ?? '',
            event_date: data.event_date,
          };

          const candidatePubs = candidates.map((c) => ({
            id: c.id,
            species: c.species,
            color: c.color,
            size: c.size,
            sex: c.sex,
            province: c.province ?? '',
            municipality: c.municipality ?? '',
            event_date: null as string | null,
          }));

          const matchResults = findMatches(targetPub, candidatePubs);

          const enrichedMatches = matchResults.slice(0, 3).map((match) => {
            const candidate = candidates.find((c) => c.id === match.publicationId)!;
            return {
              ...match,
              publication: {
                slug: candidate.slug,
                title: candidate.title,
                coverImageUrl: candidate.coverImageUrl,
              },
            };
          });

          if (active) {
            setMatches(enrichedMatches);
          }
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [slug]);

  const coverImage = useMemo(() => publication?.publication_images?.find((image) => image.is_cover) ?? publication?.publication_images?.[0] ?? null, [publication]);
  const coverImagePath = coverImage?.storage_path ?? null;

  useEffect(() => {
    if (!publication) return;

    const image = coverImagePath
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pet-images/${coverImagePath}`
      : undefined;

    setPageMeta({
      title: `${publication.title} · Patitas`,
      description: publication.description.slice(0, 155),
      canonicalPath: `/p/${publication.slug}`,
      image,
    });

    // Agregar structured data para publicaciones perdidas/encontradas
    if ((publication.type === 'LOST' || publication.type === 'FOUND') && image) {
      const structuredData = generateLostPetStructuredData({
        name: publication.title,
        description: publication.description,
        image,
        species: publication.species,
        location: {
          municipality: publication.location?.[0]?.municipality ?? '',
          province: publication.location?.[0]?.province ?? '',
        },
        datePosted: publication.published_at,
        url: `${window.location.origin}/p/${publication.slug}`,
      });
      injectStructuredData(structuredData, 'publication-structured-data');
    }

    return () => {
      removeStructuredData('publication-structured-data');
    };
  }, [coverImagePath, publication]);

  const submitReport = async () => {
    if (!publication) return;

    setReportMessage(null);

    try {
      await createReport({
        publicationId: publication.id,
        reporterId: user?.id ?? null,
        reason: reportReason,
        description: reportDescription,
      });
      setReportMessage('Reporte enviado. Gracias por ayudar a cuidar la calidad de Patitas.');
      setReportDescription('');
      setReportReason('FALSE_INFO');
      setShowReportForm(false);
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'No pudimos enviar el reporte.');
    }
  };

  const handleResolve = async () => {
    if (!publication || !user) return;

    setResolving(true);

    try {
      await resolvePublication(publication.id, user.id);
      // Recargar publicación
      const updated = await getPublicationBySlug(publication.slug);
      setPublication(updated);
    } catch (error) {
      console.error('Error resolving publication:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleAdoptRequest = async () => {
    if (!publication || !user) return;

    setAdoptLoading(true);
    setAdoptError(null);
    setAdoptSuccess(false);

    try {
      await createAdoptionRequest(publication.id, adoptMessage.trim());
      setAdoptSuccess(true);
      setAdoptMessage('');
      setShowAdoptForm(false);
    } catch (error) {
      setAdoptError(error instanceof Error ? error.message : 'No pudimos enviar la solicitud.');
    } finally {
      setAdoptLoading(false);
    }
  };

  const isOwner = user && publication && publication.owner_profile_id === user.id;

  return (
    <section className="space-y-6 py-8">
      {loading ? (
        <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 text-[#0B3B3C]">Cargando publicación...</div>
      ) : publication ? (
        <div className="space-y-6">
          {/* Celebración si está resuelta */}
          {publication.status === 'RESOLVED' ? (
            <ResolvedCelebration petName={publication.title.split(' ')[0]} />
          ) : null}

          <article className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Columna principal */}
            <div className="space-y-6">
              {/* Galería */}
              <div className="overflow-hidden rounded-[24px] border-2 border-[#CFEFE6] bg-white">
                {coverImage?.storage_path ? (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pet-images/${coverImage.storage_path}`}
                    alt={coverImage.alt_text ?? publication.title}
                    className="h-96 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-96 items-center justify-center bg-[#CFEFE6]/40 text-[#0B3B3C]/30">
                    <PawPrint size={64} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Información principal */}
              <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 space-y-4">
                <div>
                  <StatusBadge status={publication.type} />
                  <h1 className="mt-3 font-display text-4xl font-semibold text-[#0B3B3C]">{publication.title}</h1>
                </div>
                <p className="leading-7 text-[#0B3B3C]">{publication.description}</p>

                {/* Características */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {publication.species ? (
                    <div className="rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3B3C]/60">Especie</p>
                      <p className="mt-1 font-semibold text-[#0B3B3C]">{publication.species}</p>
                    </div>
                  ) : null}
                  {publication.breed ? (
                    <div className="rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3B3C]/60">Raza</p>
                      <p className="mt-1 font-semibold text-[#0B3B3C]">{publication.breed}</p>
                    </div>
                  ) : null}
                  {publication.color ? (
                    <div className="rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3B3C]/60">Color</p>
                      <p className="mt-1 font-semibold text-[#0B3B3C]">{publication.color}</p>
                    </div>
                  ) : null}
                  {publication.size ? (
                    <div className="rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3B3C]/60">Tamaño</p>
                      <p className="mt-1 font-semibold text-[#0B3B3C]">{publication.size}</p>
                    </div>
                  ) : null}
                  {publication.sex ? (
                    <div className="rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3B3C]/60">Sexo</p>
                      <p className="mt-1 font-semibold text-[#0B3B3C]">{publication.sex}</p>
                    </div>
                  ) : null}
                  {publication.age_approx ? (
                    <div className="rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3B3C]/60">Edad aprox.</p>
                      <p className="mt-1 font-semibold text-[#0B3B3C]">{publication.age_approx}</p>
                    </div>
                  ) : null}
                </div>

                {publication.characteristics ? (
                  <div className="rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#0B3B3C]/60">Características</p>
                    <p className="mt-2 leading-7 text-[#0B3B3C]">{publication.characteristics}</p>
                  </div>
                ) : null}
              </div>

              {/* Coincidencias */}
              {matches.length > 0 ? (
                <div className="space-y-4 rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-[#0B3B3C]">Posibles coincidencias</h3>
                    <p className="mt-2 text-sm text-[#0B3B3C]/60">
                      Encontramos casos con características similares. Revísalos para verificar si coinciden.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <Link
                        key={match.publicationId}
                        to={`/p/${match.publication.slug}`}
                        className="block overflow-hidden rounded-[16px] border border-[#CFEFE6] bg-[#F5FBF9] transition hover:-translate-y-0.5"
                      >
                        <div className="flex gap-4 p-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[16px] bg-[#CFEFE6]/40">
                            {match.publication.coverImageUrl ? (
                              <img src={match.publication.coverImageUrl} alt={match.publication.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[#0B3B3C]/30">
                                <PawPrint size={28} strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-semibold text-[#0B3B3C]">{match.publication.title}</p>
                              <div className="shrink-0 rounded-full bg-[#FF6B35] px-3 py-1 text-xs font-bold text-white">
                                {match.score}%
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {match.reasons.slice(0, 3).map((reason, index) => (
                                <span key={index} className="rounded-full bg-[#CFEFE6] px-2 py-1 text-xs font-medium text-[#0B3B3C]">
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs italic text-[#0B3B3C]/60">
                    Esta coincidencia es automática y puede no ser exacta. Verifica los detalles antes de contactar.
                  </p>
                </div>
              ) : null}

              {/* Avistamientos */}
              {publication.type === 'LOST' && publication.status === 'ACTIVE' ? (
                <SightingForm publicationId={publication.id} userId={user?.id ?? null} onSuccess={loadSightings} />
              ) : null}

              {sightings.length > 0 ? <SightingsTimeline sightings={sightings} /> : null}

              {/* Comentarios */}
              <CommentsSection publicationId={publication.id} currentUserId={user?.id ?? null} />
            </div>

            {/* Columna lateral */}
            <aside className="space-y-5">
              {/* Detalles */}
              <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 space-y-3">
                <h2 className="font-display text-2xl font-semibold text-[#0B3B3C]">Ubicación</h2>
                <p className="flex items-center gap-2 text-sm text-[#0B3B3C]/70">
                  <MapPin size={16} className="shrink-0 text-[#0B3B3C]/50" />
                  {[publication.location?.[0]?.zone, publication.location?.[0]?.municipality, publication.location?.[0]?.province].filter(Boolean).join(', ')}
                </p>
                {publication.event_date ? (
                  <p className="flex items-center gap-2 text-sm text-[#0B3B3C]/70">
                    <Calendar size={16} className="shrink-0 text-[#0B3B3C]/50" />
                    {new Intl.DateTimeFormat('es-CU', { dateStyle: 'long' }).format(new Date(publication.event_date))}
                  </p>
                ) : null}
                <Link className="inline-block text-sm font-semibold text-[#0E7C66] hover:underline" to="/mapa">
                  Ver en mapa
                </Link>
              </div>

              {/* Acciones */}
              <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 space-y-3">
                <h2 className="font-display text-2xl font-semibold text-[#0B3B3C]">Acciones</h2>
                <div className="flex flex-col gap-3">
                  {isOwner && publication.status === 'ACTIVE' ? (
                    <Button type="button" onClick={handleResolve} disabled={resolving} className="gap-2">
                      <CheckCircle size={16} />
                      {resolving ? 'Resolviendo...' : 'Marcar como resuelto'}
                    </Button>
                  ) : null}
                  
                  {publication.type === 'ADOPTION' && publication.status === 'ACTIVE' && user && !isOwner ? (
                    !showAdoptForm ? (
                      <Button type="button" variant="secondary" onClick={() => setShowAdoptForm(true)} className="gap-2">
                        <Heart size={16} />
                        Solicitar adopción
                      </Button>
                    ) : (
                      <div className="space-y-3 p-4 bg-[#F5FBF9] rounded-[16px]">
                        <h3 className="font-semibold text-[#0B3B3C]">Solicitar adopción</h3>
                        <p className="text-sm text-[#0B3B3C]/70">Cuéntale al por qué quieres adoptar a esta mascota.</p>
                        <TextareaField
                          label="Mensaje"
                          placeholder="Hola, me gustaría adoptar a esta mascota porque..."
                          value={adoptMessage}
                          onChange={(event) => setAdoptMessage(event.target.value)}
                        />
                        {adoptError ? (
                          <p className="rounded-[16px] bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-[#C2332C]">{adoptError}</p>
                        ) : null}
                        {adoptSuccess ? (
                          <p className="rounded-[16px] bg-[rgba(46,139,87,0.12)] px-4 py-3 text-sm font-medium text-[#0E7C66]">Solicitud enviada. El propietario recibirá una notificación.</p>
                        ) : null}
                        <div className="flex gap-3">
                          <Button type="button" onClick={handleAdoptRequest} disabled={adoptLoading}>{adoptLoading ? 'Enviando...' : 'Enviar solicitud'}</Button>
                          <Button type="button" variant="ghost" onClick={() => { setShowAdoptForm(false); setAdoptMessage(''); setAdoptError(null); setAdoptSuccess(false); }}>Cancelar</Button>
                        </div>
                      </div>
                    )
                  ) : null}
                  
                  <ShareMenu
                    publication={{
                      title: publication.title,
                      type: publication.type,
                      location: [publication.location?.[0]?.municipality, publication.location?.[0]?.province].filter(Boolean).join(', '),
                      slug: publication.slug,
                    }}
                  />

                  {!showReportForm ? (
                    <Button type="button" variant="ghost" onClick={() => setShowReportForm(true)} className="gap-2">
                      <AlertTriangle size={16} />
                      Reportar
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Formulario de reporte */}
              {showReportForm ? (
                <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-semibold text-[#0B3B3C]">Reportar</h2>
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B3B3C]/60 hover:text-[#0B3B3C]"
                    >
                      <X size={16} />
                      Cerrar
                    </button>
                  </div>
                  <label className="space-y-2 text-sm font-semibold text-[#0B3B3C]">
                    <span>Motivo</span>
                    <select
                      className="h-12 w-full rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4"
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value as typeof reportReason)}
                    >
                      <option value="FALSE_INFO">Información falsa</option>
                      <option value="SPAM">Spam</option>
                      <option value="SCAM">Estafa</option>
                      <option value="DUPLICATE">Duplicado</option>
                      <option value="REUNITED">Mascota recuperada</option>
                      <option value="INAPPROPRIATE">Contenido inapropiado</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </label>
                  <TextareaField
                    label="Descripción (opcional)"
                    placeholder="Cuéntanos el contexto del reporte."
                    value={reportDescription}
                    onChange={(event) => setReportDescription(event.target.value)}
                  />
                  {reportMessage ? (
                    <p
                      className={`rounded-[16px] px-4 py-3 text-sm font-medium ${
                        reportMessage.includes('Gracias') || reportMessage.includes('enviado')
                          ? 'bg-[#0E7C66]/10 text-[#0E7C66]'
                          : 'bg-[#C2332C]/10 text-[#C2332C]'
                      }`}
                    >
                      {reportMessage}
                    </p>
                  ) : null}
                  <Button type="button" onClick={submitReport}>
                    Enviar reporte
                  </Button>
                </div>
              ) : null}

              {/* Información del publicador */}
              <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-6 space-y-3">
                <h2 className="font-display text-xl font-semibold text-[#0B3B3C]">Publicado por</h2>
                <p className="text-sm font-semibold text-[#0B3B3C]">@{publication.owner?.username ?? 'Usuario'}</p>
                <p className="text-xs text-[#0B3B3C]/60">
                  {new Intl.DateTimeFormat('es-CU', { dateStyle: 'long' }).format(new Date(publication.published_at))}
                </p>
              </div>
            </aside>
          </article>
        </div>
      ) : (
        <div className="rounded-[24px] border-2 border-[#CFEFE6] bg-white p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Logo size={48} />
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-[#0B3B3C]">No encontramos esta publicación</h2>
              <p className="text-sm text-[#0B3B3C]/60">Es posible que haya sido eliminada o que el enlace no sea correcto.</p>
            </div>
            <Link to="/">
              <Button>Volver al inicio</Button>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}