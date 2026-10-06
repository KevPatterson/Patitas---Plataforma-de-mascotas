-- 0003 parity patch: contact_email + microchip already in pets, ensure indexes
-- contact_email column for publications (viejo tenía contactEmail)
alter table public.publications add column if not exists contact_email text;
create index if not exists publications_contact_email_index on public.publications (contact_email);
-- Ensure pets.microchip_private exists (ya existe en 0001, no-op si duplicate)
do $$ begin
  alter table public.pets add column if not exists microchip_private text;
exception when duplicate_column then null; end $$;
-- Optional helpful index for province filtering (locations)
create index if not exists locations_province_index on public.locations (province, municipality);
