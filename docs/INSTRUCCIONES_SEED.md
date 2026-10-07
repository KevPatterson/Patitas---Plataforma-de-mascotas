# 🌱 Instrucciones para insertar publicaciones de prueba

## ⚠️ IMPORTANTE: Necesitas un usuario registrado

El script usa un usuario existente en tu base de datos. **Antes de ejecutar el script**, asegúrate de tener al menos un usuario registrado.

### Paso 0: Crear un usuario (si no tienes uno)

1. Abre la aplicación: `http://localhost:5173`
2. Haz clic en "Registrarse"
3. Crea una cuenta con tu email
4. Verifica tu email si es necesario

## Pasos a seguir

### 1. Instalar la dependencia faltante

```bash
npm install
```

Esto instalará `dotenv` que acabamos de agregar al `package.json`.

### 2. Verificar tu archivo .env

Abre tu archivo `.env` y asegúrate de tener estas variables:

```env
VITE_SUPABASE_URL=https://ekslrpohdqrgidtpjqxs.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui

# Opcional pero recomendado para el script:
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-aqui
```

**¿Dónde obtener las claves?**

1. Ve a [supabase.com](https://supabase.com) → Tu proyecto
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Ejecutar el script de seed

```bash
npm run seed:test
```

Este comando ejecutará el script que:
- Usa el primer usuario de tu base de datos
- Inserta 6 publicaciones con diferentes tipos
- Todas ubicadas en diferentes zonas de La Habana
- Con coordenadas reales difuminadas ±50 metros

**Nota:** Todas las publicaciones se crearán con el mismo usuario (el primero de tu BD).

### 4. Verificar en el navegador

Después de ejecutar el script, abre:

```
http://localhost:5173/mapa
```

Deberías ver:
- ✅ Estadísticas mostrando números > 0
- ✅ Marcadores con forma de patita en el mapa
- ✅ Ubicaciones en diferentes zonas de La Habana

También puedes verificar en:
- `http://localhost:5173/cerca-de-ti` - Lista ordenada por distancia
- `http://localhost:5173/buscar` - Buscador con las publicaciones

## ¿Qué publicaciones se crearán?

### 1. 🔴 Perrita blanca perdida en el Malecón
- **Tipo:** LOST (Perdido)
- **Ubicación:** Malecón y Prado, Centro Habana
- **Descripción:** Perrita mestiza blanca con collar rojo

### 2. 🟢 Gato negro encontrado en Vedado
- **Tipo:** FOUND (Encontrado)
- **Ubicación:** Calle 23 y 12, Vedado
- **Descripción:** Gato negro con collar azul

### 3. 🟣 Cachorro busca hogar amoroso
- **Tipo:** ADOPTION (Adopción)
- **Ubicación:** Plaza Vieja, Habana Vieja
- **Descripción:** Cachorro marrón y blanco de 3 meses

### 4. 🔴 Perro labrador perdido en Miramar
- **Tipo:** LOST (Perdido)
- **Ubicación:** 5ta Avenida, Miramar
- **Descripción:** Labrador dorado grande con RECOMPENSA

### 5. 🔵 Perro callejero necesita ayuda
- **Tipo:** SIGHTING (Avistamiento)
- **Ubicación:** Parque Central
- **Descripción:** Perro gris enfermo necesita atención

### 6. 🟣 Gata tricolor en adopción
- **Tipo:** ADOPTION (Adopción)
- **Ubicación:** Línea y Paseo, Vedado
- **Descripción:** Gata esterilizada y vacunada

## Solución de problemas

### ❌ Error: "No se pudo obtener un usuario"

**Solución:** No tienes usuarios registrados en tu base de datos.

1. Abre `http://localhost:5173`
2. Regístrate con un email
3. Verifica tu email si es necesario
4. Ejecuta el script de nuevo

### ❌ Error: "Faltan variables de entorno"

**Solución:** Verifica que tu archivo `.env` tenga las variables correctas.

```bash
# Ver el contenido de tu .env (sin mostrar las claves completas)
cat .env | grep VITE_SUPABASE_URL
cat .env | grep VITE_SUPABASE_ANON_KEY
```

### ❌ Error: "Permission denied" o "RLS"

**Solución:** Usa la clave de servicio (service_role) en lugar de la clave anónima.

Agrega a tu `.env`:
```env
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
```

La clave de servicio bypasea las políticas RLS y tiene permisos totales.

### ❌ Las publicaciones se crean pero no aparecen en el mapa

**Posibles causas:**

1. **Las coordenadas no se guardaron:** Abre la consola del navegador (F12) y busca errores
2. **Problema con RLS:** Verifica que las políticas de lectura estén habilitadas
3. **Cache del navegador:** Intenta con Ctrl+Shift+R para forzar recarga

**Debug:** Ejecuta esto en la consola de Supabase SQL Editor:

```sql
-- Ver si las publicaciones tienen coordenadas
SELECT 
  p.title,
  p.type,
  l.province,
  l.municipality,
  l.approximate_lat,
  l.approximate_lng
FROM publications p
LEFT JOIN locations l ON p.location_id = l.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### ❌ El script se ejecuta pero dice "0 publicaciones creadas"

**Debug:** Mira los errores específicos en la salida del script. Cada publicación mostrará el error si falla.

**Solución común:** Verifica que las tablas `profiles`, `locations`, `pets` y `publications` existan en Supabase.

## Verificar que todo funcione

### Checklist ✅

Después de ejecutar el seed, verifica:

- [ ] El script termina sin errores
- [ ] Muestra "✅ Publicaciones creadas: 6"
- [ ] Al abrir `/mapa` ves números > 0 en las estadísticas
- [ ] En el mapa aparecen marcadores con forma de patita
- [ ] Los marcadores tienen diferentes colores según el tipo
- [ ] Al hacer clic en un marcador se abre un popup con información
- [ ] En `/cerca-de-ti` aparecen las publicaciones con distancia en km
- [ ] Las distancias son razonables (todas en La Habana)

### Comandos útiles

```bash
# Ejecutar el seed
npm run seed:test

# Ver logs del servidor si está corriendo
# (en otra terminal)
npm run dev

# Si algo falla, revisar la consola del navegador
# Abre DevTools (F12) → Console
```

## Limpiar datos de prueba

Si quieres eliminar las publicaciones de prueba:

**Opción 1: SQL en Supabase**

Ve a Supabase → SQL Editor y ejecuta:

```sql
-- Eliminar publicaciones de usuarios de prueba
DELETE FROM publications WHERE owner_profile_id IN (
  SELECT id FROM profiles WHERE email LIKE 'test%@patitas.cu'
);

-- Eliminar mascotas de usuarios de prueba
DELETE FROM pets WHERE owner_profile_id IN (
  SELECT id FROM profiles WHERE email LIKE 'test%@patitas.cu'
);

-- Eliminar ubicaciones huérfanas (opcional)
DELETE FROM locations WHERE id NOT IN (
  SELECT DISTINCT location_id FROM publications WHERE location_id IS NOT NULL
);

-- Eliminar usuarios de prueba
DELETE FROM profiles WHERE email LIKE 'test%@patitas.cu';
```

**Opción 2: Desde la interfaz de Supabase**

1. Ve a **Table Editor**
2. Busca en la tabla `publications` las que tienen usuarios de prueba
3. Elimínalas manualmente

## ¿Necesitas más ayuda?

Si después de seguir estos pasos aún tienes problemas:

1. Copia el error exacto que ves
2. Comparte la salida del script de seed
3. Verifica los logs de la consola del navegador (F12)
4. Ejecuta la query SQL de debug arriba y comparte los resultados
