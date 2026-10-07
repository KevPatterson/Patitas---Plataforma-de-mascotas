# Optimización de Serverless Functions

## Resumen

Las serverless functions han sido consolidadas para optimizar el despliegue en Vercel y mantenerse muy por debajo del límite de 12 funciones.

## Estado Actual

**Total de funciones desplegadas: 4**

### Funciones Activas

1. **`/api/ai`** - Endpoint unificado de IA
   - Maneja 6 acciones diferentes mediante query parameter `?action=`
   - Importación dinámica de handlers específicos
   - Rate limiting independiente por acción

2. **`/api/publications`** - Gestión de publicaciones
   - Maneja 2 acciones: `create` y `validate-upload`
   - Consolidó endpoints de publicaciones y uploads

3. **`/api/admin/moderation`** - Moderación
   - Sin cambios, ya era único
   - Acciones: resolve-report, hide-publication, restore-publication, set-role

4. **`/api/health`** - Health check
   - Sin cambios
   - Verifica estado de API, base de datos y storage

## Migración Realizada

### Antes (9 funciones)

```
api/
├── ai/
│   ├── calculate-matches.ts      ❌
│   ├── create-match.ts           ❌
│   ├── detect-duplicates.ts      ❌
│   ├── extract-from-image.ts     ❌
│   ├── process-job.ts            ❌
│   └── process-publication.ts    ❌
├── admin/
│   └── moderation.ts             ✅
├── publications/
│   └── create.ts                 ❌
├── uploads/
│   └── validate.ts               ❌
└── health.ts                     ✅
```

### Después (4 funciones)

```
api/
├── ai.ts                         ✅ (consolida 6 endpoints)
├── publications.ts               ✅ (consolida 2 endpoints)
├── admin/
│   └── moderation.ts             ✅
├── health.ts                     ✅
└── ai/ (helpers internos, no desplegados como funciones)
    ├── calculate-matches.ts
    ├── create-match.ts
    ├── detect-duplicates.ts
    ├── extract-from-image.ts
    ├── process-job.ts
    └── process-publication.ts
```

## Estrategia de Consolidación

### 1. Router Pattern

En lugar de tener una función por endpoint, usamos un patrón de router:

```typescript
// api/ai.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;
  
  switch (action) {
    case 'extract-from-image':
      return (await import('./ai/extract-from-image')).default(req, res);
    case 'calculate-matches':
      return (await import('./ai/calculate-matches')).default(req, res);
    // ... más acciones
  }
}
```

### 2. Importación Dinámica

Los handlers específicos se importan dinámicamente solo cuando se necesitan:

- Reduce el tamaño del bundle inicial
- Cada acción mantiene su código aislado
- Facilita el mantenimiento y testing

### 3. Query Parameters

Las acciones se especifican mediante query parameters:

**Antes:**
```
POST /api/ai/extract-from-image
POST /api/ai/calculate-matches
```

**Después:**
```
POST /api/ai?action=extract-from-image
POST /api/ai?action=calculate-matches
```

## Actualización del Frontend

### Cambio en Image Data Extractor

```typescript
// Antes
const response = await fetch('/api/ai/extract-from-image', {
  method: 'POST',
  body: JSON.stringify({ image: base64Image })
});

// Después
const response = await fetch('/api/ai?action=extract-from-image', {
  method: 'POST',
  body: JSON.stringify({ image: base64Image })
});
```

## Beneficios

1. **Optimización de recursos**
   - De 9 funciones a 4 (reducción del 56%)
   - Margen amplio para crecimiento (8 slots disponibles)

2. **Mejor organización**
   - Endpoints relacionados agrupados lógicamente
   - Documentación centralizada por dominio

3. **Mantenimiento simplificado**
   - Un solo punto de entrada por dominio
   - Rate limiting consistente
   - Manejo de errores unificado

4. **Compatibilidad**
   - Los handlers internos mantienen su estructura
   - Fácil rollback si es necesario
   - Testing individual preservado

## Rate Limits Preservados

Cada acción mantiene su rate limit independiente:

| Acción | Límite | Ventana |
|--------|--------|---------|
| `extract-from-image` | 5 | 1 minuto |
| `calculate-matches` | 30 | 1 hora |
| `create-match` | 50 | 1 hora |
| `detect-duplicates` | 20 | 1 hora |
| `process-publication` | 20 | 1 hora |
| `process-job` | Interno | - |
| `publication-create` | 10 | 1 hora |
| `validate-upload` | 50 | 1 hora |

## Monitoreo

Para verificar el estado en producción:

```bash
# Health check
curl https://tu-dominio.vercel.app/api/health

# Probar endpoint de IA
curl -X POST https://tu-dominio.vercel.app/api/ai?action=extract-from-image \
  -H "Content-Type: application/json" \
  -d '{"image": "base64..."}'
```

## Próximos Pasos

Si se necesitan más funciones en el futuro:

1. Evaluar si pueden consolidarse en endpoints existentes
2. Si no, crear nueva función solo cuando sea necesario
3. Mantener margen de al menos 2-3 slots libres
4. Considerar backend separado si se excede límite regularmente

## Referencias

- [Vercel Serverless Functions Limits](https://vercel.com/docs/functions/serverless-functions/limits)
- [Dynamic Imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- Documentación completa: `api/README.md`
