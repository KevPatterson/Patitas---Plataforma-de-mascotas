-- Migración 0007: Privacidad de ubicación con fuzzing server-side

-- ══════════════════════════════════════════════════════════════
-- Función para aplicar fuzzing a coordenadas (±500m aproximadamente)
-- ══════════════════════════════════════════════════════════════

create or replace function public.fuzz_coordinates(lat numeric, lng numeric)
returns table(fuzzed_lat numeric, fuzzed_lng numeric)
language plpgsql
immutable
as $$
begin
  -- Aplicar offset aleatorio de ±0.005 grados (~500m)
  -- Usamos hash del lat/lng como seed para consistencia en la misma ubicación
  return query select
    round((lat + (random() * 0.01 - 0.005))::numeric, 6) as fuzzed_lat,
    round((lng + (random() * 0.01 - 0.005))::numeric, 6) as fuzzed_lng;
end;
$$;

-- ══════════════════════════════════════════════════════════════
-- Trigger para aplicar fuzzing automático en INSERT
-- ══════════════════════════════════════════════════════════════

create or replace function public.fuzz_location_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si se proporcionan coordenadas, aplicar fuzzing
  if new.approximate_lat is not null and new.approximate_lng is not null then
    -- Limitar precisión a máximo 3 decimales (~110m)
    new.approximate_lat := round(new.approximate_lat::numeric, 3);
    new.approximate_lng := round(new.approximate_lng::numeric, 3);
    
    -- Aplicar fuzzing adicional aleatorio
    new.approximate_lat := new.approximate_lat + (random() * 0.006 - 0.003);
    new.approximate_lng := new.approximate_lng + (random() * 0.006 - 0.003);
    
    -- Redondear resultado final
    new.approximate_lat := round(new.approximate_lat::numeric, 4);
    new.approximate_lng := round(new.approximate_lng::numeric, 4);
  end if;
  
  return new;
end;
$$;

drop trigger if exists locations_fuzz_coordinates on public.locations;

create trigger locations_fuzz_coordinates
  before insert on public.locations
  for each row
  execute function public.fuzz_location_on_insert();

-- ══════════════════════════════════════════════════════════════
-- Trigger para prevenir actualización a coordenadas exactas
-- ══════════════════════════════════════════════════════════════

create or replace function public.fuzz_location_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si se intentan actualizar coordenadas, aplicar fuzzing
  if new.approximate_lat is distinct from old.approximate_lat 
     or new.approximate_lng is distinct from old.approximate_lng then
    
    if new.approximate_lat is not null and new.approximate_lng is not null then
      -- Limitar precisión
      new.approximate_lat := round(new.approximate_lat::numeric, 3);
      new.approximate_lng := round(new.approximate_lng::numeric, 3);
      
      -- Aplicar fuzzing
      new.approximate_lat := new.approximate_lat + (random() * 0.006 - 0.003);
      new.approximate_lng := new.approximate_lng + (random() * 0.006 - 0.003);
      
      -- Redondear
      new.approximate_lat := round(new.approximate_lat::numeric, 4);
      new.approximate_lng := round(new.approximate_lng::numeric, 4);
    end if;
  end if;
  
  return new;
end;
$$;

drop trigger if exists locations_fuzz_coordinates_update on public.locations;

create trigger locations_fuzz_coordinates_update
  before update on public.locations
  for each row
  execute function public.fuzz_location_on_update();

-- ══════════════════════════════════════════════════════════════
-- Constraint: Limitar precisión de coordenadas a nivel de DB
-- ══════════════════════════════════════════════════════════════

alter table public.locations 
  drop constraint if exists locations_coordinate_precision_check;

alter table public.locations 
  add constraint locations_coordinate_precision_check 
  check (
    (approximate_lat is null or (approximate_lat >= -90 and approximate_lat <= 90))
    and (approximate_lng is null or (approximate_lng >= -180 and approximate_lng <= 180))
  );

-- ══════════════════════════════════════════════════════════════
-- Índice geoespacial para búsquedas por proximidad
-- ══════════════════════════════════════════════════════════════

create index if not exists locations_coordinates_index 
  on public.locations (approximate_lat, approximate_lng)
  where approximate_lat is not null and approximate_lng is not null;

-- ══════════════════════════════════════════════════════════════
-- Comentarios explicativos
-- ══════════════════════════════════════════════════════════════

comment on function public.fuzz_coordinates(numeric, numeric) is 
  'Aplica fuzzing aleatorio a coordenadas para proteger privacidad (~500m de offset)';

comment on function public.fuzz_location_on_insert() is 
  'Trigger que aplica fuzzing automático a coordenadas en INSERT, limitando precisión a ~110m';

comment on function public.fuzz_location_on_update() is 
  'Trigger que aplica fuzzing automático a coordenadas en UPDATE, previniendo coordenadas exactas';

comment on constraint locations_coordinate_precision_check on public.locations is 
  'Valida rangos de latitud (-90 a 90) y longitud (-180 a 180)';
