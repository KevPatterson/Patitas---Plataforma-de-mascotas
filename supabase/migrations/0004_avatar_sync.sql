-- Migración 0004: Sincronización mejorada de avatares desde Google OAuth

-- Actualizar la función handle_new_user para sincronizar avatar_url desde Google
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  return new;
end;
$;

-- Comentario explicativo
comment on function public.handle_new_user() is 
  'Sincroniza automáticamente los datos del usuario desde auth.users a profiles, incluyendo avatar_url desde Google OAuth (picture field)';
