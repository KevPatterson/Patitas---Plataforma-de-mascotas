import { useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../app/auth-context';
import { Button, LinkButton } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { TextareaField } from '../components/ui/textarea-field';
import { createLocation, createPublication, uploadPublicationImages, createPet } from '../lib/supabase/publications';
import { buildPublicationSlug } from '../lib/utils/slug';
import { publicationFormSchema, type PublicationFormValues } from '../lib/validations/publication';
import { TYPE_LABELS, SPECIES_LABELS, SEX_LABELS, SIZE_LABELS, MAX_IMAGES, MAX_IMAGE_BYTES, ALLOWED_IMAGE_TYPES } from '../lib/constants/labels';
import { CUBA, PROVINCES } from '../lib/constants/cuba';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onChange }: { onChange: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const fuzzLat = lat + (Math.random() - 0.5) * 0.04;
      const fuzzLng = lng + (Math.random() - 0.5) * 0.04;
      onChange(fuzzLat.toFixed(6), fuzzLng.toFixed(6));
    },
  });
  return null;
}

export function PublishPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [values, setValues] = useState<PublicationFormValues>({
    type: 'LOST',
    title: '',
    description: '',
    species: '',
    breed: '',
    sex: '',
    size: '',
    ageApprox: '',
    color: '',
    characteristics: '',
    collar: false,
    plate: false,
    reward: '',
    contactMode: 'INTERNAL',
    contactPhone: '',
    contactWhatsapp: '',
    contactEmail: '',
    microchip: '',
    province: '',
    municipality: '',
    zone: '',
    approximateLat: '',
    approximateLng: '',
    eventDate: '',
    eventTimeApprox: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const municipalities = useMemo(() => values.province ? CUBA[values.province as keyof typeof CUBA] ?? [] : [], [values.province]);

  const stepTitle = useMemo(() => {
    if (step === 1) return '¿Qué quieres publicar?';
    if (step === 2) return 'Información de la mascota';
    if (step === 3) return 'Fecha y ubicación';
    if (step === 4) return 'Fotos';
    return 'Contacto y vista previa';
  }, [step]);

  const totalSteps = 5;

  const updateValue = <K extends keyof PublicationFormValues>(key: K, value: PublicationFormValues[K]) => {
    if (key === 'province') {
      setValues((current) => ({ ...current, [key]: value, municipality: '' }));
    } else {
      setValues((current) => ({ ...current, [key]: value }));
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files ?? []).slice(0, MAX_IMAGES - files.length);
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of newFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
        setErrorMessage(`Formato no permitido: ${file.name}. Usa JPG, PNG o WebP.`);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setErrorMessage(`${file.name}: excede 8 MB.`);
        return;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...previews]);
    setErrorMessage(null);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep((current) => current + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep((current) => current - 1);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const parsed = publicationFormSchema.parse(values);
      const slug = buildPublicationSlug(parsed.title);

      const locationId = await createLocation({
        province: parsed.province,
        municipality: parsed.municipality,
        zone: parsed.zone,
        approximateLat: parsed.approximateLat,
        approximateLng: parsed.approximateLng,
      });

      const petId = await createPet({
        ownerProfileId: user?.id ?? '',
        species: parsed.species,
        breed: parsed.breed,
        sex: parsed.sex,
        size: parsed.size,
        ageApprox: parsed.ageApprox,
        color: parsed.color,
        characteristics: parsed.characteristics,
        collar: parsed.collar,
        plate: parsed.plate,
        microchip: parsed.microchip,
      });

      const publication = await createPublication({
        ownerProfileId: user?.id ?? '',
        slug,
        locationId,
        petId,
        type: parsed.type,
        title: parsed.title,
        description: parsed.description,
        species: parsed.species,
        breed: parsed.breed,
        sex: parsed.sex,
        size: parsed.size,
        ageApprox: parsed.ageApprox,
        color: parsed.color,
        characteristics: parsed.characteristics,
        collar: parsed.collar,
        plate: parsed.plate,
        reward: parsed.reward,
        contactMode: parsed.contactMode,
        contactPhone: parsed.contactPhone,
        contactWhatsapp: parsed.contactWhatsapp,
        contactEmail: parsed.contactEmail,
        eventDate: parsed.eventDate,
        eventTimeApprox: parsed.eventTimeApprox,
      });

      if (files.length > 0) {
        await uploadPublicationImages(publication.id, files);
      }

      setSuccessSlug(slug);
      navigate(`/p/${slug}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos publicar el caso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 py-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-(--color-muted)">Crear publicación</p>
        <h1 className="font-display text-4xl font-semibold text-(--color-text)">{stepTitle}</h1>
        <p className="max-w-2xl text-(--color-muted)">
          El wizard guía la publicación en pasos cortos para que el caso quede estructurado y fácil de buscar.
        </p>
      </div>

      {loading ? (
        <div className="soft-panel rounded-4xl p-6">Cargando sesión...</div>
      ) : user ? (
        <div className="soft-panel rounded-4xl p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 text-sm font-semibold text-(--color-muted)">
            <span>Paso {step} de {totalSteps}</span>
            <span>{user.email}</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Pasos del wizard">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={[
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition',
                  s === step
                    ? 'bg-[#FF6B35] text-white'
                    : s < step
                    ? 'bg-[#0F3D33] text-white'
                    : 'bg-[#CFEFE6] text-[#0B3B3C]/60',
                ].join(' ')}
              >
                {s}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-(--color-text)">Tipo de caso</legend>
                <div className="grid gap-3 sm:grid-cols-5">
                  {(Object.entries(TYPE_LABELS) as [string, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateValue('type', value as PublicationFormValues['type'])}
                      className={[
                        'rounded-2xl border px-4 py-4 text-left transition',
                        values.type === value
                          ? 'border-(--color-primary) bg-[rgba(15,61,51,0.08)]'
                          : 'border-black/10 bg-white/80 hover:bg-white',
                      ].join(' ')}
                    >
                      <span className="block text-xs font-bold uppercase tracking-[0.2em] text-(--color-muted)">Tipo</span>
                      <span className="mt-2 block font-semibold text-(--color-text)">{label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <TextField
                label="Título"
                placeholder="Toby perdido en Playa"
                value={values.title}
                onChange={(event) => updateValue('title', event.target.value)}
              />
              <TextareaField
                label="Descripción breve"
                placeholder="Cuéntanos lo ocurrido, señales y contexto."
                value={values.description}
                onChange={(event) => updateValue('description', event.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-(--color-text)">Especie</span>
                  <select
                    className="w-full h-12 rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-base text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                    value={values.species}
                    onChange={(event) => updateValue('species', event.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {(Object.entries(SPECIES_LABELS) as [string, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="Raza"
                  placeholder="Caramelo"
                  value={values.breed ?? ''}
                  onChange={(event) => updateValue('breed', event.target.value)}
                />
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-(--color-text)">Sexo</span>
                  <select
                    className="w-full h-12 rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-base text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                    value={values.sex}
                    onChange={(event) => updateValue('sex', event.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {(Object.entries(SEX_LABELS) as [string, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-(--color-text)">Tamaño</span>
                  <select
                    className="w-full h-12 rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-base text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                    value={values.size}
                    onChange={(event) => updateValue('size', event.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {(Object.entries(SIZE_LABELS) as [string, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="Edad aproximada"
                  placeholder="2 años"
                  value={values.ageApprox ?? ''}
                  onChange={(event) => updateValue('ageApprox', event.target.value)}
                />
                <TextField
                  label="Color"
                  placeholder="Marrón y blanco"
                  value={values.color}
                  onChange={(event) => updateValue('color', event.target.value)}
                />
                <TextareaField
                  className="md:col-span-2"
                  label="Características"
                  placeholder="Marcas, cicatrices, comportamiento..."
                  value={values.characteristics ?? ''}
                  onChange={(event) => updateValue('characteristics', event.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-(--color-text)">
                  <input type="checkbox" checked={values.collar} onChange={(event) => updateValue('collar', event.target.checked)} />
                  Tiene collar
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-(--color-text)">
                  <input type="checkbox" checked={values.plate} onChange={(event) => updateValue('plate', event.target.checked)} />
                  Tiene placa
                </label>
              </div>

              <TextField
                label="Microchip (privado)"
                placeholder="Número de microchip si tiene"
                value={values.microchip ?? ''}
                onChange={(event) => updateValue('microchip', event.target.value)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-(--color-text)">Provincia</span>
                  <select
                    className="w-full h-12 rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-base text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                    value={values.province}
                    onChange={(event) => updateValue('province', event.target.value)}
                  >
                    <option value="">Selecciona provincia</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-(--color-text)">Municipio</span>
                  <select
                    className="w-full h-12 rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-base text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                    value={values.municipality}
                    onChange={(event) => updateValue('municipality', event.target.value)}
                    disabled={municipalities.length === 0}
                  >
                    <option value="">Selecciona municipio</option>
                    {municipalities.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="Zona / Referencia"
                  placeholder="Cerca del malecón"
                  value={values.zone ?? ''}
                  onChange={(event) => updateValue('zone', event.target.value)}
                />
                <TextField
                  label="Fecha del evento"
                  type="date"
                  value={values.eventDate ?? ''}
                  onChange={(event) => updateValue('eventDate', event.target.value)}
                />
                <TextField
                  label="Hora aproximada"
                  type="time"
                  value={values.eventTimeApprox ?? ''}
                  onChange={(event) => updateValue('eventTimeApprox', event.target.value)}
                />
                <TextField
                  label="Recompensa (opcional)"
                  placeholder="Ej. 500 CUP"
                  value={values.reward ?? ''}
                  onChange={(event) => updateValue('reward', event.target.value)}
                />
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-(--color-text)">Ubicación aproximada (click en el mapa)</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Latitud aprox."
                    placeholder="23.136"
                    value={values.approximateLat ?? ''}
                    onChange={(event) => updateValue('approximateLat', event.target.value)}
                    readOnly
                  />
                  <TextField
                    label="Longitud aprox."
                    placeholder="-82.430"
                    value={values.approximateLng ?? ''}
                    onChange={(event) => updateValue('approximateLng', event.target.value)}
                    readOnly
                  />
                </div>
                <div className="h-64 rounded-2xl border-2 border-[#CFEFE6] overflow-hidden">
                  <MapContainer center={[23.1136, -82.3666]} zoom={8} className="h-full w-full">
                    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {values.approximateLat && values.approximateLng && (
                      <Marker position={[parseFloat(values.approximateLat), parseFloat(values.approximateLng)]} />
                    )}
                    <LocationPicker
                      onChange={(lat, lng) => {
                        updateValue('approximateLat', lat);
                        updateValue('approximateLng', lng);
                      }}
                    />
                  </MapContainer>
                </div>
                <p className="text-xs text-(--color-muted)">Haz clic en el mapa para seleccionar. Las coordenadas se difuminan ±0.02° para privacidad.</p>
              </fieldset>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <label className="block space-y-2 text-sm font-semibold text-(--color-text)">
                <span>Imágenes (máx. {MAX_IMAGES}, JPG/PNG/WebP, 8 MB c/u)</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm" disabled={files.length >= MAX_IMAGES} />
                {files.length >= MAX_IMAGES && <span className="text-xs text-(--color-danger)">Límite de {MAX_IMAGES} imágenes alcanzado.</span>}
              </label>

              {filePreviews.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#CFEFE6]">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      {index === 0 && <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-1 text-xs font-bold">Portada</span>}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black/80 transition"
                        aria-label="Eliminar imagen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-sm font-semibold text-(--color-text)">Modo de contacto</span>
                  <select
                    className="w-full h-12 rounded-[16px] border-2 border-[#CFEFE6] bg-white px-4 text-base text-[#0B3B3C] shadow-sm outline-none transition focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/20"
                    value={values.contactMode}
                    onChange={(event) => updateValue('contactMode', event.target.value as PublicationFormValues['contactMode'])}
                  >
                    <option value="INTERNAL">Contacto interno (chat Patitas)</option>
                    <option value="PHONE">Mostrar teléfono</option>
                    <option value="WHATSAPP">Mostrar WhatsApp</option>
                    <option value="EMAIL">Mostrar email</option>
                  </select>
                </label>
                {values.contactMode === 'PHONE' && (
                  <TextField
                    label="Teléfono"
                    placeholder="+53..."
                    value={values.contactPhone ?? ''}
                    onChange={(event) => updateValue('contactPhone', event.target.value)}
                  />
                )}
                {values.contactMode === 'WHATSAPP' && (
                  <TextField
                    label="WhatsApp"
                    placeholder="+53..."
                    value={values.contactWhatsapp ?? ''}
                    onChange={(event) => updateValue('contactWhatsapp', event.target.value)}
                  />
                )}
                {values.contactMode === 'EMAIL' && (
                  <TextField
                    label="Email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={values.contactEmail ?? ''}
                    onChange={(event) => updateValue('contactEmail', event.target.value)}
                  />
                )}
              </div>

              <div className="rounded-2xl border border-dashed border-black/10 bg-white/50 p-4 space-y-3">
                <h3 className="font-semibold text-(--color-text)">Vista previa</h3>
                <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                  <dt className="text-(--color-muted)">Tipo</dt>
                  <dd className="font-semibold text-(--color-text)">{TYPE_LABELS[values.type] ?? values.type}</dd>
                  <dt className="text-(--color-muted)">Título</dt>
                  <dd className="font-semibold text-(--color-text)">{values.title || '—'}</dd>
                  <dt className="text-(--color-muted)">Especie</dt>
                  <dd>{(SPECIES_LABELS[values.species] ?? values.species) || '—'}</dd>
                  <dt className="text-(--color-muted)">Raza</dt>
                  <dd>{values.breed || '—'}</dd>
                  <dt className="text-(--color-muted)">Sexo</dt>
                  <dd>{values.sex ? (SEX_LABELS[values.sex] ?? values.sex) : '—'}</dd>
                  <dt className="text-(--color-muted)">Tamaño</dt>
                  <dd>{values.size ? (SIZE_LABELS[values.size] ?? values.size) : '—'}</dd>
                  <dt className="text-(--color-muted)">Edad</dt>
                  <dd>{values.ageApprox || '—'}</dd>
                  <dt className="text-(--color-muted)">Color</dt>
                  <dd>{values.color || '—'}</dd>
                  <dt className="text-(--color-muted)">Provincia / Municipio</dt>
                  <dd>{values.province} / {values.municipality || '—'}</dd>
                  <dt className="text-(--color-muted)">Zona</dt>
                  <dd>{values.zone || '—'}</dd>
                  <dt className="text-(--color-muted)">Contacto</dt>
                  <dd>
                    {values.contactMode === 'INTERNAL' && 'Chat interno'}
                    {values.contactMode === 'PHONE' && values.contactPhone}
                    {values.contactMode === 'WHATSAPP' && values.contactWhatsapp}
                    {values.contactMode === 'EMAIL' && values.contactEmail}
                  </dd>
                  <dt className="text-(--color-muted)">Recompensa</dt>
                  <dd>{values.reward || 'Sin especificar'}</dd>
                  <dt className="text-(--color-muted)">Imágenes</dt>
                  <dd>{files.length} de {MAX_IMAGES}</dd>
                </dl>
              </div>
            </div>
          )}

          {errorMessage ? (
            <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">{errorMessage}</p>
          ) : null}
          {successSlug ? (
            <p className="rounded-2xl bg-[rgba(46,139,87,0.12)] px-4 py-3 text-sm font-medium text-(--color-success)">Publicación creada: {successSlug}</p>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:justify-between">
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={previousStep} disabled={step === 1}>Atrás</Button>
              {step < totalSteps ? <Button type="button" onClick={nextStep}>Continuar</Button> : null}
            </div>
            {step === totalSteps ? (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Publicando...' : 'Publicar caso'}</Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="soft-panel rounded-4xl p-6">
          <p className="font-semibold text-(--color-text)">Necesitas entrar para publicar</p>
          <p className="mt-2 text-sm text-(--color-muted)">La publicación requiere una sesión autenticada para guardar tu autoría y aplicar RLS.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/auth/login">Entrar</LinkButton>
            <LinkButton href="/auth/register" variant="secondary">Crear cuenta</LinkButton>
          </div>
        </div>
      )}
    </section>
  );
}

export default PublishPage;