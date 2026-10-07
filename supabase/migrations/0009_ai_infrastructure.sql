-- Migración 0009: Infraestructura para procesamiento inteligente (IA, OCR, CV, Embeddings)

-- ══════════════════════════════════════════════════════════════
-- ENUMS para procesamiento inteligente
-- ══════════════════════════════════════════════════════════════

do $$ begin
  create type public.ai_job_status as enum ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_provider as enum ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'CLOUDFLARE', 'CUSTOM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.moderation_classification as enum ('SAFE', 'SPAM', 'FRAUD', 'OFFENSIVE', 'INAPPROPRIATE', 'UNRELATED', 'UNCERTAIN');
exception when duplicate_object then null; end $$;

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_processing_jobs
-- Registra trabajos de procesamiento asíncrono
-- ══════════════════════════════════════════════════════════════

create table if not exists public.ai_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  job_type text not null, -- 'ocr', 'vision', 'embedding_text', 'embedding_image', 'moderation', 'extraction'
  status public.ai_job_status not null default 'PENDING',
  provider public.ai_provider,
  model text,
  model_version text,
  priority integer not null default 5, -- 1 (alta) a 10 (baja)
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  processing_time_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists ai_processing_jobs_publication_idx on public.ai_processing_jobs (publication_id, job_type);
create index if not exists ai_processing_jobs_status_idx on public.ai_processing_jobs (status, priority, created_at);
create index if not exists ai_processing_jobs_type_status_idx on public.ai_processing_jobs (job_type, status);

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_ocr_results
-- Resultados de OCR sobre imágenes
-- ══════════════════════════════════════════════════════════════

create table if not exists public.ai_ocr_results (
  id uuid primary key default gen_random_uuid(),
  publication_image_id uuid not null references public.publication_images(id) on delete cascade,
  job_id uuid references public.ai_processing_jobs(id) on delete set null,
  provider public.ai_provider not null,
  model text,
  extracted_text text,
  confidence numeric(5,4), -- 0.0000 a 1.0000
  language text default 'es',
  bounding_boxes jsonb, -- Formato: [{"text": "...", "bbox": [x1,y1,x2,y2], "confidence": 0.95}, ...]
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists ai_ocr_results_image_idx on public.ai_ocr_results (publication_image_id);
create index if not exists ai_ocr_results_job_idx on public.ai_ocr_results (job_id);

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_vision_results
-- Resultados de Computer Vision (análisis de imágenes)
-- ══════════════════════════════════════════════════════════════

create table if not exists public.ai_vision_results (
  id uuid primary key default gen_random_uuid(),
  publication_image_id uuid not null references public.publication_images(id) on delete cascade,
  job_id uuid references public.ai_processing_jobs(id) on delete set null,
  provider public.ai_provider not null,
  model text not null,
  model_version text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists ai_vision_results_image_idx on public.ai_vision_results (publication_image_id);

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_extracted_attributes
-- Atributos extraídos de imágenes (especie, raza, color, etc.)
-- ══════════════════════════════════════════════════════════════

create table if not exists public.ai_extracted_attributes (
  id uuid primary key default gen_random_uuid(),
  vision_result_id uuid references public.ai_vision_results(id) on delete cascade,
  ocr_result_id uuid references public.ai_ocr_results(id) on delete cascade,
  publication_id uuid references public.publications(id) on delete cascade,
  attribute_key text not null, -- 'species', 'breed', 'color', 'collar', 'plate', 'phone', 'location', etc.
  attribute_value text not null,
  confidence numeric(5,4) not null, -- 0.0000 a 1.0000
  source text not null, -- 'vision', 'ocr', 'hybrid'
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint ai_extracted_attributes_source_check check (
    (vision_result_id is not null and source in ('vision', 'hybrid')) 
    or (ocr_result_id is not null and source in ('ocr', 'hybrid'))
    or (publication_id is not null)
  )
);

create index if not exists ai_extracted_attributes_vision_idx on public.ai_extracted_attributes (vision_result_id);
create index if not exists ai_extracted_attributes_ocr_idx on public.ai_extracted_attributes (ocr_result_id);
create index if not exists ai_extracted_attributes_publication_idx on public.ai_extracted_attributes (publication_id, attribute_key);

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_text_embeddings
-- Embeddings vectoriales de texto para búsqueda semántica
-- ══════════════════════════════════════════════════════════════

-- Nota: Requiere extensión pgvector (se intentará activar si está disponible)
do $$ begin
  create extension if not exists vector;
exception when others then 
  raise notice 'pgvector extension not available, skipping vector column';
end $$;

create table if not exists public.ai_text_embeddings (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  job_id uuid references public.ai_processing_jobs(id) on delete set null,
  provider public.ai_provider not null,
  model text not null,
  model_version text,
  embedding_dimension integer not null,
  -- embedding vector(1536), -- Se agregará si pgvector está disponible
  embedding_data jsonb, -- Fallback si pgvector no está disponible
  text_source text not null, -- 'title', 'description', 'combined', 'attributes'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agregar columna vector si pgvector está disponible
do $$ begin
  alter table public.ai_text_embeddings add column if not exists embedding vector(1536);
exception when undefined_object then
  raise notice 'pgvector not available, using jsonb for embeddings';
end $$;

create unique index if not exists ai_text_embeddings_publication_source_idx 
  on public.ai_text_embeddings (publication_id, text_source, model);

-- Índice vectorial si pgvector está disponible
do $$ begin
  create index if not exists ai_text_embeddings_vector_idx 
    on public.ai_text_embeddings using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);
exception when undefined_object or undefined_function then
  raise notice 'pgvector index skipped';
end $$;

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_image_embeddings
-- Embeddings vectoriales de imágenes para búsqueda visual
-- ══════════════════════════════════════════════════════════════

create table if not exists public.ai_image_embeddings (
  id uuid primary key default gen_random_uuid(),
  publication_image_id uuid not null references public.publication_images(id) on delete cascade,
  job_id uuid references public.ai_processing_jobs(id) on delete set null,
  provider public.ai_provider not null,
  model text not null,
  model_version text,
  embedding_dimension integer not null,
  embedding_data jsonb, -- Fallback
  image_hash text, -- SHA-256 o perceptual hash
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agregar columna vector si pgvector está disponible
do $$ begin
  alter table public.ai_image_embeddings add column if not exists embedding vector(512);
exception when undefined_object then null; end $$;

create unique index if not exists ai_image_embeddings_image_idx 
  on public.ai_image_embeddings (publication_image_id, model);

create index if not exists ai_image_embeddings_hash_idx 
  on public.ai_image_embeddings (image_hash)
  where image_hash is not null;

-- Índice vectorial si pgvector está disponible
do $$ begin
  create index if not exists ai_image_embeddings_vector_idx 
    on public.ai_image_embeddings using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);
exception when undefined_object or undefined_function then null; end $$;

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_moderation_results
-- Resultados de moderación automática
-- ══════════════════════════════════════════════════════════════

create table if not exists public.ai_moderation_results (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid references public.publications(id) on delete cascade,
  publication_image_id uuid references public.publication_images(id) on delete cascade,
  job_id uuid references public.ai_processing_jobs(id) on delete set null,
  provider public.ai_provider not null,
  model text not null,
  classification public.moderation_classification not null,
  confidence numeric(5,4) not null,
  reason text,
  requires_human_review boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_decision text, -- 'APPROVED', 'REJECTED', 'MODIFIED'
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint ai_moderation_results_target_check check (
    (publication_id is not null and publication_image_id is null)
    or (publication_id is null and publication_image_id is not null)
  )
);

create index if not exists ai_moderation_results_publication_idx on public.ai_moderation_results (publication_id);
create index if not exists ai_moderation_results_image_idx on public.ai_moderation_results (publication_image_id);
create index if not exists ai_moderation_results_review_idx on public.ai_moderation_results (requires_human_review, created_at);

-- ══════════════════════════════════════════════════════════════
-- Triggers de updated_at
-- ══════════════════════════════════════════════════════════════

do $$ begin
  create trigger ai_processing_jobs_set_updated_at 
    before update on public.ai_processing_jobs 
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger ai_text_embeddings_set_updated_at 
    before update on public.ai_text_embeddings 
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger ai_image_embeddings_set_updated_at 
    before update on public.ai_image_embeddings 
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ══════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════

alter table public.ai_processing_jobs enable row level security;
alter table public.ai_ocr_results enable row level security;
alter table public.ai_vision_results enable row level security;
alter table public.ai_extracted_attributes enable row level security;
alter table public.ai_text_embeddings enable row level security;
alter table public.ai_image_embeddings enable row level security;
alter table public.ai_moderation_results enable row level security;

-- Solo moderadores y admins pueden leer directamente los resultados de IA
create policy "moderators can read ai jobs"
on public.ai_processing_jobs for select using (
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- Los demás resultados son de solo lectura para propietarios de publicación
create policy "publication owners can read ocr results"
on public.ai_ocr_results for select using (
  exists (
    select 1 from public.publication_images pi
    join public.publications pub on pub.id = pi.publication_id
    where pi.id = publication_image_id
    and pub.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

create policy "publication owners can read vision results"
on public.ai_vision_results for select using (
  exists (
    select 1 from public.publication_images pi
    join public.publications pub on pub.id = pi.publication_id
    where pi.id = publication_image_id
    and pub.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

create policy "publication owners can read extracted attributes"
on public.ai_extracted_attributes for select using (
  exists (
    select 1 from public.publications pub
    where pub.id = publication_id
    and pub.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- Embeddings son de uso interno del sistema (no expuestos directamente)
create policy "system only text embeddings"
on public.ai_text_embeddings for select using (false);

create policy "system only image embeddings"
on public.ai_image_embeddings for select using (false);

-- Moderación: propietarios y moderadores pueden leer
create policy "owners and moderators can read moderation"
on public.ai_moderation_results for select using (
  exists (
    select 1 from public.publications pub
    where pub.id = publication_id
    and pub.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- ══════════════════════════════════════════════════════════════
-- Comentarios explicativos
-- ══════════════════════════════════════════════════════════════

comment on table public.ai_processing_jobs is 
  'Jobs de procesamiento asíncrono para IA (OCR, Vision, Embeddings, Moderación)';

comment on table public.ai_ocr_results is 
  'Resultados de OCR extraídos de imágenes de publicaciones';

comment on table public.ai_vision_results is 
  'Resultados de Computer Vision (análisis visual de mascotas)';

comment on table public.ai_extracted_attributes is 
  'Atributos extraídos automáticamente (especie, raza, color, etc.) con confidence scores';

comment on table public.ai_text_embeddings is 
  'Embeddings vectoriales de texto para búsqueda semántica. Requiere pgvector para búsqueda vectorial';

comment on table public.ai_image_embeddings is 
  'Embeddings vectoriales de imágenes para matching visual. Requiere pgvector';

comment on table public.ai_moderation_results is 
  'Resultados de moderación automática con clasificación y confidence. Puede requerir revisión humana';
