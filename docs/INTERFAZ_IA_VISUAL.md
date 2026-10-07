# Interfaz Visual del Sistema de IA

## 📱 Vista en la Página de Publicación

```
┌─────────────────────────────────────────────────────────────┐
│                    PÁGINA DE PUBLICACIÓN                    │
├────────────────────────────┬────────────────────────────────┤
│                            │                                │
│  [Imagen de la Mascota]    │  ┌─────────────────────────┐  │
│                            │  │  🎨 Analizar con IA     │  │
│  Título: Perro perdido     │  │  [Botón púrpura]        │  │
│                            │  └─────────────────────────┘  │
│  Descripción:              │                                │
│  Se perdió cerca de...     │  ┌─────────────────────────┐  │
│                            │  │ 📊 Procesamiento        │  │
│  Características:          │  │                         │  │
│  • Especie: Perro          │  │ Moderación: ✅ Listo    │  │
│  • Color: Marrón           │  │ Embeddings: 🔄 Procesando│  │
│  • Tamaño: Mediano         │  │ OCR: ⏳ Pendiente       │  │
│                            │  │ Análisis Visual: ✅ Listo│  │
│                            │  │                         │  │
│                            │  │ Estado: Completado      │  │
│                            │  └─────────────────────────┘  │
│                            │                                │
│                            │  ┌─────────────────────────┐  │
│                            │  │ ⚠️  Posible Duplicado  │  │
│                            │  │                         │  │
│                            │  │ Detectamos una          │  │
│                            │  │ publicación similar     │  │
│                            │  │ (85% probabilidad)      │  │
│                            │  │                         │  │
│                            │  │ 🏷️ Texto similar       │  │
│                            │  │ 📍 Misma ubicación      │  │
│                            │  │ 📅 Misma fecha          │  │
│                            │  │                         │  │
│                            │  │ [Ver Similar] [Ignorar] │  │
│                            │  └─────────────────────────┘  │
│                            │                                │
│                            │  ┌─────────────────────────┐  │
│                            │  │ 🎯 Coincidencias IA     │  │
│                            │  │                      3  │  │
│                            │  ├─────────────────────────┤  │
│                            │  │                         │  │
│                            │  │ [Imagen] Perro marrón   │  │
│                            │  │          Vedado, Habana │  │
│                            │  │                         │  │
│                            │  │ 87% match 🎯            │  │
│                            │  │                         │  │
│                            │  │ Scores:                 │  │
│                            │  │ Estructurado: 90%       │  │
│                            │  │ Visual: 85%             │  │
│                            │  │ Semántico: 78%          │  │
│                            │  │                         │  │
│                            │  │ • Misma especie         │  │
│                            │  │ • Color similar         │  │
│                            │  │ • Misma provincia       │  │
│                            │  │                         │  │
│                            │  │ [❤️ Confirmar] [❌]     │  │
│                            │  │                         │  │
│                            │  ├─────────────────────────┤  │
│                            │  │                         │  │
│                            │  │ [Más matches...]        │  │
│                            │  │                         │  │
│                            │  └─────────────────────────┘  │
│                            │                                │
│                            │  ┌─────────────────────────┐  │
│                            │  │ 📍 Ubicación            │  │
│                            │  │ Vedado, Habana          │  │
│                            │  │ 📅 15 de enero          │  │
│                            │  └─────────────────────────┘  │
│                            │                                │
│                            │  ┌─────────────────────────┐  │
│                            │  │ ⚡ Acciones              │  │
│                            │  │ [Marcar Resuelto]       │  │
│                            │  │ [Compartir]             │  │
│                            │  │ [Reportar]              │  │
│                            │  └─────────────────────────┘  │
└────────────────────────────┴────────────────────────────────┘
```

---

## 👮 Vista del Panel de Administración

```
┌─────────────────────────────────────────────────────────────┐
│                   PANEL DE ADMINISTRACIÓN                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Resumen] [Reportes] [🔄 Duplicados] [🛡️ Moderación IA]  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║             DUPLICADOS DETECTADOS            3 pendientes│
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║                                                        ║ │
│  ║  📋 Publicación A vs Publicación B                    ║ │
│  ║  ─────────────────────────────────────────────────    ║ │
│  ║  92% probabilidad                Score: 87           ║ │
│  ║                                                        ║ │
│  ║  🏷️ Texto idéntico   📍 Misma ubicación               ║ │
│  ║  📅 Misma fecha      🖼️ Misma imagen                 ║ │
│  ║                                                        ║ │
│  ║  Publicación A: Perro perdido en Vedado              ║ │
│  ║  [👁️ Ver publicación]                                 ║ │
│  ║                                                        ║ │
│  ║  Publicación B: Se perdió perro marrón en Vedado     ║ │
│  ║  [👁️ Ver publicación]                                 ║ │
│  ║                                                        ║ │
│  ║  [✅ Es duplicado]  [❌ No es duplicado]              ║ │
│  ║                                                        ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║                                                        ║ │
│  ║  [Más duplicados...]                                  ║ │
│  ║                                                        ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║           COLA DE MODERACIÓN IA          2 pendientes ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║                                                        ║ │
│  ║  ⚠️ Contenido Detectado                               ║ │
│  ║  ─────────────────────────────────────────────────    ║ │
│  ║  [🚨 SPAM] 95% confianza                              ║ │
│  ║                                                        ║ │
│  ║  Publicación: "Gana dinero rápido con..."            ║ │
│  ║  [👁️ Ver publicación]                                 ║ │
│  ║                                                        ║ │
│  ║  Razón: Contiene palabras clave de spam              ║ │
│  ║  Detectado: 15 ene, 14:30                            ║ │
│  ║                                                        ║ │
│  ║  [✅ Aprobar]  [❌ Rechazar]                          ║ │
│  ║                                                        ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║                                                        ║ │
│  ║  [Más items...]                                       ║ │
│  ║                                                        ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Código de Colores

Los componentes usan colores consistentes con el diseño de Patitas:

- **🟣 Púrpura** (`purple`): Componentes de IA y funciones inteligentes
- **🔵 Turquoise** (`turquoise`): Información y estados neutros
- **🟠 Naranja** (`orange`): Alertas y acciones importantes
- **🟢 Verde** (`found`): Estados exitosos y confirmaciones
- **🔴 Rojo** (`lost`): Errores y rechazos
- **⚫ Navy** (`navy`): Texto principal

---

## 📊 Estados Visuales

### Botón "Analizar con IA"

```
┌─────────────────────────┐
│  ✨ Analizar con IA     │  ← Estado normal (púrpura)
└─────────────────────────┘

┌─────────────────────────┐
│  🔄 Procesando...       │  ← Cargando (spinner animado)
└─────────────────────────┘

┌─────────────────────────┐
│  ✅ Procesamiento       │  ← Éxito (verde, desaparece en 3s)
│     iniciado            │
└─────────────────────────┘
```

### Estado de Procesamiento

```
┌─────────────────────────────┐
│ 📊 Procesamiento            │
│                             │
│ Moderación:    ✅ Listo     │  ← Verde
│ Embeddings:    🔄 Procesando│  ← Naranja animado
│ OCR:           ⏳ Pendiente  │  ← Gris
│ Visual:        ❌ Error      │  ← Rojo
│                             │
│ Estado: Procesando          │
└─────────────────────────────┘
```

### Match Card

```
┌─────────────────────────────────────┐
│ [87% match 🎯]  [🔄 Perdida/Encontrada] │
│                                     │
│ ┌────┐  Perro marrón               │
│ │Img │  Vedado, La Habana          │
│ └────┘  15 ene                     │
│                                     │
│ Razones:                           │
│ • Misma especie                    │
│ • Color similar                    │
│ • Misma provincia                  │
│                                     │
│ Scores:                            │
│ Estructurado  ████████░░ 90%       │
│ Visual        ████████░░ 85%       │
│ Semántico     ███████░░░ 78%       │
│                                     │
│ [❤️ Confirmar match]  [❌]          │
└─────────────────────────────────────┘
```

---

## 🔔 Notificaciones y Feedback

### Mensajes de Éxito
```
┌─────────────────────────────────┐
│ ✅ Procesamiento iniciado.      │
│    Los resultados aparecerán    │
│    pronto.                      │
└─────────────────────────────────┘
```

### Mensajes de Error
```
┌─────────────────────────────────┐
│ ❌ Error al procesar            │
│    No hay sesión activa         │
└─────────────────────────────────┘
```

### Tooltips Informativos
```
💡 La IA analizará esta publicación para detectar
   duplicados, extraer información y buscar coincidencias.
```

---

## 📱 Responsive

En móvil, los componentes se apilan verticalmente manteniendo la misma jerarquía:

1. Botón de procesamiento (si eres dueño)
2. Estado de procesamiento
3. Alerta de duplicados (si existen)
4. Matches de IA (si existen)
5. Detalles de ubicación
6. Acciones

---

## 🎭 Animaciones

- **Spinner**: Rotación continua durante procesamiento
- **Pulse**: En badges de estado "Procesando"
- **Fade-in**: Cuando aparecen nuevos resultados
- **Slide-up**: Al mostrar alertas de duplicados
- **Bounce**: En iconos de éxito

---

## 🚀 Flujo de Usuario Visual

```
Usuario entra a su publicación
         ↓
Ve botón "Analizar con IA" (púrpura)
         ↓
Hace clic
         ↓
Botón cambia a "Procesando..." (spinner)
         ↓
Aparece mensaje "✅ Procesamiento iniciado"
         ↓
Aparece badge de "Estado de Procesamiento"
│
├─ Moderación: 🔄 Procesando
├─ Embeddings: ⏳ Pendiente
├─ OCR: ⏳ Pendiente
└─ Visual: ⏳ Pendiente
         ↓
[Actualización en tiempo real vía Realtime]
         ↓
Estados cambian a ✅ uno por uno
         ↓
Si hay duplicados → Aparece alerta ⚠️
         ↓
Si hay matches → Aparece panel 🎯
         ↓
Usuario puede interactuar con los resultados
```

---

Esta interfaz está diseñada para ser **intuitiva**, **no intrusiva** y **progresivamente mejorada** con las capacidades de IA.
