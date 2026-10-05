create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('USER', 'MODERATOR', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publication_type as enum ('LOST', 'FOUND', 'ABANDONED', 'ADOPTION', 'SIGHTING');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publication_status as enum ('ACTIVE', 'RESOLVED', 'EXPIRED', 'HIDDEN', 'DELETED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_reason as enum ('FALSE_INFO', 'SPAM', 'SCAM', 'DUPLICATE', 'REUNITED', 'INAPPROPRIATE', 'OTHER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('MATCH', 'REPORT', 'MESSAGE', 'PUBLICATION_UPDATE', 'SYSTEM');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'USER',
  bio text,
  city text,
  country text not null default 'Cuba',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists profiles_username_key on public.profiles (lower(username));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
exception when duplicate_object then null; end $$;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  province text not null,
  municipality text not null,
  zone text,
  approximate_lat numeric(9,6),
  approximate_lng numeric(9,6),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  name text,
  species text not null,
  breed text,
  sex text,
  size text,
  age_approx text,
  color text,
  characteristics text,
  has_collar boolean not null default false,
  has_plate boolean not null default false,
  microchip_private text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  type public.publication_type not null,
  status public.publication_status not null default 'ACTIVE',
  title text not null,
  description text not null,
  species text not null,
  breed text,
  sex text,
  size text,
  age_approx text,
  color text,
  characteristics text,
  collar boolean not null default false,
  plate boolean not null default false,
  reward text,
  contact_phone text,
  contact_whatsapp text,
  contact_mode text not null default 'INTERNAL',
  event_date date,
  event_time_approx time,
  last_seen_at timestamptz,
  published_at timestamptz not null default now(),
  resolved_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists publications_public_index on public.publications (status, type, published_at desc);
create index if not exists publications_owner_index on public.publications (owner_profile_id, status);
create index if not exists publications_slug_index on public.publications (slug);
create index if not exists publications_location_index on public.publications (location_id);
create index if not exists publications_species_index on public.publications (species);

create table if not exists public.publication_images (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists publication_images_publication_index on public.publication_images (publication_id, sort_order);

create table if not exists public.sightings (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  reporter_profile_id uuid references public.profiles(id) on delete set null,
  note text not null,
  location_id uuid references public.locations(id) on delete set null,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists sightings_publication_index on public.sightings (publication_id, created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason public.report_reason not null,
  description text,
  status public.report_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists reports_publication_index on public.reports (publication_id, status, created_at desc);
create index if not exists reports_status_index on public.reports (status, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists notifications_profile_index on public.notifications (profile_id, is_read, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists comments_publication_index on public.comments (publication_id, created_at desc);

create table if not exists public.adoption_requests (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  deleted_at timestamptz
);

create index if not exists adoption_requests_publication_index on public.adoption_requests (publication_id, status, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_index on public.audit_logs (entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger locations_set_updated_at before update on public.locations for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger pets_set_updated_at before update on public.pets for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger publications_set_updated_at before update on public.publications for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger publication_images_set_updated_at before update on public.publication_images for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger sightings_set_updated_at before update on public.sightings for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger reports_set_updated_at before update on public.reports for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger notifications_set_updated_at before update on public.notifications for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger comments_set_updated_at before update on public.comments for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger adoption_requests_set_updated_at before update on public.adoption_requests for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.pets enable row level security;
alter table public.publications enable row level security;
alter table public.publication_images enable row level security;
alter table public.sightings enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.comments enable row level security;
alter table public.adoption_requests enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles are publicly readable" on public.profiles for select using (deleted_at is null);
create policy "profile owner can insert own row" on public.profiles for insert with check (auth.uid() = id);
create policy "profile owner can update own row" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "public locations readable" on public.locations for select using (true);
create policy "authenticated users can insert locations" on public.locations for insert with check (auth.uid() is not null);
create policy "authenticated users can update locations" on public.locations for update using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "pets readable by owner or moderators" on public.pets for select using (
  deleted_at is null and (
    owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
  )
);
create policy "pet owner can insert" on public.pets for insert with check (auth.uid() = owner_profile_id or owner_profile_id is null);
create policy "pet owner can update" on public.pets for update using (
  owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
) with check (
  owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);

create policy "public publications readable" on public.publications for select using (deleted_at is null and status in ('ACTIVE', 'RESOLVED'));
create policy "owners can read own publications" on public.publications for select using (owner_profile_id = auth.uid());
create policy "authenticated users can insert publications" on public.publications for insert with check (auth.uid() = owner_profile_id);
create policy "owners can update own publications" on public.publications for update using (
  owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
) with check (
  owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);
create policy "owners can delete own publications" on public.publications for delete using (
  owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);

create policy "public images readable for public publications" on public.publication_images for select using (
  exists (select 1 from public.publications pub where pub.id = publication_id and pub.deleted_at is null and pub.status in ('ACTIVE', 'RESOLVED'))
);
create policy "owners can manage publication images" on public.publication_images for all using (
  exists (select 1 from public.publications pub where pub.id = publication_id and (pub.owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))))
) with check (
  exists (select 1 from public.publications pub where pub.id = publication_id and (pub.owner_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))))
);

create policy "sightings public on active publications" on public.sightings for select using (
  exists (select 1 from public.publications pub where pub.id = publication_id and pub.status in ('ACTIVE', 'RESOLVED') and pub.deleted_at is null)
);
create policy "authenticated users can create sightings" on public.sightings for insert with check (auth.uid() = reporter_profile_id or reporter_profile_id is null);
create policy "sighting author or moderators can update" on public.sightings for update using (
  reporter_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
) with check (
  reporter_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);

create policy "reporters can insert reports" on public.reports for insert with check (auth.uid() = reporter_id or reporter_id is null);
create policy "report owners and moderators can read reports" on public.reports for select using (
  reporter_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);
create policy "moderators can manage reports" on public.reports for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);

create policy "profile owner notifications" on public.notifications for select using (profile_id = auth.uid());
create policy "profile owner can update notifications" on public.notifications for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "comment public on public publications" on public.comments for select using (
  exists (select 1 from public.publications pub where pub.id = publication_id and pub.deleted_at is null and pub.status in ('ACTIVE', 'RESOLVED'))
);
create policy "authenticated users can comment" on public.comments for insert with check (auth.uid() = author_profile_id or author_profile_id is null);
create policy "comment author or moderators can update" on public.comments for update using (
  author_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
) with check (
  author_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);

create policy "authenticated users can create adoption requests" on public.adoption_requests for insert with check (auth.uid() = requester_profile_id);
create policy "requester or moderators can read adoption requests" on public.adoption_requests for select using (
  requester_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);
create policy "requester or moderators can update adoption requests" on public.adoption_requests for update using (
  requester_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
) with check (
  requester_profile_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);

create policy "moderators and admins can read audit logs" on public.audit_logs for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('MODERATOR', 'ADMIN'))
);