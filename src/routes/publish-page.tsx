import { useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth-context';
import { Button, LinkButton } from '../components/ui/button';
import { TextField } from '../components/ui/text-field';
import { TextareaField } from '../components/ui/textarea-field';
import { createLocation, createPublication, uploadPublicationImages } from '../lib/supabase/publications';
import { buildPublicationSlug } from '../lib/utils/slug';
import { publicationFormSchema, type PublicationFormValues } from '../lib/validations/publication';

export function PublishPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
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

  const stepTitle = useMemo(() => {
    if (step === 1) return '¿Qué quieres publicar?';
    if (step === 2) return 'Información de la mascota';
    return 'Ubicación y contacto';
  }, [step]);

  const updateValue = <K extends keyof PublicationFormValues>(key: K, value: PublicationFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []).slice(0, 4));
  };

  const nextStep = () => {
    if (step < 3) {
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

      const publication = await createPublication({
        ownerProfileId: user?.id ?? '',
        slug,
        locationId,
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
            <span>Paso {step} de 3</span>
            <span>{user.email}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {[
              ['LOST', 'Perdido'],
              ['FOUND', 'Encontrado'],
              ['ABANDONED', 'Abandonado'],
              ['ADOPTION', 'Adopción'],
              ['SIGHTING', 'Avistamiento'],
            ].map(([value, label]) => (
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

          {step === 1 ? (
            <div className="space-y-4">
              <TextField label="Título" placeholder="Toby perdido en Playa" value={values.title} onChange={(event) => updateValue('title', event.target.value)} />
              <TextareaField label="Descripción breve" placeholder="Cuéntanos lo ocurrido, señales y contexto." value={values.description} onChange={(event) => updateValue('description', event.target.value)} />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Especie" placeholder="Perro" value={values.species} onChange={(event) => updateValue('species', event.target.value)} />
              <TextField label="Raza" placeholder="Caramelo" value={values.breed ?? ''} onChange={(event) => updateValue('breed', event.target.value)} />
              <TextField label="Sexo" placeholder="Macho" value={values.sex ?? ''} onChange={(event) => updateValue('sex', event.target.value)} />
              <TextField label="Tamaño" placeholder="Mediano" value={values.size ?? ''} onChange={(event) => updateValue('size', event.target.value)} />
              <TextField label="Edad aproximada" placeholder="2 años" value={values.ageApprox ?? ''} onChange={(event) => updateValue('ageApprox', event.target.value)} />
              <TextField label="Color" placeholder="Marrón y blanco" value={values.color} onChange={(event) => updateValue('color', event.target.value)} />
              <TextareaField className="md:col-span-2" label="Características" placeholder="Marcas, cicatrices, comportamiento, collar, placa." value={values.characteristics ?? ''} onChange={(event) => updateValue('characteristics', event.target.value)} />
              <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-(--color-text)">
                <input type="checkbox" checked={values.collar} onChange={(event) => updateValue('collar', event.target.checked)} />
                Tiene collar
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold text-(--color-text)">
                <input type="checkbox" checked={values.plate} onChange={(event) => updateValue('plate', event.target.checked)} />
                Tiene placa
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Provincia" placeholder="La Habana" value={values.province} onChange={(event) => updateValue('province', event.target.value)} />
                <TextField label="Municipio" placeholder="Playa" value={values.municipality} onChange={(event) => updateValue('municipality', event.target.value)} />
                <TextField label="Zona" placeholder="Cerca del malecón" value={values.zone ?? ''} onChange={(event) => updateValue('zone', event.target.value)} />
                <TextField label="Fecha del evento" type="date" value={values.eventDate ?? ''} onChange={(event) => updateValue('eventDate', event.target.value)} />
                <TextField label="Hora aproximada" type="time" value={values.eventTimeApprox ?? ''} onChange={(event) => updateValue('eventTimeApprox', event.target.value)} />
                <TextField label="Recompensa" placeholder="Opcional" value={values.reward ?? ''} onChange={(event) => updateValue('reward', event.target.value)} />
                <TextField label="Coordenada lat aprox." placeholder="23.136" value={values.approximateLat ?? ''} onChange={(event) => updateValue('approximateLat', event.target.value)} />
                <TextField label="Coordenada lng aprox." placeholder="-82.430" value={values.approximateLng ?? ''} onChange={(event) => updateValue('approximateLng', event.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-(--color-text)">
                  <span>Modo de contacto</span>
                  <select
                    className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-base text-(--color-text) shadow-[0_10px_20px_rgba(15,61,51,0.06)] outline-none"
                    value={values.contactMode}
                    onChange={(event) => updateValue('contactMode', event.target.value as PublicationFormValues['contactMode'])}
                  >
                    <option value="INTERNAL">Contacto interno</option>
                    <option value="PHONE">Mostrar teléfono</option>
                    <option value="WHATSAPP">Mostrar WhatsApp</option>
                  </select>
                </label>
                <TextField label="Teléfono" placeholder="+53..." value={values.contactPhone ?? ''} onChange={(event) => updateValue('contactPhone', event.target.value)} />
                <TextField label="WhatsApp" placeholder="+53..." value={values.contactWhatsapp ?? ''} onChange={(event) => updateValue('contactWhatsapp', event.target.value)} />
              </div>

              <TextareaField label="Notas finales" placeholder="Comparte cualquier dato extra que ayude a encontrarla." value={values.description} onChange={(event) => updateValue('description', event.target.value)} />

              <label className="block space-y-2 text-sm font-semibold text-(--color-text)">
                <span>Imágenes</span>
                <input type="file" accept="image/*" multiple onChange={handleFiles} className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm" />
                <span className="block text-xs font-medium text-(--color-muted)">Hasta 4 imágenes, una se marcará como portada.</span>
              </label>

              {files.length > 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 p-4 text-sm text-(--color-muted)">
                  {files.map((file) => file.name).join(', ')}
                </div>
              ) : null}
            </div>
          ) : null}

          {errorMessage ? <p className="rounded-2xl bg-[rgba(181,76,69,0.12)] px-4 py-3 text-sm font-medium text-(--color-danger)">{errorMessage}</p> : null}
          {successSlug ? <p className="rounded-2xl bg-[rgba(46,139,87,0.12)] px-4 py-3 text-sm font-medium text-(--color-success)">Publicación creada: {successSlug}</p> : null}

          <div className="flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:justify-between">
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={previousStep} disabled={step === 1}>Atrás</Button>
              {step < 3 ? <Button type="button" onClick={nextStep}>Continuar</Button> : null}
            </div>
            {step === 3 ? (
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