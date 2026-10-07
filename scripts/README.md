# Scripts de Patitas

## Seed de publicaciones de prueba

### Instalación

Primero, instala las dependencias si no lo has hecho:

```bash
npm install
```

### Configuración

Asegúrate de tener tu archivo `.env` configurado con las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio (opcional, pero recomendado)
```

### Uso

Ejecuta el script para insertar 6 publicaciones de prueba en La Habana:

```bash
npm run seed:test
```

### ¿Qué hace el script?

1. **Crea 3 usuarios de prueba:**
   - `test1@patitas.cu` (maria_hdez)
   - `test2@patitas.cu` (carlos_lopez)
   - `test3@patitas.cu` (ana_garcia)

2. **Inserta 6 publicaciones variadas:**
   - 2 Perdidos (LOST)
   - 1 Encontrado (FOUND)
   - 2 En adopción (ADOPTION)
   - 1 Avistamiento (SIGHTING)

3. **Ubicaciones en La Habana:**
   - Malecón (Centro Habana)
   - Vedado (Plaza de la Revolución)
   - Plaza Vieja (Habana Vieja)
   - Miramar (Playa)
   - Parque Central (Habana Vieja)
   - Línea y Paseo (Plaza de la Revolución)

4. **Coordenadas difuminadas:**
   - Cada ubicación tiene una difuminación de ±50 metros
   - Coordenadas reales de lugares conocidos en La Habana

### Verificar resultados

Después de ejecutar el script, verifica que las publicaciones aparezcan en:

- **Mapa:** http://localhost:5173/mapa
- **Cerca de ti:** http://localhost:5173/cerca-de-ti
- **Búsqueda:** http://localhost:5173/buscar

### Salida esperada

```
🌱 Iniciando seed de publicaciones de prueba...

✅ Usuario existente encontrado: test1@patitas.cu
✅ Usuario existente encontrado: test2@patitas.cu
✅ Usuario existente encontrado: test3@patitas.cu

📝 Creando 6 publicaciones...

✅ [1/6] Perrita blanca perdida en el Malecón
   📍 Malecón (23.1418, -82.3643)
   🔗 /p/perrita-blanca-perdida-en-el-malecon-1234567890-0

✅ [2/6] Gato negro encontrado en Vedado
   📍 Vedado (23.1377, -82.3872)
   🔗 /p/gato-negro-encontrado-en-vedado-1234567891-1

...

==================================================
✅ Publicaciones creadas: 6
❌ Errores: 0
==================================================

🗺️  Puedes ver las publicaciones en:
   - Mapa: http://localhost:5173/mapa
   - Cerca de ti: http://localhost:5173/cerca-de-ti
   - Buscar: http://localhost:5173/buscar
```

### Solución de problemas

**Error: "Faltan variables de entorno"**
- Verifica que tu archivo `.env` tenga `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

**Error: "Permission denied"**
- Si usas `VITE_SUPABASE_ANON_KEY`, verifica que las políticas RLS permitan inserción
- Mejor opción: usa `SUPABASE_SERVICE_ROLE_KEY` para el script

**Error: "duplicate key value violates unique constraint"**
- El script puede ejecutarse varias veces, creará publicaciones con slugs únicos
- Si los usuarios ya existen, los reutiliza

### Limpiar datos de prueba

Para eliminar las publicaciones de prueba:

```sql
-- En Supabase SQL Editor
DELETE FROM publications WHERE owner_profile_id IN (
  SELECT id FROM profiles WHERE email LIKE 'test%@patitas.cu'
);

DELETE FROM pets WHERE owner_profile_id IN (
  SELECT id FROM profiles WHERE email LIKE 'test%@patitas.cu'
);

DELETE FROM profiles WHERE email LIKE 'test%@patitas.cu';
```
