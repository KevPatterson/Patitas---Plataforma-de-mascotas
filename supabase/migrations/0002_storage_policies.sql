-- Crear buckets de Storage si no existen
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  ('pet-images', 'pet-images', true, 8388608, array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Políticas para pet-images
create policy "pet-images public read"
on storage.objects for select
using (bucket_id = 'pet-images');

create policy "authenticated users can upload pet-images"
on storage.objects for insert
with check (
  bucket_id = 'pet-images' 
  and auth.uid() is not null
  and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

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

-- Políticas para avatars
create policy "avatars public read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "users can upload own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can delete own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
