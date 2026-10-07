# Solución: Error 403 en Supabase

## Problema

Estás obteniendo errores 403 (Forbidden) al intentar acceder a los endpoints de autenticación de Supabase:

```
ekslrpohdqrgidtpjqxs.supabase.co/auth/v1/user:1 Failed to load resource: the server responded with a status of 403 ()
```

Además, el mapa no muestra ningún caso (todas las estadísticas aparecen en 0).

## Causas posibles

1. **Variables de entorno mal configuradas**: Las credenciales de Supabase en el archivo `.env` no son correctas o están vacías
2. **Políticas RLS demasiado restrictivas**: Las políticas de Row Level Security están bloqueando las consultas
3. **Clave anónima incorrecta**: La `VITE_SUPABASE_ANON_KEY` no es válida
4. **Proyecto de Supabase pausado**: Si usas el tier gratuito, el proyecto puede haberse pausado por inactividad

## Solución

### 1. Verifica tu archivo `.env`

Asegúrate de que tu archivo `.env` en la raíz del proyecto tenga las siguientes variables correctamente configuradas:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

**Para obtener estas credenciales:**

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Abre tu proyecto
3. Ve a **Settings** (Configuración) → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 2. Verifica que el proyecto esté activo

1. Ve a tu proyecto en Supabase
2. Si ves un mensaje de "Proyecto pausado", haz clic en **Restore project** (Restaurar proyecto)
3. Los proyectos gratuitos se pausan automáticamente después de 1 semana de inactividad

### 3. Verifica las políticas RLS

Las tablas `publications` y `locations` deben tener políticas que permitan lectura pública:

```sql
-- Permitir lectura pública de publicaciones activas
CREATE POLICY "Lectura pública de publicaciones"
ON publications FOR SELECT
USING (status != 'DELETED');

-- Permitir lectura pública de ubicaciones
CREATE POLICY "Lectura pública de ubicaciones"
ON locations FOR SELECT
USING (true);
```

**Para verificar:**

1. Ve a **Authentication** → **Policies** en Supabase
2. Busca las tablas `publications` y `locations`
3. Asegúrate de que existan políticas de SELECT habilitadas

### 4. Reinicia el servidor de desarrollo

Después de actualizar el archivo `.env`:

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

Las variables de entorno solo se cargan al iniciar el servidor, no en caliente.

### 5. Verifica en la consola del navegador

Después de los cambios, abre las **DevTools** (F12) y ve a la pestaña **Console**. Deberías ver logs como:

```
🗺️ Iniciando carga de datos del mapa...
🔍 Filtros de búsqueda: {status: 'ACTIVE', limit: 500}
📊 Publicaciones recibidas: 25
📍 Publicaciones con coordenadas: 20
```

Si ves estos logs, el problema está solucionado.

## Diagnóstico adicional

Si el problema persiste, ejecuta este código en la consola del navegador para ver más detalles:

```javascript
// Verifica las variables de entorno
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('ANON_KEY presente:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Prueba una consulta simple
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('publications')
  .select('count')
  .limit(1);

console.log('Test query - data:', data);
console.log('Test query - error:', error);
```

## Contacto

Si después de seguir estos pasos el problema persiste, comparte:
1. El mensaje de error completo de la consola
2. La salida del código de diagnóstico anterior
3. Una captura de pantalla de tu configuración de API en Supabase
