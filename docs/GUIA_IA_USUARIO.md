# Guía de Usuario: Sistema de IA en Patitas

## 📌 Cómo Interactuar con los Componentes de IA

El sistema de IA de Patitas está diseñado para ayudarte automáticamente a encontrar mascotas y mejorar tus publicaciones. Aquí te explicamos cómo funciona y qué verás en la interfaz.

---

## 🎯 Para Usuarios Regulares

### 0️⃣ **Al Crear una Publicación - Asistente IA** ✨ NUEVO

En el formulario de publicación, específicamente en el **Paso 2: Información de la mascota**, encontrarás el nuevo **Asistente IA para Formulario**.

#### **Cómo funciona**:
1. Sube una imagen del animal (puede ser una foto del animal o un cartel/póster)
2. Haz clic en "Extraer datos con IA"
3. La IA analiza la imagen en dos niveles:
   
   **A) Análisis visual del animal:**
   - **Especie** (Perro, Gato, etc.)
   - **Raza** (si es identificable)
   - **Sexo** (si es visible en la imagen)
   - **Tamaño** (Pequeño, Mediano, Grande)
   - **Edad aproximada** (Cachorro, Joven, Adulto, Anciano)
   - **Color principal**
   - **Características distintivas**
   - **Collar** (si es visible)
   - **Placa** (si es visible)
   
   **B) OCR de texto en la imagen (si hay cartel/póster):**
   - **Ubicación** (Provincia, Municipio, Zona)
   - **Recompensa** (si se menciona)
   - **Fecha del evento** (si aparece)
   - **Hora** (si aparece)
   - **Información de contacto** (Teléfono, WhatsApp, Email)
   - **Modo de contacto preferido**

4. Los datos se rellenan automáticamente en los campos correspondientes del formulario
5. **Revisa y edita** cualquier dato antes de publicar

#### **Ventajas**:
- ⚡ **Ahorra tiempo**: No tienes que escribir todos los datos manualmente
- 🎯 **Mayor precisión**: La IA detecta detalles que podrías olvidar
- 📸 **Extrae de carteles**: Si subes una foto de un póster/cartel, extrae texto
- 📝 **Editable**: Puedes corregir cualquier dato extraído
- 🔒 **Privado**: La imagen solo se usa para extracción, no se guarda

#### **Limitaciones**:
- La imagen debe ser clara y bien iluminada
- Para OCR, el texto debe ser legible (no borroso ni muy pequeño)
- Algunos datos pueden no ser detectables (como el sexo del animal)
- La precisión varía según la calidad de la imagen
- Siempre revisa los datos antes de publicar

#### **Casos de uso**:
1. **Foto directa del animal**: Extrae características físicas
2. **Cartel impreso**: Extrae tanto características como datos de contacto/ubicación del texto
3. **Póster digital fotografiado**: Extrae toda la información visible
4. **Screenshot de red social**: Puede extraer datos del texto superpuesto

#### **Ejemplo de uso completo**:
```
Escenario: Fotografiaste un cartel de "Perro Perdido" pegado en un poste

1. Subes la foto del cartel al Asistente IA
2. El cartel dice:
   "PERRO PERDIDO
   Labrador marrón y blanco
   Perdido el 3 de octubre cerca del Vedado, Plaza
   Collar rojo con placa
   RECOMPENSA 1000 CUP
   Llamar al 5352123456"

3. La IA detecta y extrae:
   Visual:
   - Especie: Perro
   - Raza: Labrador
   - Color: Marrón y blanco
   - Collar: Sí
   - Placa: Sí
   
   Texto (OCR):
   - Provincia: La Habana
   - Municipio: Plaza de la Revolución
   - Zona: Vedado
   - Fecha: 2026-10-03
   - Recompensa: 1000 CUP
   - Teléfono: 5352123456
   - Modo de contacto: PHONE

4. Revisas que todo es correcto
5. Editas cualquier detalle si es necesario
6. Continúas con el resto del formulario (ya casi completo)
```

---

### 1️⃣ **En la Página de Tu Publicación**

Cuando visites una publicación que te pertenece, verás varios componentes de IA en la columna lateral derecha:

#### **Botón "Analizar con IA"** ✨
- **Ubicación**: Parte superior de la columna lateral (solo para propietarios)
- **Función**: Inicia el procesamiento inteligente de tu publicación
- **Qué hace**:
  - Busca duplicados automáticamente
  - Extrae información de las imágenes (OCR)
  - Analiza el contenido visual
  - Genera embeddings para búsqueda semántica
  - Modera el contenido automáticamente

**Cómo usarlo:**
1. Haz clic en "Analizar con IA"
2. Espera 5-10 segundos
3. Verás una confirmación: "✅ Procesamiento iniciado"
4. Los resultados aparecerán automáticamente abajo

---

#### **Estado de Procesamiento** 📊
- **Ubicación**: Debajo del botón de análisis
- **Muestra**:
  - ⏳ **Pendiente**: Aún no procesado
  - 🔄 **Procesando**: Analizando ahora
  - ✅ **Completado**: Análisis terminado
  - ❌ **Error**: Algo falló (puedes reintentar)

**Estados específicos**:
- **Moderación**: Verifica que el contenido sea apropiado
- **Embeddings**: Crea representación vectorial para búsquedas
- **OCR**: Extrae texto de imágenes
- **Análisis Visual**: Identifica características de la mascota

---

#### **Alerta de Duplicados** ⚠️
- **Aparece cuando**: El sistema detecta otra publicación muy similar
- **Muestra**:
  - Porcentaje de similitud
  - Razones (texto similar, misma ubicación, misma fecha, misma imagen)
  - Botón para ver la publicación duplicada

**Acciones**:
- **Ver publicación similar**: Abre la otra publicación para compararla
- **Ignorar**: Oculta la alerta si sabes que no es duplicado

---

#### **Coincidencias de IA** 🎯
- **Solo para publicaciones LOST/FOUND**
- **Muestra**: Posibles matches entre mascotas perdidas y encontradas
- **Información del match**:
  - Score general (0-100%)
  - Desglose de scores:
    - **Estructurado**: Basado en especie, color, tamaño, ubicación
    - **Semántico**: Basado en similitud de texto
    - **Visual**: Basado en similitud de imágenes
  - Razones del match
  - Vista previa de la publicación coincidente

**Acciones**:
- **❤️ Confirmar match**: Si crees que es la misma mascota
- **❌ Descartar**: Si no es un match válido

---

### 2️⃣ **En Cualquier Publicación (No Propietario)**

Si visitas una publicación de otra persona, verás:

#### **Coincidencias de IA** (si existen)
- Solo verás matches confirmados o de alta probabilidad
- No puedes iniciar procesamiento (solo el dueño puede)

---

## 👮 Para Moderadores y Administradores

### En el Panel de Administración (`/admin`)

#### **Pestaña "Duplicados"** 📋
- **Función**: Revisar publicaciones que el sistema detectó como posibles duplicados
- **Vista**:
  - Lista de pares de publicaciones similares
  - Porcentaje de probabilidad de duplicado
  - Indicadores de similitud (texto, imagen, ubicación, fecha)
  - Enlaces a ambas publicaciones

**Acciones**:
- **✅ Es duplicado**: Confirma que son la misma publicación
- **❌ No es duplicado**: Descarta la detección

---

#### **Pestaña "Moderación IA"** 🛡️
- **Función**: Revisar contenido que la IA marcó como potencialmente problemático
- **Clasificaciones**:
  - **SPAM**: Posible spam
  - **FRAUD**: Posible estafa
  - **OFFENSIVE**: Contenido ofensivo
  - **INAPPROPRIATE**: Contenido inapropiado
  - **UNRELATED**: No relacionado con mascotas
  - **UNCERTAIN**: La IA no está segura

**Vista**:
- Clasificación y confianza (%)
- Razón del flag
- Enlace a la publicación
- Fecha de detección

**Acciones**:
- **✅ Aprobar**: El contenido es apropiado
- **❌ Rechazar**: Confirma que debe ser removido

---

## 🔄 Flujo Completo del Sistema de IA

```
Usuario publica mascota
         ↓
Usuario hace clic en "Analizar con IA"
         ↓
API crea jobs de procesamiento
         ↓
[En segundo plano]
├── OCR: Extrae texto de imágenes
├── Vision: Analiza características visuales
├── Embeddings: Crea vectores de búsqueda
├── Moderación: Verifica contenido
└── Duplicados: Busca publicaciones similares
         ↓
Resultados aparecen en tiempo real
         ↓
Usuario ve:
├── Estado de procesamiento
├── Alertas de duplicados (si existen)
├── Coincidencias de IA (si es LOST/FOUND)
└── Sugerencias extraídas (próximamente)
```

---

## ⚡ Características del Sistema

### **Procesamiento Asíncrono**
- Los análisis ocurren en segundo plano
- No bloquea la navegación
- Actualizaciones en tiempo real vía Supabase Realtime

### **Reintentos Automáticos**
- Si un job falla, se reintenta automáticamente
- Máximo 3 reintentos por job
- Puedes reiniciar manualmente desde el dashboard

### **Fallback Seguro**
- Si la IA no está disponible, la plataforma sigue funcionando
- Las funciones tradicionales no dependen de la IA
- Los datos manuales siempre tienen prioridad

---

## 💡 Consejos de Uso

### Para Mejores Resultados:

1. **Usa imágenes claras**: Las fotos nítidas mejoran el análisis visual
2. **Incluye texto en la descripción**: Ayuda al matching semántico
3. **Llena todos los campos**: Más datos = mejores coincidencias
4. **Revisa las sugerencias**: La IA puede extraer info útil de las imágenes
5. **Confirma o descarta matches**: Ayuda a entrenar el sistema

### Limitaciones:

- ⚠️ **No es 100% precisa**: Siempre revisa las coincidencias manualmente
- ⚠️ **Depende de la calidad de datos**: Publicaciones incompletas dan peores resultados
- ⚠️ **Mock Provider por defecto**: En desarrollo usa datos simulados

---

## 🔧 Para Desarrolladores

### Activar Proveedor Real de IA

Actualmente el sistema usa un **MockProvider** para desarrollo. Para usar un proveedor real:

1. Configura las API keys en `.env`:
```bash
# Para OpenAI
OPENAI_API_KEY=sk-...

# Para Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Para Google
GOOGLE_AI_API_KEY=...

# Para Cloudflare
CLOUDFLARE_AI_API_KEY=...
```

2. Modifica `src/lib/ai/providers/index.ts` para usar el proveedor real

3. Los componentes de UI no necesitan cambios (ya están preparados)

---

## 📊 Monitoreo (Solo Admins)

En `/admin` puedes ver:
- Total de jobs procesados
- Jobs pendientes
- Tasa de éxito
- Duplicados detectados
- Contenido moderado
- Matches creados

---

## 🆘 Soporte

Si tienes problemas con el sistema de IA:

1. **Refresca la página**: A veces el estado se desincroniza
2. **Reinicia el procesamiento**: Usa el botón "Analizar con IA" nuevamente
3. **Verifica tu conexión**: Supabase Realtime requiere conexión estable
4. **Contacta a un moderador**: Si algo no funciona correctamente

---

## 🎨 Principios de Diseño

El sistema de IA en Patitas está diseñado para ser:

✅ **No intrusivo**: Solo aparece cuando es relevante  
✅ **Transparente**: Siempre muestra por qué algo fue detectado  
✅ **Opcional**: Puedes usar Patitas sin IA  
✅ **Verificable**: Todos los resultados pueden ser revisados  
✅ **Mejora continua**: Los moderadores entrenan el sistema  

---

## 🚀 Próximas Funcionalidades

- [x] **Asistente IA para formularios**: Extrae datos de imágenes al crear publicación ✅ IMPLEMENTADO
- [ ] Sugerencias automáticas al crear publicación
- [ ] Búsqueda por imagen (sube foto y encuentra similares)
- [ ] Notificaciones de matches automáticas
- [ ] Historial de procesamiento
- [ ] Métricas de precisión
- [ ] Feedback loop para mejorar el modelo

---

## 🔌 Integración con IA Real

### Para Producción

Actualmente el endpoint `/api/ai/extract-from-image` usa datos mock. Para integrar un proveedor de IA real:

#### **Opción 1: OpenAI GPT-4 Vision**

```typescript
// En api/ai/extract-from-image.ts
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analiza esta imagen de un animal y extrae la siguiente información en formato JSON:
          {
            "species": "DOG o CAT",
            "breed": "raza específica o 'Mestizo'",
            "sex": "MALE o FEMALE si es identificable",
            "size": "SMALL, MEDIUM o LARGE",
            "ageApprox": "PUPPY, YOUNG, ADULT o SENIOR",
            "color": "descripción del color principal",
            "characteristics": "características físicas distintivas",
            "collar": true/false si tiene collar visible,
            "plate": true/false si tiene placa visible,
            "confidence": número entre 0 y 1
          }
          Si algún campo no es identificable, omítelo.`
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        }
      ]
    }],
    max_tokens: 500,
  }),
});
```

#### **Opción 2: Anthropic Claude Vision**

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          type: 'text',
          text: 'Analiza esta imagen...'
        }
      ]
    }]
  }),
});
```

#### **Configuración de Variables de Entorno**

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

**¿Preguntas?** Contáctanos en el panel de administración o abre un issue en GitHub.
