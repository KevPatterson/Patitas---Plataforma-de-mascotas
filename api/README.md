# API Serverless Functions

Esta carpeta contiene las serverless functions desplegadas en Vercel.

## Estructura Consolidada

Para optimizar el uso de recursos y mantenerse dentro del límite de Vercel (12 funciones), las funciones han sido consolidadas en endpoints unificados:

### 1. `/api/ai` - Funciones de Inteligencia Artificial

Endpoint unificado para todas las operaciones de IA.

**Uso:** `POST /api/ai?action=<action>`

**Actions disponibles:**
- `calculate-matches` - Calcular coincidencias entre publicaciones
- `create-match` - Crear un match entre dos publicaciones
- `detect-duplicates` - Detectar publicaciones duplicadas
- `extract-from-image` - Extraer datos de una imagen con IA
- `process-publication` - Iniciar procesamiento asíncrono de una publicación
- `process-job` - Procesar un job de IA específico (interno)

**Ejemplo:**
```typescript
const response = await fetch('/api/ai?action=extract-from-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ image: base64Image })
});
```

### 2. `/api/publications` - Gestión de Publicaciones

Endpoint unificado para operaciones relacionadas con publicaciones.

**Uso:** `POST /api/publications?action=<action>`

**Actions disponibles:**
- `create` - Validar creación de publicación (rate limiting)
- `validate-upload` - Validar subida de imágenes

**Ejemplo:**
```typescript
const response = await fetch('/api/publications?action=validate-upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    publicationId: 'uuid',
    fileSize: 2048000,
    mimeType: 'image/jpeg'
  })
});
```

### 3. `/api/admin/moderation` - Moderación

Endpoint para acciones de moderación (sin cambios).

**Uso:** `POST /api/admin/moderation`

**Actions disponibles:**
- `resolve-report` - Resolver un reporte
- `hide-publication` - Ocultar una publicación
- `restore-publication` - Restaurar una publicación
- `set-role` - Cambiar el rol de un usuario

### 4. `/api/health` - Health Check

Endpoint para verificar el estado de la API (sin cambios).

**Uso:** `GET /api/health`

## Folders

- `api/_lib/` - Utilidades compartidas (rate limiting, supabase admin, etc.)
- `api/ai/` - Implementaciones específicas de cada acción de IA (importadas dinámicamente)
- `api/admin/` - Funciones de administración

## Migración desde Endpoints Antiguos

Los siguientes endpoints han sido consolidados:

| Endpoint Antiguo | Nuevo Endpoint |
|-----------------|----------------|
| `POST /api/ai/calculate-matches` | `POST /api/ai?action=calculate-matches` |
| `POST /api/ai/create-match` | `POST /api/ai?action=create-match` |
| `POST /api/ai/detect-duplicates` | `POST /api/ai?action=detect-duplicates` |
| `POST /api/ai/extract-from-image` | `POST /api/ai?action=extract-from-image` |
| `POST /api/ai/process-publication` | `POST /api/ai?action=process-publication` |
| `POST /api/ai/process-job` | `POST /api/ai?action=process-job` |
| `POST /api/publications/create` | `POST /api/publications?action=create` |
| `POST /api/uploads/validate` | `POST /api/publications?action=validate-upload` |

## Rate Limits

Cada acción tiene su propio rate limit independiente:

| Acción | Límite | Ventana |
|--------|--------|---------|
| `calculate-matches` | 30 | 1 hora |
| `create-match` | 50 | 1 hora |
| `detect-duplicates` | 20 | 1 hora |
| `extract-from-image` | 5 | 1 minuto |
| `process-publication` | 20 | 1 hora |
| `publication-create` | 10 | 1 hora |
| `validate-upload` | 50 | 1 hora |
| `moderation` | 20 | 1 minuto |

## Deployment

Total de serverless functions: **4** (muy por debajo del límite de 12)

1. `api/ai.ts`
2. `api/publications.ts`
3. `api/admin/moderation.ts`
4. `api/health.ts`
