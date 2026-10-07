-- Migración 0006: Correcciones críticas de Storage Security

-- ══════════════════════════════════════════════════════════════
-- PET-IMAGES: Validación estricta de ownership y existencia
-- ══════════════════════════════════════════════════════════════

drop policy if exists "authenticated users can upload pet-images" on storage.objects;

create policy "owners can upload to own publications"
on storage.objects for insert
with check (
  bucket_id = 'pet-images'
  and auth.uid() is not null
  -- Validar formato UUID del folder
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- Validar que la publicación existe y pertenece al usuario
  and exists (
    select 1 from public.publications p
    where p.id::text = (storage.foldername(name))[1]
    and p.owner_profile_id = auth.uid()
    and p.deleted_at is null
  )
);

drop policy if exists "owners can update own pet-images" on storage.objects;

create policy "owners can update own pet-images"
on storage.objects for update
using (
  bucket_id = 'pet-images'
  and auth.uid() is not null
  and exists (
    select 1 from public.publications p
    where p.id::text = (storage.foldername(name))[1]
    and p.owner_profile_id = auth.uid()
  )
);

drop policy if exists "owners can delete own pet-images" on storage.objects;

create policy "owners can delete own pet-images"
on storage.objects for delete
using (
  bucket_id = 'pet-images'
  and auth.uid() is not null
  and exists (
    select 1 from public.publications p
    where p.id::text = (storage.foldername(name))[1]
    and p.owner_profile_id = auth.uid()
  )
);

-- Moderadores pueden eliminar imágenes inapropiadas
create policy "moderators can delete pet-images"
on storage.objects for delete
using (
  bucket_id = 'pet-images'
  and exists (
    select 1 from public.profiles pr
    where pr.id = auth.uid()
    and pr.role in ('MODERATOR', 'ADMIN')
  )
);

-- ══════════════════════════════════════════════════════════════
-- AVATARS: Validación de que el folder es el user_id correcto
-- ══════════════════════════════════════════════════════════════

drop policy if exists "users can upload own avatar" on storage.objects;

create policy "users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  -- Validar formato UUID
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- Validar que el folder coincide con auth.uid()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can update own avatar" on storage.objects;

create policy "users can update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can delete own avatar" on storage.objects;

create policy "users can delete own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ══════════════════════════════════════════════════════════════
-- Comentarios explicativos
-- ══════════════════════════════════════════════════════════════

comment on policy "owners can upload to own publications" on storage.objects is 
  'Valida que la publicación exista, pertenezca al usuario y no esté eliminada antes de permitir upload';

comment on policy "moderators can delete pet-images" on storage.objects is 
  'Permite a moderadores eliminar imágenes reportadas como inapropiadas';

comment on policy "users can upload own avatar" on storage.objects is 
  'Valida que el folder del avatar coincida exactamente con el UUID del usuario autenticado';
