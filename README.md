# 🐾 PATITAS — Ayudemos a que vuelvan a casa

Plataforma comunitaria de mascotas **perdidas, encontradas, abandonadas y en adopción**.
Centraliza en un solo lugar lo que hoy se dispersa por estados de WhatsApp, Instagram y
Facebook: información estructurada, buscable, geolocalizada y orientada a resultados.

**Contexto inicial:** Cuba (provincias y municipios). La arquitectura permite expandirse
a otros países.

> 🎨 **Nuevo:** Rediseño visual completo **Anime Edition** implementado. Ver [REDISENO_ANIME_EDITION.md](./REDISENO_ANIME_EDITION.md) para detalles.

---

## 🏗️ Arquitectura
React + TypeScript + Vite (SPA)
│  HTTPS
▼
Vercel
├── SPA Hosting
└── Serverless Functions (/api/*)  ← únicamente operaciones privilegiadas
│
▼
Supabase
├── PostgreSQL (+ RLS en TODAS las tablas)
├── Auth (email + OAuth-ready)
├── Storage (pet-images, avatares)
└── Realtime (notificaciones, selectivo)
plain

**Principio:** el cliente habla **directo con Supabase** para el CRUD permitido por RLS.
Las Vercel Functions solo se usan para operaciones con privilegios/secretos
(moderación, auditoría, webhooks, futuras integraciones IA/OCR).

**Prohibido por diseño:** Railway, Hono, tRPC, Drizzle, MySQL, Node persistente,
Express, Prisma. No hay capa backend innecesaria.

---

## 🚀 Setup local

### Requisitos
- Node.js ≥ 18
- CLI de Supabase (`npm i -g supabase`)

### 1. Clonar y dependencias
```bash
git clone <repo> && cd patitas
npm install
2. Supabase local (o proyecto cloud)
bash
supabase init            # si usas supabase local
supabase start
supabase db reset        # aplica migrations/ + seed.sql
O en supabase.com: crea el proyecto, abre el SQL Editor y ejecuta
en orden supabase/migrations/0001_schema.sql, 0002_rls.sql, 0003_functions.sql
(y opcionalmente seed.sql — solo desarrollo).
3. Variables de entorno
bash
cp .env.example .env.local
Table
Variable	Dónde	Descripción
VITE_SUPABASE_URL	cliente	URL pública del proyecto
VITE_SUPABASE_ANON_KEY	cliente	anon key (segura para el navegador gracias a RLS)
SUPABASE_URL	solo servidor	URL para las Functions
SUPABASE_SERVICE_ROLE_KEY	solo servidor	⚠️ NUNCA con prefijo VITE_. Rompe RLS: solo en Vercel
4. Arrancar
bash
npm run dev          # http://localhost:5173
Usuarios de prueba (seed): ana@patitas.dev, luis@patitas.dev (USER),
mod@patitas.dev (MODERATOR) — contraseña: patitas123 (solo dev local).
🧩 Stack
Table
Área	Tecnología
Frontend	React 18 + TypeScript (estricto) + Vite
Estilos	Tailwind CSS + Design System propio (src/styles/index.css)
Ruteo	React Router v6 (lazy + protección de rutas)
Datos	TanStack Query + Supabase JS
Formularios	React Hook Form + Zod (validaciones compartidas con api/)
Mapa	Leaflet + OpenStreetMap (sin API keys)
Backend gestionado	Supabase: Postgres, Auth, RLS, Storage, Realtime
Serverless	Vercel Functions (api/*)
PWA	manifest + service worker básico
🗂️ Estructura
plain
patitas/
├── api/                    # Vercel Serverless Functions (privilegios/secretos)
│   ├── _lib/               # http, auth, rateLimit, supabaseAdmin, audit
│   ├── admin/              # reports.ts, publications.ts, action.ts
│   └── health.ts
├── src/
│   ├── components/
│   │   ├── ui/             # Button, Field, Modal, Toast, Logo, TypeBadge…
│   │   ├── layout/         # Navbar, BottomNav, Footer, ProtectedRoute
│   │   ├── pets/           # PetCard, ResolvedBanner
│   │   ├── publications/   # FilterBar, ShareButtons, ReportModal
│   │   └── map/            # MapView, LocationPicker
│   ├── features/→ hooks/   # useAuth, usePublications, useAdmin, useNotifications
│   ├── lib/
│   │   ├── supabase/       # cliente singleton
│   │   ├── validations/    # Zod compartido cliente/servidor
│   │   └── utils/          # cn, format, share
│   ├── routes/             # una página por archivo (lazy)
│   ├── styles/             # tokens del Design System + tema leaflet
│   └── types/              # tipos fuertes (espejo del esquema SQL)
├── supabase/
│   ├── migrations/         # 0001_schema, 0002_rls, 0003_functions
│   ├── seed.sql            # MOCK — solo desarrollo
│   └── config.toml
├── public/                 # PWA (manifest, sw.js, favicon)
├── .env.example
└── vercel.json             # security headers + SPA fallback
🗄️ Modelo de datos (PostgreSQL)
profiles · pets · publications · publication_images · locations · sightings ·
reports · notifications · comments · adoption_requests · audit_logs · match_signals
UUIDs, FKs, constraints, created_at/updated_at/deleted_at.
Full-text search: search_tsv GIN sobre título+descripción.
Índices para feed, filtros y mapa.
Ubicación difuminada: el trigger set_fuzzy_location aleatoriza
fuzzy_lat/lng (±~350 m). El cliente jamás recibe lat/lng exactas
(sin grants de columna). Las publicaciones nunca revelan direcciones exactas.
🔐 Seguridad
RLS activo en todas las tablas. La autorización no depende del frontend.
Columnas sensibles (profiles.phone, pets.microchip) protegidas por
column-level grants — no solo por convenios del cliente.
service_role_key solo en variables de servidor de Vercel (sin VITE_).
Las Functions revalidan identidad y rol con el token del llamante.
Rate limiting en /api/* (por instancia; intercambiable por KV/Upstash).
Headers de seguridad en vercel.json, límite de payload (100 KB),
validación Zod en el borde del servidor, errores genéricos al cliente,
detalles solo en logs.
Storage: buckets pet-images/avatars, lectura pública (necesaria para
previews de compartir), escritura solo en la carpeta uid del usuario.
Resumen de políticas RLS
Table
Tabla	Público	Autenticado	Moderador	Admin
profiles	vía public_profiles (no sensible)	lee/actualiza lo suyo	SELECT	todo
pets	si tiene publicación activa	CRUD propio	SELECT	todo
publications	SELECT ACTIVE	CRUD propio	ocultar/restaurar	DELETE
locations	coordenadas fuzzy	insert/update propio	—	—
reports	—	crear + ver las suyas	gestionar	gestionar
notifications	—	solo las suyas	—	—
audit_logs	—	—	SELECT	SELECT
🎨 Design System — Anime Edition

**Sistema de diseño completamente rediseñado** con identidad visual única inspirada en anime moderno.

### Paleta de Colores
- **Navy** (#1a2332) — Color principal estructural
- **Cream** (#fef8f0) — Fondo cálido que reemplaza el blanco
- **Orange** (#ff8c42) — Acento principal vibrante
- **Turquoise** (#4ecdc4) — Acento secundario fresco
- **Purple** (#a78bfa) — Adopción y elementos emocionales
- **Lost** (#ef4444) — Casos perdidos
- **Found** (#10b981) — Casos encontrados

### Componentes Clave
- **PawLoader** — Loader personalizado con huella animada
- **EmptyState / ErrorState** — Estados con personalidad y mascotas
- **PublicationCard** — Rediseñada con hover effects, emojis y gradientes
- **Button** — 5 variantes (primary, secondary, adoption, ghost, danger) con microinteracciones
- **StatCard** — Cards con iconos y efectos hover
- **Logo** — Animado con gradientes y transformaciones

### Animaciones
- **paw-bounce** — Huellas rebotando (identidad de marca)
- **float** — Flotación suave para elementos decorativos
- **paw-pulse** — Pulso de loader
- **shake** — Feedback de error
- **fade-up** — Entrada de secciones
- **blob-morph** — Decoraciones orgánicas animadas

### Hero Principal
Hero completamente rediseñado con el mensaje:
> **"Cada patita merece volver a casa"**

Incluye: gradientes anime, decoraciones con huellas, blobs animados, mini estadísticas y CTAs destacados.

### Características
✅ **Accesibilidad** — Focus visible, ARIA labels, soporte `prefers-reduced-motion`  
✅ **Responsive** — Mobile first, optimizado de 320px a 1920px  
✅ **Performance** — Animaciones CSS optimizadas, lazy loading  
✅ **Microinteracciones** — Feedback visual en cada acción  

Ver documentación completa en [REDISENO_ANIME_EDITION.md](./REDISENO_ANIME_EDITION.md)

---
✅ Estado por fases
Table
Fase	Estado
1. Arquitectura + Design System	✅
2. Supabase: schema + RLS + functions + seed	✅
3. Auth (registro/login/recuperar/protección)	✅
4. Publicaciones: wizard + Storage	✅
5. Búsqueda + filtros (full-text + índices)	✅
6. Mapa (Leaflet, coordenadas difuminadas)	✅
7. Compartir (enlace/WA/FB/TG/WebShare) + JSON-LD	✅
8. Reportes + moderación (/admin + Functions)	✅
9. Notificaciones + Realtime (selectivo)	✅
10. Coincidencias (heurística SQL + notificaciones)	✅
11. Testing	⚠️ estructura lista (vitest/playwright en devDeps); añadir specs
12. Security hardening	✅ (headers, RLS, rate limit, column grants)
13. Producción	📝 ver despliegue abajo
🌐 Despliegue (Vercel + Supabase)
Push a GitHub → importar repo en Vercel (framework: Vite, auto-detectado).
En Vercel → Settings → Environment Variables: añade SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY, SITE_URL, límites de rate limit.
Nunca añadas la service key como VITE_*.
En Supabase cloud: aplica las 3 migraciones y configura Auth
(Site URL = tu dominio Vercel, redirect URLs).
Habilita Realtime para notifications en Supabase → Database → Replication.
Preview deployments automáticos por PR.
📜 Convenciones
Commits semánticos: feat(auth): …, fix(rls): restrict publication updates to owners.
TypeScript estricto, sin any, ESLint + Prettier, HTML semántico, focus visible,
aria-* en interactivos, contraste AA.
❤️ Producto
Patitas no es "otro sitio de anuncios": es el lugar donde buscas cuando una
mascota desaparece. Perdí → busco → filtro por zona → reviso el mapa →
encuentro coincidencias → contacto → recupero → marco resuelto.
plain

---

## ⚠️ Nota de verificación y cierre

No pude ejecutar `npm install` ni `npm run build` en este entorno (sin red ni Node), así que **te pido verificar localmente**: `npm install && npm run dev` con Supabase local, y `npm run build` antes del deploy. Lo entregado está escrito contra las APIs reales (`@supabase/supabase-js` v2, TanStack Query v5, RHF v7, Leaflet 1.9, Vite 5); el flujo de datos críticos (RLS, difuminado de coordenadas, coincidencias, notificaciones) vive en SQL y se valida con `supabase db reset`.

El proyecto completo quedó en **`/mnt/agents/output/patitas/`** con el **README.md incluido y actualizado en la raíz**, tal como pediste. 🐾