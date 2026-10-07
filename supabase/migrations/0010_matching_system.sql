-- Migración 0010: Sistema de matching híbrido (estructurado + semántico + visual)

-- ══════════════════════════════════════════════════════════════
-- ENUMS para matching
-- ══════════════════════════════════════════════════════════════

do $$ begin
  create type public.match_type as enum ('LOST_FOUND', 'SIGHTING', 'VISUAL', 'SEMANTIC');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.match_status as enum ('PENDING', 'NOTIFIED', 'VIEWED', 'CONFIRMED', 'DISMISSED');
exception when duplicate_object then null; end $$;

-- ══════════════════════════════════════════════════════════════
-- Tabla: ai_matches
-- Almacena posibles coincidencias detectadas automáticamente
-- ══════════════════════════════════════════════════════════════

create table if not exists public.ai_matches (
  id uuid primary key default gen_random_uuid(),
  publication_a_id uuid not null references public.publications(id) on delete cascade,
  publication_b_id uuid not null references public.publications(id) on delete cascade,
  match_type public.match_type not null,
  overall_score numeric(5,2) not null, -- 0.00 a 100.00
  
  -- Scores por componente (0-100)
  structured_score numeric(5,2),
  text_score numeric(5,2),
  semantic_score numeric(5,2),
  visual_score numeric(5,2),
  
  -- Metadata del cálculo
  provider public.ai_provider,
  model text,
  model_version text,
  
  -- Estado de la coincidencia
  status public.match_status not null default 'PENDING',
  notified_at timestamptz,
  viewed_by_a boolean not null default false,
  viewed_by_b boolean not null default false,
  confirmed_by uuid references public.profiles(id) on delete set null,
  dismissed_by uuid references public.profiles(id) on delete set null,
  
  -- Razones del match
  reasons jsonb not null default '[]'::jsonb, -- ["same species", "similar color", "nearby location", "high visual similarity"]
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  
  -- Constraints
  constraint ai_matches_different_publications check (publication_a_id != publication_b_id),
  constraint ai_matches_score_range check (overall_score >= 0 and overall_score <= 100)
);

-- Índices para búsqueda eficiente
create index if not exists ai_matches_publication_a_idx on public.ai_matches (publication_a_id, overall_score desc);
create index if not exists ai_matches_publication_b_idx on public.ai_matches (publication_b_id, overall_score desc);
create index if not exists ai_matches_score_idx on public.ai_matches (overall_score desc, created_at desc);
create index if not exists ai_matches_status_idx on public.ai_matches (status, created_at desc);
create index if not exists ai_matches_type_idx on public.ai_matches (match_type, overall_score desc);

-- Índice único para prevenir duplicados (a-b o b-a)
create unique index if not exists ai_matches_unique_pair_idx 
  on public.ai_matches (least(publication_a_id, publication_b_id), greatest(publication_a_id, publication_b_id));

-- ══════════════════════════════════════════════════════════════
-- Tabla: duplicate_detections
-- Detecta publicaciones potencialmente duplicadas
-- ══════════════════════════════════════════════════════════════

create table if not exists public.duplicate_detections (
  id uuid primary key default gen_random_uuid(),
  publication_a_id uuid not null references public.publications(id) on delete cascade,
  publication_b_id uuid not null references public.publications(id) on delete cascade,
  
  similarity_score numeric(5,2) not null, -- 0.00 a 100.00
  
  -- Tipos de similitud detectada
  same_image_hash boolean not null default false,
  similar_image boolean not null default false,
  same_text boolean not null default false,
  similar_text boolean not null default false,
  same_location boolean not null default false,
  same_date boolean not null default false,
  
  duplicate_probability numeric(5,4) not null, -- 0.0000 a 1.0000
  
  -- Estado de revisión
  reviewed boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  is_duplicate boolean, -- null = no revisado, true = confirmado duplicado, false = no es duplicado
  
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  
  constraint duplicate_detections_different_publications check (publication_a_id != publication_b_id),
  constraint duplicate_detections_probability_range check (duplicate_probability >= 0 and duplicate_probability <= 1)
);

create index if not exists duplicate_detections_pub_a_idx on public.duplicate_detections (publication_a_id);
create index if not exists duplicate_detections_pub_b_idx on public.duplicate_detections (publication_b_id);
create index if not exists duplicate_detections_probability_idx on public.duplicate_detections (duplicate_probability desc, created_at desc);
create index if not exists duplicate_detections_review_idx on public.duplicate_detections (reviewed, duplicate_probability desc);

-- Índice único para prevenir duplicados de detección
create unique index if not exists duplicate_detections_unique_pair_idx 
  on public.duplicate_detections (least(publication_a_id, publication_b_id), greatest(publication_a_id, publication_b_id));

-- ══════════════════════════════════════════════════════════════
-- Función: Búsqueda de embeddings similares (si pgvector disponible)
-- ══════════════════════════════════════════════════════════════

create or replace function public.search_similar_publications_by_text(
  query_embedding vector(1536),
  similarity_threshold real default 0.7,
  result_limit integer default 10
)
returns table(
  publication_id uuid,
  similarity real
)
language plpgsql
stable
as $$
begin
  return query
  select 
    te.publication_id,
    1 - (te.embedding <=> query_embedding) as similarity
  from public.ai_text_embeddings te
  where 1 - (te.embedding <=> query_embedding) > similarity_threshold
  order by te.embedding <=> query_embedding
  limit result_limit;
exception
  when undefined_function or undefined_object then
    -- pgvector no disponible, retornar vacío
    return;
end;
$$;

create or replace function public.search_similar_images(
  query_embedding vector(512),
  similarity_threshold real default 0.8,
  result_limit integer default 10
)
returns table(
  publication_image_id uuid,
  similarity real
)
language plpgsql
stable
as $$
begin
  return query
  select 
    ie.publication_image_id,
    1 - (ie.embedding <=> query_embedding) as similarity
  from public.ai_image_embeddings ie
  where 1 - (ie.embedding <=> query_embedding) > similarity_threshold
  order by ie.embedding <=> query_embedding
  limit result_limit;
exception
  when undefined_function or undefined_object then
    return;
end;
$$;

-- ══════════════════════════════════════════════════════════════
-- Función: Calcular matching score estructurado
-- ══════════════════════════════════════════════════════════════

create or replace function public.calculate_structured_match_score(
  pub_a_id uuid,
  pub_b_id uuid
)
returns numeric
language plpgsql
stable
as $$
declare
  pub_a record;
  pub_b record;
  score numeric := 0;
  max_score numeric := 0;
begin
  select * into pub_a from public.publications where id = pub_a_id;
  select * into pub_b from public.publications where id = pub_b_id;
  
  if not found then
    return 0;
  end if;
  
  -- Especie (peso: 30)
  max_score := max_score + 30;
  if lower(pub_a.species) = lower(pub_b.species) then
    score := score + 30;
  end if;
  
  -- Raza (peso: 15)
  if pub_a.breed is not null and pub_b.breed is not null then
    max_score := max_score + 15;
    if lower(pub_a.breed) = lower(pub_b.breed) then
      score := score + 15;
    elsif similarity(lower(pub_a.breed), lower(pub_b.breed)) > 0.6 then
      score := score + 10;
    end if;
  end if;
  
  -- Color (peso: 15)
  if pub_a.color is not null and pub_b.color is not null then
    max_score := max_score + 15;
    if similarity(lower(pub_a.color), lower(pub_b.color)) > 0.6 then
      score := score + 15;
    end if;
  end if;
  
  -- Sexo (peso: 10)
  if pub_a.sex is not null and pub_b.sex is not null then
    max_score := max_score + 10;
    if pub_a.sex = pub_b.sex then
      score := score + 10;
    end if;
  end if;
  
  -- Tamaño (peso: 10)
  if pub_a.size is not null and pub_b.size is not null then
    max_score := max_score + 10;
    if pub_a.size = pub_b.size then
      score := score + 10;
    end if;
  end if;
  
  -- Normalizar a 0-100
  if max_score > 0 then
    return round((score / max_score * 100)::numeric, 2);
  else
    return 0;
  end if;
end;
$$;

-- ══════════════════════════════════════════════════════════════
-- Triggers
-- ══════════════════════════════════════════════════════════════

do $$ begin
  create trigger ai_matches_set_updated_at 
    before update on public.ai_matches 
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ══════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════

alter table public.ai_matches enable row level security;
alter table public.duplicate_detections enable row level security;

-- Los propietarios de las publicaciones pueden ver los matches
create policy "publication owners can read matches"
on public.ai_matches for select using (
  exists (
    select 1 from public.publications pub
    where (pub.id = publication_a_id or pub.id = publication_b_id)
    and pub.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- Los propietarios pueden actualizar el estado del match (viewed, confirmed, dismissed)
create policy "publication owners can update match status"
on public.ai_matches for update using (
  exists (
    select 1 from public.publications pub
    where (pub.id = publication_a_id or pub.id = publication_b_id)
    and pub.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- Duplicados: propietarios y moderadores pueden leer
create policy "owners and moderators can read duplicates"
on public.duplicate_detections for select using (
  exists (
    select 1 from public.publications pub
    where (pub.id = publication_a_id or pub.id = publication_b_id)
    and pub.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- Solo moderadores pueden marcar como revisado
create policy "moderators can update duplicate review"
on public.duplicate_detections for update using (
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- ══════════════════════════════════════════════════════════════
-- Comentarios
-- ══════════════════════════════════════════════════════════════

comment on table public.ai_matches is 
  'Posibles coincidencias entre publicaciones detectadas por matching híbrido (estructurado + semántico + visual)';

comment on table public.duplicate_detections is 
  'Publicaciones potencialmente duplicadas detectadas mediante hash de imagen, texto similar y otros indicadores';

comment on function public.calculate_structured_match_score(uuid, uuid) is 
  'Calcula score de matching estructurado basado en especie, raza, color, sexo, tamaño (0-100)';

comment on function public.search_similar_publications_by_text(vector(1536), real, integer) is 
  'Búsqueda de publicaciones similares usando embeddings de texto. Requiere pgvector';

comment on function public.search_similar_images(vector(512), real, integer) is 
  'Búsqueda de imágenes similares usando embeddings visuales. Requiere pgvector';
