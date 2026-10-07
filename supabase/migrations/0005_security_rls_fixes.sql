-- Migración 0005: Correcciones críticas de RLS

-- ══════════════════════════════════════════════════════════════
-- ADOPTION REQUESTS: Permitir al owner de la publicación leer solicitudes
-- ══════════════════════════════════════════════════════════════

drop policy if exists "requester or moderators can read adoption requests" on public.adoption_requests;

create policy "requester, owner or moderators can read adoption requests"
on public.adoption_requests for select using (
  requester_profile_id = auth.uid() 
  or exists (
    select 1 from public.publications p 
    where p.id = publication_id 
    and p.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles pr 
    where pr.id = auth.uid() 
    and pr.role in ('MODERATOR', 'ADMIN')
  )
);

drop policy if exists "requester or moderators can update adoption requests" on public.adoption_requests;

create policy "requester, owner or moderators can update adoption requests"
on public.adoption_requests for update using (
  requester_profile_id = auth.uid()
  or exists (
    select 1 from public.publications p 
    where p.id = publication_id 
    and p.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles pr 
    where pr.id = auth.uid() 
    and pr.role in ('MODERATOR', 'ADMIN')
  )
) with check (
  requester_profile_id = auth.uid()
  or exists (
    select 1 from public.publications p 
    where p.id = publication_id 
    and p.owner_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles pr 
    where pr.id = auth.uid() 
    and pr.role in ('MODERATOR', 'ADMIN')
  )
);

-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS: Permitir sistema crear notificaciones
-- ══════════════════════════════════════════════════════════════

create policy "system can insert notifications"
on public.notifications for insert with check (true);

-- ══════════════════════════════════════════════════════════════
-- COMMENTS: Política explícita de DELETE
-- ══════════════════════════════════════════════════════════════

create policy "comment author or moderators can delete"
on public.comments for delete using (
  author_profile_id = auth.uid() 
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- ══════════════════════════════════════════════════════════════
-- SIGHTINGS: Política explícita de DELETE
-- ══════════════════════════════════════════════════════════════

create policy "sighting reporter or moderators can delete"
on public.sightings for delete using (
  reporter_profile_id = auth.uid() 
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
);

-- ══════════════════════════════════════════════════════════════
-- AUDIT LOGS: Permitir sistema insertar logs
-- ══════════════════════════════════════════════════════════════

create policy "authenticated users can insert audit logs"
on public.audit_logs for insert with check (
  auth.uid() is not null 
  and (actor_profile_id = auth.uid() or actor_profile_id is null)
);

-- ══════════════════════════════════════════════════════════════
-- PROFILES: Proteger modificación de roles
-- ══════════════════════════════════════════════════════════════

drop policy if exists "profile owner can update own row" on public.profiles;

create policy "profile owner can update own row"
on public.profiles for update using (auth.uid() = id) with check (
  auth.uid() = id 
  and (
    -- No se puede cambiar el role a sí mismo
    role = (select role from public.profiles where id = auth.uid())
    or role is null
  )
);

create policy "admins can update any profile"
on public.profiles for update using (
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role = 'ADMIN'
  )
) with check (
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role = 'ADMIN'
  )
);

-- ══════════════════════════════════════════════════════════════
-- REPORTS: Prevenir manipulación de resolved_by
-- ══════════════════════════════════════════════════════════════

drop policy if exists "moderators can manage reports" on public.reports;

create policy "moderators can update reports"
on public.reports for update using (
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
) with check (
  exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
  -- Asegurar que resolved_by sea el usuario actual si se está resolviendo
  and (
    resolved_by = auth.uid() 
    or resolved_by is null 
    or status != 'RESOLVED'
  )
);

-- ══════════════════════════════════════════════════════════════
-- PUBLICATIONS: Prevenir escalada de privilegios en ownership
-- ══════════════════════════════════════════════════════════════

drop policy if exists "owners can update own publications" on public.publications;

create policy "owners can update own publications"
on public.publications for update using (
  owner_profile_id = auth.uid() 
  or exists (
    select 1 from public.profiles p 
    where p.id = auth.uid() 
    and p.role in ('MODERATOR', 'ADMIN')
  )
) with check (
  -- Prevenir cambio de owner_profile_id
  owner_profile_id = (select owner_profile_id from public.publications where id = publications.id)
  and (
    owner_profile_id = auth.uid() 
    or exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() 
      and p.role in ('MODERATOR', 'ADMIN')
    )
  )
);

-- ══════════════════════════════════════════════════════════════
-- Comentarios explicativos
-- ══════════════════════════════════════════════════════════════

comment on policy "requester, owner or moderators can read adoption requests" on public.adoption_requests is 
  'Permite al solicitante, al dueño de la publicación y a moderadores leer solicitudes de adopción';

comment on policy "system can insert notifications" on public.notifications is 
  'Permite al sistema crear notificaciones para cualquier usuario';

comment on policy "profile owner can update own row" on public.profiles is 
  'Permite actualizar perfil propio pero previene auto-escalada de roles';

comment on policy "admins can update any profile" on public.profiles is 
  'Solo administradores pueden modificar perfiles de otros usuarios';
