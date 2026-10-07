-- Migración 0008: Optimización de búsqueda tradicional con Full Text Search

-- ══════════════════════════════════════════════════════════════
-- Configuración de diccionario español para FTS
-- ══════════════════════════════════════════════════════════════

-- Crear configuración de búsqueda en español si no existe
do $$ begin
  if not exists (select 1 from pg_ts_config where cfgname = 'spanish') then
    create text search configuration spanish (copy = simple);
  end if;
exception when others then null; end $$;

-- ══════════════════════════════════════════════════════════════
-- Columna tsvector para Full Text Search en publications
-- ══════════════════════════════════════════════════════════════

alter table public.publications 
  add column if not exists search_vector tsvector;

-- ══════════════════════════════════════════════════════════════
-- Función para generar search_vector
-- ══════════════════════════════════════════════════════════════

create or replace function public.publications_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := 
    setweight(to_tsvector('spanish', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(new.species, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(new.breed, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(new.color, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(new.characteristics, '')), 'C');
  
  return new;
end;
$$;

-- ══════════════════════════════════════════════════════════════
-- Trigger para actualizar search_vector automáticamente
-- ══════════════════════════════════════════════════════════════

drop trigger if exists publications_search_vector_trigger on public.publications;

create trigger publications_search_vector_trigger
  before insert or update on public.publications
  for each row
  execute function public.publications_search_vector_update();

-- ══════════════════════════════════════════════════════════════
-- Actualizar registros existentes
-- ══════════════════════════════════════════════════════════════

update public.publications
set search_vector = 
  setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(species, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(breed, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(color, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(characteristics, '')), 'C')
where search_vector is null;

-- ══════════════════════════════════════════════════════════════
-- Índice GIN para Full Text Search
-- ══════════════════════════════════════════════════════════════

create index if not exists publications_search_vector_idx 
  on public.publications using gin(search_vector);

-- ══════════════════════════════════════════════════════════════
-- Índices adicionales para filtros comunes
-- ══════════════════════════════════════════════════════════════

create index if not exists publications_type_status_date_idx 
  on public.publications (type, status, published_at desc)
  where deleted_at is null;

create index if not exists publications_species_status_idx 
  on public.publications (species, status, published_at desc)
  where deleted_at is null;

create index if not exists publications_status_published_idx 
  on public.publications (status, published_at desc)
  where deleted_at is null;

-- Índice para búsquedas por provincia/municipio
create index if not exists publications_location_lookup_idx 
  on public.publications (location_id)
  where location_id is not null and deleted_at is null;

-- ══════════════════════════════════════════════════════════════
-- Extensión pg_trgm para búsquedas por similitud (typos)
-- ══════════════════════════════════════════════════════════════

create extension if not exists pg_trgm;

-- Índices trigram para búsqueda fuzzy en campos clave
create index if not exists publications_title_trgm_idx 
  on public.publications using gin(title gin_trgm_ops);

create index if not exists publications_breed_trgm_idx 
  on public.publications using gin(breed gin_trgm_ops)
  where breed is not null;

-- ══════════════════════════════════════════════════════════════
-- Función de búsqueda optimizada
-- ══════════════════════════════════════════════════════════════

create or replace function public.search_publications(
  search_query text default null,
  filter_type public.publication_type default null,
  filter_species text default null,
  filter_sex text default null,
  filter_size text default null,
  filter_status public.publication_status default 'ACTIVE',
  filter_province text default null,
  filter_municipality text default null,
  since_date date default null,
  result_limit integer default 50,
  result_offset integer default 0
)
returns table(
  id uuid,
  slug text,
  title text,
  description text,
  type public.publication_type,
  status public.publication_status,
  species text,
  breed text,
  sex text,
  size text,
  color text,
  published_at timestamptz,
  rank real
)
language plpgsql
stable
as $$
declare
  ts_query tsquery;
begin
  -- Construir tsquery si hay texto de búsqueda
  if search_query is not null and trim(search_query) != '' then
    ts_query := plainto_tsquery('spanish', search_query);
  end if;

  return query
  select 
    p.id,
    p.slug,
    p.title,
    p.description,
    p.type,
    p.status,
    p.species,
    p.breed,
    p.sex,
    p.size,
    p.color,
    p.published_at,
    case 
      when ts_query is not null then ts_rank(p.search_vector, ts_query)
      else 0
    end as rank
  from public.publications p
  left join public.locations l on p.location_id = l.id
  where 
    p.deleted_at is null
    and (filter_status is null or p.status = filter_status)
    and (filter_type is null or p.type = filter_type)
    and (filter_species is null or lower(p.species) = lower(filter_species))
    and (filter_sex is null or p.sex = filter_sex)
    and (filter_size is null or p.size = filter_size)
    and (filter_province is null or l.province = filter_province)
    and (filter_municipality is null or l.municipality = filter_municipality)
    and (since_date is null or p.published_at >= since_date)
    and (ts_query is null or p.search_vector @@ ts_query)
  order by 
    case when ts_query is not null then ts_rank(p.search_vector, ts_query) else 0 end desc,
    p.published_at desc
  limit result_limit
  offset result_offset;
end;
$$;

-- ══════════════════════════════════════════════════════════════
-- Comentarios explicativos
-- ══════════════════════════════════════════════════════════════

comment on column public.publications.search_vector is 
  'Vector de búsqueda full-text generado automáticamente desde título, descripción, especie, raza, color y características';

comment on function public.publications_search_vector_update() is 
  'Actualiza automáticamente el vector de búsqueda con pesos: título y especie (A), descripción/raza/color (B), características (C)';

comment on function public.search_publications is 
  'Función optimizada de búsqueda con FTS, filtros combinados y ranking. Soporta typos via configuración spanish';
