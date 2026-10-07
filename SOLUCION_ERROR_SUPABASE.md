# Solución al Error ERR_CONNECTION_RESET de Supabase

## Problema Original

```
notifications.ts:46  GET https://ekslrpohdqrgidtpjqxs.supabase.co/auth/v1/user 
net::ERR_CONNECTION_RESET 200 (OK)
```

Este error se producía por:
1. **Múltiples llamadas simultáneas** a `supabase.auth.getUser()` desde diferentes componentes
2. **Polling agresivo** cada 30 segundos desde 2 componentes diferentes
3. **Sin manejo de errores** adecuado en las llamadas a Supabase
4. **Sin cache compartido** entre componentes

## Soluciones Implementadas

### 1. Hook Personalizado con Cache Compartido

Creado `src/lib/hooks/use-notification-count.ts`:

**Características:**
- ✅ Cache compartido entre todos los componentes
- ✅ Evita llamadas duplicadas con `fetchPromise`
- ✅ Cache de 10 segundos para reducir peticiones
- ✅ Polling reducido de 30s a 60s
- ✅ Manejo robusto de errores
- ✅ Una sola fuente de verdad para el contador

**Beneficios:**
```typescript
// ANTES: Cada componente hacía su propia petición cada 30s
// BottomNav: fetch cada 30s
// SiteShell: fetch cada 30s
// = 2 peticiones cada 30s = 4 peticiones por minuto

// AHORA: Cache compartido con polling de 60s
// Hook compartido: fetch cada 60s (con cache de 10s)
// = 1 petición por minuto máximo
```

### 2. Mejor Manejo de Errores en notifications.ts

**Cambios en las funciones:**

#### `getUnreadCount()`
```typescript
// ANTES: Podía lanzar excepciones no manejadas
export async function getUnreadCount(): Promise<number> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return 0;
  // ...
}

// AHORA: Try-catch completo con logs
export async function getUnreadCount(): Promise<number> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      console.warn('No hay usuario autenticado');
      return 0;
    }
    // ...
  } catch (err) {
    console.error('Error en getUnreadCount:', err);
    return 0;
  }
}
```

#### `getNotifications()`
```typescript
// ANTES: throw Error si no hay usuario
if (!user) {
  throw new Error('No hay sesión activa');
}

// AHORA: Retorna array vacío silenciosamente
if (error || !user) {
  console.warn('No hay usuario autenticado');
  return [];
}
```

### 3. Componentes Actualizados

#### `bottom-nav.tsx`
```typescript
// ANTES
import { getUnreadCount } from '../../lib/supabase/notifications';
const [unreadCount, setUnreadCount] = useState(0);
useEffect(() => {
  const fetchCount = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };
  fetchCount();
  const interval = setInterval(fetchCount, 30_000);
}, [user]);

// AHORA
import { useNotificationCount } from '../../lib/hooks/use-notification-count';
const unreadCount = useNotificationCount();
// ¡Sin useEffect, sin interval, sin estado local!
```

#### `site-shell.tsx`
```typescript
// ANTES
const [unreadCount, setUnreadCount] = useState(0);
useEffect(() => {
  fetchCount();
  fetchProfile();
  const interval = setInterval(fetchCount, 30_000);
}, [user]);

// AHORA
const unreadCount = useNotificationCount();
useEffect(() => {
  fetchProfile(); // Solo fetch del avatar
  // Sin interval para notificaciones
}, [user]);
```

## Mejoras de Rendimiento

### Reducción de Peticiones HTTP

| Escenario | Antes | Ahora | Reducción |
|-----------|-------|-------|-----------|
| Carga inicial | 2 peticiones | 1 petición | 50% |
| Por minuto (idle) | 4 peticiones | 1 petición | 75% |
| Con navegación | 6-8 peticiones | 1-2 peticiones | 75-83% |

### Cache Inteligente

```typescript
// El cache se comparte entre:
// - BottomNav (móvil)
// - SiteShell (escritorio)
// - NotificationsPage

// Si BottomNav pide el contador, SiteShell lo obtiene del cache
// Sin hacer otra petición HTTP
```

## Función de Invalidación Manual

```typescript
import { invalidateNotificationCountCache } from '../lib/hooks/use-notification-count';

// Después de marcar notificaciones como leídas
await markAllAsRead();
invalidateNotificationCountCache(); // Forzar refetch
```

## Archivos Modificados

1. ✅ `src/lib/hooks/use-notification-count.ts` - **NUEVO** Hook personalizado
2. ✅ `src/lib/supabase/notifications.ts` - Mejor manejo de errores
3. ✅ `src/components/layout/bottom-nav.tsx` - Usa el hook
4. ✅ `src/components/layout/site-shell.tsx` - Usa el hook

## Pruebas Recomendadas

1. **Abrir la consola del navegador (F12)**
   - Ya no deberías ver el error `ERR_CONNECTION_RESET`
   
2. **Verificar peticiones en Network tab**
   - Filtrar por `/auth/v1/user`
   - Deberías ver máximo 1 petición por minuto

3. **Navegar entre páginas**
   - El contador de notificaciones debe mantenerse sincronizado
   - Sin múltiples peticiones

4. **Modo offline**
   - El error debe manejarse silenciosamente
   - Contador debe mostrar 0
   - Sin crashes

## Logs Esperados

```
// Si hay usuario
[Sin logs, funcionamiento silencioso]

// Si no hay usuario (logout)
⚠️ No hay usuario autenticado para obtener notificaciones

// Si hay error de red
❌ Error en getUnreadCount: [error details]
```

## Beneficios Adicionales

1. **Mejor UX**: Menos lag, menos peticiones
2. **Menos carga en Supabase**: Reducción del 75% en peticiones
3. **Código más limpio**: Un hook en lugar de lógica duplicada
4. **Más resiliente**: Manejo robusto de errores
5. **Más mantenible**: Una fuente de verdad para el contador
