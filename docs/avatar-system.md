# Sistema de Avatares de Usuario

## Descripción General

El sistema de avatares permite a los usuarios tener una foto de perfil que se muestra en toda la aplicación. El sistema soporta:

1. **Sincronización automática** con fotos de perfil de Google OAuth
2. **Subida manual** de imágenes personalizadas
3. **Eliminación** de fotos de perfil
4. **Visualización** en múltiples lugares (header, perfil público, dashboard)

## Componentes Principales

### 1. Base de datos (`profiles.avatar_url`)

La columna `avatar_url` en la tabla `profiles` almacena la URL pública del avatar del usuario.

```sql
-- Columna en profiles
avatar_url text
```

### 2. Storage Bucket (`avatars`)

Bucket configurado en Supabase Storage:
- **Nombre**: `avatars`
- **Público**: Sí
- **Límite de tamaño**: 2MB
- **Formatos permitidos**: JPEG, JPG, PNG, WebP

### 3. Componente `AvatarUpload`

Ubicación: `src/components/ui/avatar-upload.tsx`

Componente React que maneja:
- Vista previa del avatar actual
- Subida de nuevas imágenes (con validación)
- Eliminación de avatares
- Estados de carga

**Props:**
```typescript
{
  currentAvatarUrl?: string | null;
  userName?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
}
```

### 4. Funciones de Supabase

Ubicación: `src/lib/supabase/profiles.ts`

#### `getProfile(userId: string)`
Obtiene el perfil completo del usuario, incluyendo avatar_url.

#### `uploadAvatar(userId: string, file: File)`
1. Elimina el avatar anterior si existe
2. Sube el nuevo archivo a Storage
3. Actualiza `avatar_url` en la tabla `profiles`
4. Retorna la URL pública del nuevo avatar

#### `deleteAvatar(userId: string)`
1. Elimina los archivos del Storage
2. Establece `avatar_url` como `null` en la base de datos

## Integración con Google OAuth

Cuando un usuario inicia sesión con Google, el sistema:

1. Google proporciona un campo `picture` en los metadatos del usuario
2. El trigger `handle_new_user` sincroniza automáticamente este valor a `profiles.avatar_url`
3. Si el usuario ya tenía un avatar personalizado, se respeta (no se sobrescribe)

Ver migración: `supabase/migrations/0004_avatar_sync.sql`

## Flujo de Usuario

### Subir Avatar

1. Usuario va a **Dashboard → Perfil**
2. Hace clic en el botón "Cambiar foto" o "Agregar foto"
3. Selecciona una imagen (se valida formato y tamaño)
4. La imagen se sube automáticamente
5. El avatar se actualiza en toda la aplicación

### Eliminar Avatar

1. Usuario va a **Dashboard → Perfil**
2. Hace clic en el botón "Eliminar"
3. Confirma la acción
4. El avatar se elimina y se muestra el inicial del nombre de usuario

### Visualización

El avatar se muestra en:
- **Header**: Botón de perfil (miniatura 24x24px)
- **Dashboard**: Sección de perfil (128x128px)
- **Perfil público**: Hero del perfil (96x96px)

Si no hay avatar, se muestra la inicial del nombre de usuario sobre un gradiente.

## Validaciones

### Formato de archivo
```typescript
const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

### Tamaño máximo
```typescript
const maxSize = 2 * 1024 * 1024; // 2MB
```

### Políticas de Storage (RLS)

```sql
-- Los usuarios solo pueden gestionar sus propios avatares
create policy "users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Cambios en la Interfaz

### Eliminado
- **Botón duplicado de perfil** en la navegación principal (NavItem)

### Mantenido
- **Botón de perfil** en la sección de autenticación (con avatar)
- **Botón de cerrar sesión** junto al botón de perfil

## Solución de Problemas

### El avatar no se muestra después de subirlo
- Verificar que el archivo se subió correctamente a Storage
- Verificar que `avatar_url` se actualizó en la base de datos
- Limpiar caché del navegador

### Error al subir imagen
- Verificar que el archivo cumple con las restricciones (formato y tamaño)
- Verificar que el usuario está autenticado
- Verificar permisos RLS en Storage

### Avatar de Google no se sincroniza
- Verificar que el trigger `handle_new_user` está activo
- Verificar que Google está enviando el campo `picture` en los metadatos
- Revisar logs de Supabase

## Mejoras Futuras

- [ ] Recorte de imágenes (crop)
- [ ] Filtros y ajustes de imagen
- [ ] Avatares generados automáticamente (estilo avatar placeholder)
- [ ] Integración con otros proveedores OAuth (Facebook, GitHub)
- [ ] Caché de avatares optimizado
- [ ] Compresión automática de imágenes grandes
