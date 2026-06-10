# 03 · MODELOS DE DATOS Y API

> **Para la IA constructora**: Esta sección define **exactamente** la forma de los datos y los endpoints. Si tu stack difiere (SQL en vez de NoSQL), adapta los tipos manteniendo los nombres y relaciones.

---

## 3.1 Esquemas con tipos y validaciones

### 3.1.1 `UserProfile` (singleton)

```typescript
{
  id: string,                    // UUID
  canalNombre: string,           // 0-80 chars
  canalUrl: string | null,       // URL válida o null
  nicho: string,                 // 1-60 chars
  nivel: "principiante" | "intermedio" | "avanzado",
  frecuenciaObjetivo: "diaria" | "2x_semana" | "semanal" | "quincenal" | "mensual",
  objetivoPrincipal: "suscriptores" | "monetizacion" | "influencia" | "ventas" | "diversion",
  idioma: "es",                  // futuro: "en", "pt"
  tieneCanalYa: boolean,
  preferenciasUi: {
    tema: "dark" | "light",
    densidad: "compacta" | "comoda",
    sonidos: boolean
  },
  iaConfig: {
    proveedor: string,           // "openrouter" | "openai" | "anthropic" | "gemini" | "custom"
    modelo: string,              // ej. "anthropic/claude-3.5-sonnet"
    apiKey: string,              // cifrado en reposo si es posible
    baseUrl: string | null,
    temperatura: number          // 0.0 - 1.0
  },
  createdAt: ISO8601 string,
  updatedAt: ISO8601 string
}
```

**Validaciones**:
- Solo puede existir UN `UserProfile`.
- Si no existe → redirigir a `/onboarding`.
- `apiKey` nunca se devuelve en respuestas GET (devuelve `"***"` enmascarado).

---

### 3.1.2 `VideoProject` (entidad central)

```typescript
{
  id: string,                    // UUID
  tituloIdea: string,            // 1-200 chars (lo que el usuario escribe al crear)
  tituloFinal: string | null,    // 1-100 chars (se elige en etapa 3)
  titulosAlternativos: string[], // hasta 9 sugerencias guardadas
  descripcionCorta: string,      // brief inicial 0-500 chars

  // Clasificación
  nicho: string,
  tipo: "sprint" | "evergreen" | "mixto",
  estado: VideoState,            // ver máquina de estados en 01_VISION
  formato: "long" | "short" | "live" | "podcast",

  // Timestamps
  createdAt: ISO8601,
  updatedAt: ISO8601,
  publishedAt: ISO8601 | null,
  archivedAt: ISO8601 | null,

  // SEO e investigación
  palabrasClave: string[],       // máx 15
  seoPreguntas: string[],        // máx 10
  competenciaRefs: Array<{       // vídeos de referencia
    url: string,
    notas: string
  }>,

  // Estrategias aplicadas (tags del glosario)
  estrategiasAplicadas: string[], // ej. ["SEOzoom","SEOmarco","Cliffhanger"]

  // Guion estructurado
  guion: {
    seoInicio: string,           // primeros 15-20 seg
    seoLoop: string,             // pista futura
    seoShock: string,            // gancho fuerte
    desarrollo: Array<{
      titulo: string,
      duracionSegundos: number,
      contenido: string,
      roturaPatron: boolean,
      seoReset: boolean,
      seoZoom: boolean
    }>,
    seoResultado: string,        // momento del desenlace
    cliffhanger: string | null,
    psicoCta: string,
    duracionTotalEstimadaSeg: number
  },

  // Miniatura
  miniatura: {
    estrategia: string | null,   // SEOmarco, SEOcara...
    palabrasMiniatura: string,   // 3-5 palabras impresas
    briefIA: string | null,
    urlPrincipal: string | null,
    urlsAlternativas: string[]
  },

  // Publicación
  descripcionPublicada: string,  // texto final que va en YouTube
  hashtags: {
    descripcion: string[],       // máx 15
    titulo: string[],            // máx 1
    geolocalizacion: string | null
  },
  timestamps: Array<{
    tiempo: string,              // "MM:SS"
    titulo: string
  }>,
  listaReproduccionNombre: string | null,
  comentarioFijado: string | null,

  // Elementos del vídeo en YouTube
  pantallasFinales: {
    configuracion: "unitaria" | "binaria" | "terciaria" | "cuaternaria" | "plantilla",
    elementos: Array<{
      tipo: "video" | "lista" | "suscripcion" | "canal" | "enlace",
      destino: string,           // título/url
      posicion: "izq" | "der" | "centro" | "abajo"
    }>
  },
  tarjetas: Array<{
    tipo: "Subjeta" | "Indujetas" | "Psicojetas" | "SEOjeta" | "SEOrescate",
    momentoSegundos: number,
    destino: string,
    cta: string
  }>,

  // Estado del checklist (la app lo usa para barras de progreso)
  checklistEstado: {
    [stepId: string]: {
      [itemKey: string]: boolean
    }
  },

  // Difusión post-publicación
  difusion: {
    emailEnviado: boolean,
    postComunidad: {
      enviado: boolean,
      tipo: "Giftcalipsis" | "SEOencuesta" | "SEOlaunch" | "SEOrepesca" | null,
      contenido: string
    },
    redesCompartido: {
      instagram: boolean,
      twitter: boolean,
      tiktok: boolean,
      otros: string[]
    },
    adsActivados: boolean,
    plataformasAds: string[]
  },

  // Métricas (referencias a MetricSnapshot)
  metricasIds: string[],

  // Notas libres
  notas: string,

  // SEOhora
  seoHora: {
    diaSemana: number | null,    // 0-6
    horaPublicacion: string | null // "HH:MM"
  }
}
```

**Validaciones críticas**:
- `tituloFinal` máx 100 chars (límite YouTube).
- `descripcionPublicada` máx 5000 chars.
- `hashtags.descripcion` máx 15, cada uno empieza por `#`, sin espacios.
- `hashtags.titulo` máx 1.
- `timestamps`: el primero DEBE ser `"00:00"` para activar capítulos en YouTube.
- `tarjetas` máx 5 por vídeo (límite YouTube).

---

### 3.1.3 `CourseProgress`

```typescript
{
  id: string,
  asignaturaId: string,          // "s1_a1"
  seccionId: string,             // "s1"
  completado: boolean,
  notaPersonal: string,          // 0-1000 chars
  fechaCompletado: ISO8601 | null,
  vinculadoAVideoIds: string[]
}
```

**Reglas**:
- Hay UN `CourseProgress` por `asignaturaId` (upsert).
- Si nunca se ha tocado, se asume `completado: false`, `notaPersonal: ""`.

---

### 3.1.4 `Template`

```typescript
{
  id: string,                    // UUID o slug "plantilla-descripcion-video"
  nombre: string,
  tipo: "descripcion" | "titulo" | "miniatura_brief" | "guion" | "email" | "comunidad" | "pantalla_final" | "tarjeta" | "checklist" | "banner" | "trailer",
  contenido: string,             // texto/markdown con variables {variable}
  variablesDinamicas: Array<{
    nombre: string,              // "nombreCanal"
    descripcion: string,
    valorPorDefecto: string,
    tipo: "texto" | "url" | "numero" | "fecha"
  }>,
  seccionRelacionadaId: string | null,  // ej. "s10" descripciones
  esEditable: boolean,
  esPrecargada: boolean,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

---

### 3.1.5 `AIInteraction`

```typescript
{
  id: string,
  videoProjectId: string | null,
  tipo: "titulo" | "miniatura_brief" | "hook" | "descripcion" | "hashtags" | "seo_preguntas" | "email" | "comunidad" | "analisis_retencion",
  prompt: string,
  respuesta: string,
  respuestaParseada: any,
  seleccionUsuario: string | null,
  modeloUsado: string,
  tokensUsados: number | null,
  costoEstimado: number | null,
  createdAt: ISO8601
}
```

---

### 3.1.6 `MetricSnapshot`

```typescript
{
  id: string,
  videoProjectId: string,
  fecha: ISO8601 date,
  diasDesdePublicacion: number,
  vistas: number,
  impresiones: number,
  ctr: number,                   // porcentaje 0-100
  retencionMediaPct: number,     // 0-100
  duracionMediaSeg: number,
  velocidadVisualizacion: number,
  suscriptoresGanados: number,
  comentarios: number,
  likes: number,
  ingresosEstimados: number | null,
  rpm: number | null,
  notas: string
}
```

**Validaciones**:
- Solo un snapshot por (`videoProjectId`, `fecha`).
- `ctr` debe ser 0-100.
- `velocidadVisualizacion` se calcula automáticamente: `vistas / max(diasDesdePublicacion, 1)`.

---

## 3.2 API REST — Endpoints completos

> **Prefijo común**: `/api`. **Formato**: JSON. **Errores**: `{ error: string, code: string, details?: any }`.

### 3.2.1 Perfil

| Método | Ruta | Descripción | Body | Respuesta |
|--------|------|-------------|------|-----------|
| GET | `/api/profile` | Perfil único | — | `UserProfile` o 404 |
| POST | `/api/profile` | Crear perfil (onboarding) | `UserProfile` parcial | `UserProfile` |
| PATCH | `/api/profile` | Actualizar campos | `Partial<UserProfile>` | `UserProfile` |
| GET | `/api/profile/ia-status` | ¿Hay IA configurada? | — | `{ configured: boolean, provider: string }` |

### 3.2.2 Vídeos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/videos` | Listar (filtros: `?estado=&tipo=&q=`) |
| GET | `/api/videos/:id` | Detalle |
| POST | `/api/videos` | Crear nuevo proyecto |
| PATCH | `/api/videos/:id` | Actualizar (autosave) |
| PATCH | `/api/videos/:id/estado` | Cambiar estado |
| PATCH | `/api/videos/:id/checklist` | Actualizar item `{ stepId, itemKey, valor }` |
| DELETE | `/api/videos/:id` | Eliminar |
| POST | `/api/videos/:id/duplicar` | Clonar |

### 3.2.3 Curso

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/curso/estructura` | Devuelve las 20 secciones con asignaturas (seed) |
| GET | `/api/curso/progreso` | Todos los `CourseProgress` del usuario |
| PATCH | `/api/curso/progreso/:asignaturaId` | Marcar completado / nota |

### 3.2.4 Plantillas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/plantillas` | Listar (filtros: `?tipo=`) |
| GET | `/api/plantillas/:id` | Detalle |
| POST | `/api/plantillas` | Crear custom |
| PATCH | `/api/plantillas/:id` | Editar (solo si `esEditable`) |
| DELETE | `/api/plantillas/:id` | Eliminar custom |
| POST | `/api/plantillas/:id/aplicar` | Aplicar variables `{ variables: { ... } }` → devuelve texto resuelto |
| GET | `/api/plantillas/:id/descargar?formato=md\|txt\|pdf` | Descargar |

### 3.2.5 Métricas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/metricas/resumen` | KPIs agregados |
| GET | `/api/metricas/insights` | Frases insight generadas |
| GET | `/api/metricas/video/:videoId` | Histórico de un vídeo |
| POST | `/api/metricas/snapshot` | Crear snapshot manual |
| PATCH | `/api/metricas/snapshot/:id` | Editar |
| DELETE | `/api/metricas/snapshot/:id` | Eliminar |

### 3.2.6 IA

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ia/generar` | Genera contenido `{ tipo, contexto, opciones }` |
| GET | `/api/ia/historial` | Historial de interacciones |
| POST | `/api/ia/test-conexion` | Verifica que la clave funciona |

### 3.2.7 Sistema

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/export` | Devuelve JSON completo del estado |
| POST | `/api/import` | Importa JSON (con confirmación: `{ replaceAll: boolean }`) |
| GET | `/api/health` | Healthcheck |

---

## 3.3 Reglas de persistencia y consistencia

1. **Autosave debounced 800ms** en el frontend.
2. **PATCH parcial**: el backend acepta solo los campos modificados, hace merge.
3. **Transacciones**: cambiar estado de un vídeo + crear snapshot relacionado debe ser atómico cuando aplique.
4. **Soft delete**: los proyectos eliminados pasan a una colección `deleted_videos` y se purgan tras 30 días (o nunca, configurable).
5. **Versionado de seeds**: `courseStructure.json` y `templates.json` llevan campo `version`. Si cambia, se hace merge no destructivo con datos del usuario.

---

## 3.4 Índices recomendados

- `VideoProject`: `(estado)`, `(createdAt)`, `(publishedAt)`, índice de texto en `tituloIdea` y `tituloFinal`.
- `CourseProgress`: `(asignaturaId)` único.
- `MetricSnapshot`: `(videoProjectId, fecha)` único.
- `AIInteraction`: `(videoProjectId, createdAt)`.

---

## 3.5 Ejemplo JSON completo de un `VideoProject` recién creado

```json
{
  "id": "uuid-1234",
  "tituloIdea": "Cómo grabar audio profesional sin micro caro",
  "tituloFinal": null,
  "titulosAlternativos": [],
  "descripcionCorta": "",
  "nicho": "tecnología audiovisual",
  "tipo": "evergreen",
  "estado": "idea",
  "formato": "long",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-01-15T10:00:00Z",
  "publishedAt": null,
  "archivedAt": null,
  "palabrasClave": [],
  "seoPreguntas": [],
  "competenciaRefs": [],
  "estrategiasAplicadas": [],
  "guion": {
    "seoInicio": "",
    "seoLoop": "",
    "seoShock": "",
    "desarrollo": [],
    "seoResultado": "",
    "cliffhanger": null,
    "psicoCta": "",
    "duracionTotalEstimadaSeg": 0
  },
  "miniatura": {
    "estrategia": null,
    "palabrasMiniatura": "",
    "briefIA": null,
    "urlPrincipal": null,
    "urlsAlternativas": []
  },
  "descripcionPublicada": "",
  "hashtags": { "descripcion": [], "titulo": [], "geolocalizacion": null },
  "timestamps": [],
  "listaReproduccionNombre": null,
  "comentarioFijado": null,
  "pantallasFinales": { "configuracion": "binaria", "elementos": [] },
  "tarjetas": [],
  "checklistEstado": {},
  "difusion": {
    "emailEnviado": false,
    "postComunidad": { "enviado": false, "tipo": null, "contenido": "" },
    "redesCompartido": { "instagram": false, "twitter": false, "tiktok": false, "otros": [] },
    "adsActivados": false,
    "plataformasAds": []
  },
  "metricasIds": [],
  "notas": "",
  "seoHora": { "diaSemana": null, "horaPublicacion": null }
}
```

---

## 3.6 Códigos de error estandarizados

| Code | HTTP | Significado |
|------|------|-------------|
| `PROFILE_NOT_FOUND` | 404 | No hay perfil aún (redirigir a onboarding) |
| `PROFILE_ALREADY_EXISTS` | 409 | Intentar POST cuando ya existe |
| `VIDEO_NOT_FOUND` | 404 | id inexistente |
| `INVALID_STATE_TRANSITION` | 422 | Cambio de estado no permitido |
| `VALIDATION_ERROR` | 422 | Detalles en `details` (campo + mensaje) |
| `AI_NOT_CONFIGURED` | 503 | No hay clave de IA |
| `AI_RATE_LIMIT` | 429 | El proveedor limita |
| `AI_PROVIDER_ERROR` | 502 | Error del LLM (incluir mensaje original) |
| `TEMPLATE_NOT_EDITABLE` | 403 | Intento de editar plantilla precargada |
| `DUPLICATE_SNAPSHOT` | 409 | Snapshot ya existe para esa fecha |
| `IMPORT_VERSION_MISMATCH` | 422 | Versión del backup incompatible |
