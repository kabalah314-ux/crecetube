# 02 · FLUJOS Y UX — ONBOARDING + WIZARD DE 10 ETAPAS

> **Para la IA constructora**: este archivo especifica el comportamiento exacto de los dos flujos núcleo de la app: el **onboarding** (crear `UserProfile`) y el **wizard de 10 etapas** (el corazón del producto). Los campos citados existen en `03_MODELOS_DE_DATOS.md`; los tokens visuales en `06_DISENO_UI.md`; los IDs de curso (`s1`…`s20`) en `07_ESQUELETO_CURSO.md`; las plantillas (`tpl_*`) en `05_PLANTILLAS.md`. No inventes campos nuevos: si algo no está aquí ni en 03, no existe.
>
> Convenciones de este documento:
> - `stepId` del wizard: slug en minúsculas sin acentos (`idea`, `investigacion`, `titulo`, `miniatura`, `guion`, `grabacion`, `edicion`, `publicacion`, `sprint`, `evergreen`).
> - `itemKey` de checklist: kebab-case descriptivo, inmutable una vez publicado (se persiste en `checklistEstado[stepId][itemKey]`).
> - Todos los elementos interactivos llevan `data-testid` kebab-case (regla de oro #6).

---

## 2.1 MAPA DE NAVEGACIÓN GLOBAL

```
                      ┌─────────────────────┐
   arranque ────────► │  GET /api/profile   │
                      └──────────┬──────────┘
                     404 │              │ 200
                         ▼              ▼
                  ┌────────────┐  ┌────────────┐
                  │ /onboarding│  │ /dashboard │ ◄────────────────┐
                  └─────┬──────┘  └─────┬──────┘                  │
                        └──► (crear perfil) ─┘                    │
                                        │                         │
        ┌──────────────┬────────────────┼──────────────┬──────────┤
        ▼              ▼                ▼              ▼          ▼
   /videos        /curso           /plantillas    /metricas  /configuracion
        │              │                │
        ▼              ▼                ▼
 /videos/:id      /curso/:sId     /plantillas/:id
        │              │
        ▼              ▼
 /videos/:id      /curso/:sId/:aId
   /wizard/:stepId
```

**Reglas de arranque**:
1. `GET /api/profile` → si `404 PROFILE_NOT_FOUND`, redirect a `/onboarding`. Cualquier otra ruta protegida también redirige.
2. Si hay perfil y el usuario visita `/onboarding`, redirect a `/dashboard` (el onboarding solo se ve una vez; el perfil se edita en `/configuracion`).
3. La sidebar (06 §6.10.1) muestra: Dashboard, Vídeos, Curso, Plantillas, Métricas y, abajo, Configuración.

---

## 2.2 ONBOARDING

### 2.2.1 Principios

- Pantalla completa **sin sidebar** (el usuario aún no "está dentro").
- Un paso por pantalla, avance con botón primario o tecla `Enter`.
- Barra de progreso fina arriba (`paso actual / 8`).
- Botón "Atrás" (ghost) visible desde el paso 2.
- **Persistencia del borrador** en `localStorage` clave `crecetube.onboarding.draft` (JSON con `paso` + respuestas). Si el usuario recarga, se reanuda en el mismo paso con los datos intactos. Se borra al crear el perfil.
- Tipografía display (`--font-display`) en `--text-5xl` para la pregunta principal de cada paso.
- Duración objetivo: < 2 minutos.

### 2.2.2 Secuencia de pasos

| # | Paso | Campo(s) de `UserProfile` | Tipo de control | Obligatorio |
|---|------|---------------------------|-----------------|-------------|
| 0 | Bienvenida | — | CTA "Empezar" | — |
| 1 | ¿Ya tienes canal? | `tieneCanalYa` | 2 cards (Sí / Todavía no) | sí |
| 2 | Tu canal | `canalNombre`, `canalUrl` | input texto + input URL | nombre sí, URL no |
| 3 | Tu nicho | `nicho` | input + chips de sugerencia | sí |
| 4 | Tu nivel | `nivel` | 3 cards | sí |
| 5 | Frecuencia objetivo | `frecuenciaObjetivo` | 5 opciones tipo radio-card | sí |
| 6 | Objetivo principal | `objetivoPrincipal` | 5 cards | sí |
| 7 | IA (opcional) | `iaConfig.*` | form colapsado + "Configurar después" | no |
| 8 | Resumen | — | revisión + CTA "Crear mi espacio" | — |

Detalle por paso:

**Paso 0 — Bienvenida**
```
┌──────────────────────────────────────────────┐
│                                              │
│        CRECETUBE Assistant                   │
│                                              │
│   No vuelvas a publicar un vídeo             │
│   olvidándote de algo importante.            │
│                                              │
│   Te haré 6 preguntas rápidas para           │
│   adaptar la app a tu canal.                 │
│                                              │
│            [ Empezar → ]                     │
│                                              │
└──────────────────────────────────────────────┘
```
- `data-testid="onboarding-start"`.

**Paso 1 — ¿Ya tienes canal?** Dos cards grandes. La elección condiciona el copy del paso 2 (si "Todavía no": *"¿Cómo se llamará tu canal? (puedes cambiarlo luego)"* y se oculta el campo URL). `data-testid="onboarding-has-channel-yes" / "-no"`.

**Paso 2 — Tu canal**. `canalNombre` (1–80 chars, obligatorio, contador visible a partir de 60). `canalUrl` opcional; si se rellena, validar formato URL con mensaje inline en `--accent-rust`. `data-testid="onboarding-channel-name"`, `"onboarding-channel-url"`.

**Paso 3 — Tu nicho**. Input libre (1–60 chars) + 8 chips clicables que rellenan el input: `cocina`, `gaming`, `finanzas`, `tecnología`, `fitness`, `educación`, `viajes`, `humor`. `data-testid="onboarding-niche"`, chips `"onboarding-niche-chip-{slug}"`.

**Paso 4 — Tu nivel**. Cards con título + descripción:
- *Principiante* — "Tengo 0 o pocos vídeos publicados".
- *Intermedio* — "Publico con regularidad pero quiero crecer más rápido".
- *Avanzado* — "Vivo de esto o casi; busco optimizar".
`data-testid="onboarding-level-{valor}"`.

**Paso 5 — Frecuencia objetivo**. Radio-cards horizontales: `diaria`, `2x_semana`, `semanal`, `quincenal`, `mensual`. Microcopy bajo el control: *"Sé realista: consistencia > volumen (lo verás en la sección 20 del curso)."* `data-testid="onboarding-frequency-{valor}"`.

**Paso 6 — Objetivo principal**. Cards: `suscriptores`, `monetizacion`, `influencia`, `ventas`, `diversion`. `data-testid="onboarding-goal-{valor}"`.

**Paso 7 — IA (opcional)**
```
┌──────────────────────────────────────────────┐
│  ¿Quieres activar los generadores con IA?    │
│                                              │
│  La app funciona al 100% sin IA. Si tienes   │
│  una clave de OpenRouter (hay modelos        │
│  gratuitos), pégala aquí y desbloquearás     │
│  los botones "Generar".                      │
│                                              │
│  Proveedor   [ OpenRouter ▾ ]                │
│  API key     [ ····························] │
│  [ Probar conexión ]   estado: —             │
│                                              │
│  [ Configurar después ]   [ Guardar y seguir ]│
└──────────────────────────────────────────────┘
```
- "Probar conexión" llama `POST /api/ia/test-conexion`; muestra ✓ mint o ✗ rust con el mensaje de error del proveedor.
- "Configurar después" salta sin rellenar nada (`iaConfig.apiKey = ""`).
- `data-testid="onboarding-ai-key"`, `"onboarding-ai-test"`, `"onboarding-ai-skip"`.

**Paso 8 — Resumen**. Lista de lo respondido con icono lápiz por fila (vuelve al paso correspondiente). CTA primario "Crear mi espacio" → `POST /api/profile`:
- Éxito → limpiar borrador localStorage → redirect `/dashboard` → toast success *"Tu espacio está listo, {canalNombre}."*
- `PROFILE_ALREADY_EXISTS` (carrera rara) → redirect `/dashboard` silencioso.
- Error de red → toast error + permanecer en el paso (los datos no se pierden).
`data-testid="onboarding-submit"`.

Los valores no preguntados toman defecto: `idioma: "es"`, `preferenciasUi: { tema: "dark", densidad: "comoda", sonidos: false }`, `iaConfig.proveedor: "openrouter"`, `iaConfig.temperatura: 0.7`. El tema y demás se cambian en `/configuracion`.

---

## 2.3 WIZARD — PRINCIPIOS TRANSVERSALES

### 2.3.1 Layout (desktop ≥1280px)

```
┌──────┬─────────────────────────────────────────────┬──────────────┐
│ SIDE │  ① ─ ② ─ ③ ─ ④ ─ ⑤ ─ ⑥ ─ ⑦ ─ ⑧ ─ ⑨ ─ ⑩      │  CONTEXTO    │
│ BAR  │  (stepper horizontal, sticky)               │  (320px)     │
│ 240px├─────────────────────────────────────────────┤              │
│      │  Título de la etapa            ⟳ Guardado ✓ │  Del curso:  │
│      │                                             │  · s6 Títulos│
│      │  [ contenido de la etapa, max-width 800px ] │  · …         │
│      │                                             │              │
│      │  ┌─ Checklist de la etapa ────────────────┐ │  Plantillas: │
│      │  │ [x] item auto                          │ │  · tpl_…     │
│      │  │ [ ] item manual                        │ │              │
│      │  └────────────────────────────────────────┘ │  ████░ 60%   │
│      │                                             │  (progreso   │
│      │  [← Anterior]                  [Siguiente →]│   global)    │
└──────┴─────────────────────────────────────────────┴──────────────┘
```

- **Columna principal**: max-width 800px (06 §6.10.3).
- **Panel CONTEXTO** (rail derecho 320px): visible ≥1280px; por debajo se convierte en botón flotante "Ayuda contextual" que abre un drawer. Contiene: (a) enlaces a las secciones del curso de la etapa (tabla 7.3, enlazan a `/curso/:sId`), (b) plantillas relacionadas (abren modal de previsualización con botón "Usar en este vídeo"), (c) anillo de progreso global del proyecto.
- **Stepper** (06 §6.7.4): los 10 pasos siempre visibles y **todos clicables** (navegación libre, regla 01 §1.6); en móvil se colapsa a "Etapa N de 10 · {nombre}" con menú desplegable.
- Ruta canónica: `/videos/:id/wizard/:stepId`. "Siguiente/Anterior" navegan secuencialmente.

### 2.3.2 Autoguardado

- Cada cambio dispara `PATCH /api/videos/:id` **debounced 800ms** con solo los campos modificados.
- Indicador junto al título (`aria-live="polite"`): `⟳ Guardando…` → `Guardado ✓` (2s) → desaparece. Si falla: `⚠ Sin guardar — reintentando` en `--accent-coral`, reintento con backoff (1s, 2s, 4s… máx 30s) sin bloquear la edición.
- `Ctrl/Cmd+S` fuerza guardado inmediato (y previene el diálogo del navegador).

### 2.3.3 Checklists: items `auto` y `manual`

Cada etapa define su checklist (tablas en §2.4). Dos tipos:
- **auto**: la app lo marca/desmarca sola evaluando su criterio sobre el `VideoProject` en cada render (no se persiste la marca, se deriva; el usuario NO puede togglearlo a mano — el checkbox aparece con candado sutil en hover).
- **manual**: checkbox normal; al togglearlo → `PATCH /api/videos/:id/checklist` con `{ stepId, itemKey, valor }`.

**Progreso de etapa** = items en verde / items totales. **Progreso global del proyecto** = media de las 10 etapas. El wizard **nunca bloquea avanzar** (filosofía: guía, no cárcel); la única acción con requisitos es "Marcar como publicado" (§2.4.8).

`data-testid` de cada item: `checklist-{stepId}-{itemKey}`.

### 2.3.4 Mapeo etapa ↔ estado del proyecto

El `estado` (máquina de 01 §1.6) se deriva de la actividad del wizard:

| Al entrar en etapa… | El estado pasa a… |
|---|---|
| 1 idea | `idea` |
| 2 investigacion | `investigacion` |
| 3 titulo / 4 miniatura / 5 guion | `guion` |
| 6 grabacion | `grabacion` |
| 7 edicion | `edicion` |
| 8 publicacion | (sin cambio; `publicado` SOLO vía botón explícito) |
| 9 sprint | (requiere `publicado`) |
| 10 evergreen | `optimizacion` si ya estaba `publicado` ≥30 días o el usuario lo activa a mano |

Reglas:
- El estado solo **avanza** automáticamente (entrar en una etapa anterior no lo retrocede). Retroceder estado es acción manual en `/videos/:id` (select de estado, con `PATCH /api/videos/:id/estado`).
- Transición `publicado → optimizacion` automática: al cargar la app, si `publishedAt + 30 días < hoy` y `estado === "publicado"`, el backend la aplica.

### 2.3.5 Reanudación

"Continuar" (desde dashboard o card de vídeo) abre `/videos/:id/wizard/:stepId` donde `stepId` = **primera etapa con checklist incompleto** dentro del rango del estado actual (ej.: estado `guion` → busca entre `titulo`, `miniatura`, `guion`; estado `publicado` → `sprint`). Si todo está completo, abre la última etapa.

### 2.3.6 Bloque IA (06 §6.7.6)

En las etapas con generador (ver §2.4), el bloque IA:
- **Con IA configurada**: botón "Generar" → `POST /api/ia/generar` → loading "Pensando…" → resultados como cards seleccionables (la selección escribe en el campo correspondiente y registra `seleccionUsuario` en la `AIInteraction`). Botón "Regenerar" siempre visible tras el primer resultado.
- **Sin IA configurada** (regla de oro #5): botón disabled + tooltip *"Configura tu IA en Ajustes para generar sugerencias"* con enlace a `/configuracion`.
- Errores: `AI_RATE_LIMIT` → toast *"El proveedor está saturado, prueba en unos segundos"*; `AI_PROVIDER_ERROR` → toast con el mensaje original; nunca se pierde lo escrito a mano.
- `data-testid="ai-generate-{tipo}"` (tipo = el de `AIInteraction`).

### 2.3.7 Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl/Cmd + →` / `←` | Etapa siguiente / anterior |
| `Ctrl/Cmd + S` | Guardar ya |
| `Esc` | Cerrar modal/drawer abierto |

---

## 2.4 LAS 10 ETAPAS, UNA A UNA

> Formato de cada etapa: **objetivo → campos → checklist → IA → plantillas → curso → wireframe → comportamiento**. Los campos son los de `VideoProject` (03 §3.1.2). Curso = enlaces del panel contextual (tabla 7.3).

---

### ETAPA 1 · `idea` — La idea

**Objetivo**: capturar la idea y clasificarla para que todo lo demás tenga contexto.

**Campos**: `tituloIdea` (1–200), `descripcionCorta` (0–500, textarea), `nicho` (precargado del perfil, editable), `tipo` (`sprint`/`evergreen`/`mixto` — radio-cards con descripción), `formato` (`long`/`short`/`live`/`podcast`).

**Checklist** (`stepId: "idea"`):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `titulo-trabajo-definido` | Título de trabajo escrito | auto | `tituloIdea` no vacío |
| `tipo-video-elegido` | Tipo sprint/evergreen decidido | auto | `tipo` asignado |
| `formato-elegido` | Formato del vídeo elegido | auto | `formato` asignado |
| `brief-redactado` | Brief de 2–3 frases redactado | auto | `descripcionCorta.length ≥ 30` |
| `idea-validada-3-fuentes` | Idea validada con el método de las 3 fuentes | manual | — |

**IA**: ninguna. **Plantillas**: ninguna. **Curso**: s3, s4.

```
┌────────────────────────────────────────────┐
│ ¿Sobre qué va tu próximo vídeo?            │
│ [ tituloIdea___________________________ ]  │
│                                            │
│ Cuéntalo en 2–3 frases                     │
│ [ descripcionCorta                      ]  │
│ [                                       ]  │
│                                            │
│ Tipo:    (•) Evergreen  ( ) Sprint  ( ) Mixto
│ Formato: (•) Largo ( ) Short ( ) Directo ( ) Podcast
│ Nicho:   [ cocina vegana ]                 │
└────────────────────────────────────────────┘
```

**Comportamiento**: es la única etapa que existe antes de crear el proyecto: en `/videos/nuevo` se muestra esta etapa "en memoria" y el `POST /api/videos` se dispara al primer cambio válido de `tituloIdea` (creación perezosa); desde ahí, la URL cambia a `/videos/:id/wizard/idea` y aplica autosave normal. Tooltip junto a "Tipo" explica sprint vs evergreen en una frase (contenido de s3_a1).

---

### ETAPA 2 · `investigacion` — Investigación y SEO

**Objetivo**: validar demanda y recopilar material SEO antes de invertir trabajo.

**Campos**: `palabrasClave` (chips, máx 15, duplicados rechazados con shake sutil), `seoPreguntas` (lista editable, máx 10), `competenciaRefs` (lista de `{url, notas}`, añadir/eliminar filas).

**Checklist** (`stepId: "investigacion"`):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `palabras-clave-anadidas` | Al menos 3 palabras clave | auto | `palabrasClave.length ≥ 3` |
| `preguntas-seo-anadidas` | Al menos 3 preguntas que responde el vídeo | auto | `seoPreguntas.length ≥ 3` |
| `competencia-analizada` | 2+ vídeos de la competencia anotados | auto | `competenciaRefs.length ≥ 2` |
| `demanda-validada` | Demanda comprobada con herramienta externa | manual | — |
| `angulo-diferencial-definido` | Mi ángulo diferencial está claro | manual | — |

**IA**: `seo_preguntas` — genera 10 preguntas que la audiencia haría sobre `tituloIdea` + `nicho`; cada card tiene "Añadir" (pasa a `seoPreguntas` si no supera el máx). **Plantillas**: ninguna. **Curso**: s4, s6, s19.

**Comportamiento**: las URLs de `competenciaRefs` se validan como URL; si es de YouTube se muestra favicon/icono Video. Contador "n/15" y "n/10" junto a cada lista.

---

### ETAPA 3 · `titulo` — El título

**Objetivo**: elegir un título definitivo ≤100 chars (ideal ≤60) con palabra clave.

**Campos**: `titulosAlternativos` (hasta 9), `tituloFinal`, `hashtags.titulo` (máx 1).

**Checklist** (`stepId: "titulo"`):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `alternativas-generadas` | 3+ títulos alternativos sobre la mesa | auto | `titulosAlternativos.length ≥ 3` |
| `titulo-final-elegido` | Título final elegido | auto | `tituloFinal` no nulo |
| `longitud-optima` | ≤ 60 caracteres | auto | `tituloFinal.length ≤ 60` |
| `palabra-clave-incluida` | Incluye una palabra clave de la etapa 2 | auto | alguna `palabrasClave` aparece en `tituloFinal` (case-insensitive) |
| `hashtag-titulo-decidido` | Hashtag en título decidido (ponerlo o no) | manual | — |

**IA**: `titulo` — genera 9 títulos usando `tituloIdea`, `palabrasClave`, `seoPreguntas`, `nicho` y nivel del perfil; cards con botón "Guardar como alternativa" y "Elegir como final". **Plantillas**: ninguna. **Curso**: s6.

```
┌────────────────────────────────────────────┐
│ Título final                               │
│ [ tituloFinal__________________ ]  47/100  │
│   ✓ ≤60 · ✓ kw "audio" incluida            │
│                                            │
│ ── Alternativas (4/9) ─────────────────    │
│ ○ Cómo grabar audio PRO sin micro caro     │
│ ○ El truco de audio que nadie te cuenta    │
│   [↑ usar como final] [🗑]                  │
│                                            │
│ ┌─ ✨ Generar títulos con IA ─────────────┐ │
│ │ [ Generar 9 títulos ]                  │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

**Comportamiento**: contador con color (`--text-tertiary` hasta 60, `--accent-coral` 61–100, `--accent-rust` y bloqueo de tipeo en 100). "Usar como final" desde una alternativa intercambia: el final anterior pasa a alternativas (si hay hueco).

---

### ETAPA 4 · `miniatura` — La miniatura

**Objetivo**: definir estrategia visual y dejar la miniatura subida (el 50% del CTR).

**Campos**: `miniatura.estrategia` (select: `SEOmarco`, `SEOcara`, `SEOflecha`, `otra`), `miniatura.palabrasMiniatura` (3–5 palabras, contador de palabras), `miniatura.briefIA`, `miniatura.urlPrincipal` (upload imagen → backend la guarda en disco y devuelve URL; aceptar JPG/PNG/WebP, aviso si >2MB: *"YouTube no acepta más de 2MB"*), `miniatura.urlsAlternativas` (para test A/B).

**Checklist** (`stepId: "miniatura"`):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `estrategia-elegida` | Estrategia visual elegida | auto | `estrategia` no nula |
| `palabras-miniatura-definidas` | 3–5 palabras impresas definidas | auto | `palabrasMiniatura` tiene 1–5 palabras |
| `brief-creado` | Brief para diseñar la miniatura listo | auto | `briefIA` no nulo |
| `miniatura-subida` | Miniatura principal subida | auto | `urlPrincipal` no nula |
| `alternativa-ab-creada` | Variante para test A/B subida | manual | — |
| `test-grilla-superado` | Legible en grilla a 100px (test visual) | manual | — |

**IA**: `miniatura_brief` — redacta un brief de diseño a partir de estrategia + título + nicho. **Plantillas**: `tpl_brief_miniatura_seomarco` / `_seocara` / `_seoflecha` (al elegir estrategia, el panel sugiere la plantilla correspondiente). **Curso**: s5.

**Comportamiento**: preview de `urlPrincipal` en 16:9 con simulación de grilla: botón "Ver a tamaño búsqueda" muestra la miniatura a 168×94px junto a 3 miniaturas grises de relleno, para el test de legibilidad.

---

### ETAPA 5 · `guion` — El guion

**Objetivo**: estructurar el guion con el esqueleto CRECETUBE completo.

**Campos**: todo `guion.*`: `seoInicio`, `seoShock`, `seoLoop`, `desarrollo[]` (bloques reordenables drag&drop con `titulo`, `duracionSegundos`, `contenido`, toggles `roturaPatron`/`seoReset`/`seoZoom`), `seoResultado`, `cliffhanger`, `psicoCta`, `duracionTotalEstimadaSeg` (calculada: suma de bloques + 60s fijos de apertura/cierre, editable a mano).

**Checklist** (`stepId: "guion"`):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `seoinicio-escrito` | SEOinicio (primeros 15–20s) escrito | auto | `seoInicio` no vacío |
| `seoshock-escrito` | SEOshock (gancho fuerte) escrito | auto | `seoShock` no vacío |
| `seoloop-escrito` | SEOloop (promesa diferida) escrito | auto | `seoLoop` no vacío |
| `desarrollo-estructurado` | 2+ bloques de desarrollo | auto | `desarrollo.length ≥ 2` |
| `roturas-patron-colocadas` | Al menos 1 rotura de patrón colocada | auto | algún bloque con `roturaPatron` |
| `seoresultado-escrito` | SEOresultado (desenlace) escrito | auto | `seoResultado` no vacío |
| `psicocta-escrito` | PsicoCTA escrito | auto | `psicoCta` no vacío |
| `cliffhanger-decidido` | Cliffhanger decidido (ponerlo o no) | manual | — |

**IA**: `hook` — genera 5 propuestas de gancho; cada card ofrece "Usar como SEOshock", "Usar como SEOinicio" o "Usar como SEOloop". **Plantillas**: `tpl_guion_completo` (botón "Partir de la plantilla" rellena los campos vacíos con su esqueleto — nunca pisa lo ya escrito). **Curso**: s9.

```
┌────────────────────────────────────────────┐
│ SEOshock   [____________________________]  │
│ SEOinicio  [____________________________]  │
│ SEOloop    [____________________________]  │
│ ── Desarrollo ──────────  Σ 8:40 estimado  │
│ ⠿ Bloque 1 · Por qué tu audio suena mal    │
│    [contenido…]  ⏱ 120s  [RP ✓][Reset][Zoom]│
│ ⠿ Bloque 2 · …                             │
│ [+ Añadir bloque]                          │
│ SEOresultado [__________________________]  │
│ Cliffhanger  [__________________________]  │
│ PsicoCTA     [__________________________]  │
└────────────────────────────────────────────┘
```

**Comportamiento**: cada campo SEO* lleva tooltip de una frase explicando el concepto (texto en `i18n/es.ts`, citando la asignatura: "→ s9_a3"). El editor de `contenido` de bloque es el editor de texto del stack (01 §1.3.1).

---

### ETAPA 6 · `grabacion` — La grabación

**Objetivo**: preparar y ejecutar la grabación sin olvidos. Etapa casi 100% checklist.

**Campos**: `notas` (textarea compartida del proyecto, aquí con label "Notas de producción").

**Checklist** (`stepId: "grabacion"`, todos manuales):

| itemKey | Texto |
|---|---|
| `lugar-preparado` | Lugar/set preparado |
| `vestuario-decidido` | Vestuario decidido |
| `broll-listado` | Lista de b-roll necesaria escrita |
| `audio-verificado` | Prueba de audio hecha (niveles OK) |
| `iluminacion-verificada` | Iluminación montada y probada |
| `material-grabado` | Contenido principal grabado |
| `broll-grabado` | B-roll grabado |

**IA**: ninguna. **Plantillas**: ninguna. **Curso**: s9 (notas de producción).

**Comportamiento**: se muestra el guion en modo lectura plegable ("Ver guion") para grabar con él delante; botón "Imprimir guion" (vista print limpia).

---

### ETAPA 7 · `edicion` — La edición

**Objetivo**: asegurar que la edición aplica las técnicas de retención del guion.

**Campos**: `notas` (misma textarea, label "Notas de edición").

**Checklist** (`stepId: "edicion"`, todos manuales):

| itemKey | Texto |
|---|---|
| `corte-general-hecho` | Primer corte completo |
| `roturas-patron-aplicadas` | Roturas de patrón del guion aplicadas |
| `seozoom-aplicado` | SEOzoom en los conceptos clave |
| `seoreset-aplicado` | SEOreset (mini-resúmenes) montados |
| `audio-normalizado` | Audio normalizado (≈ -14 LUFS) |
| `subtitulos-revisados` | Subtítulos generados y revisados |
| `ultimo-frame-reservado` | Últimos 20s con espacio para pantallas finales |
| `render-exportado` | Render final exportado en máxima calidad |

**IA**: ninguna. **Plantillas**: ninguna. **Curso**: s12, s9.

**Comportamiento**: los bloques del guion con toggles activos se listan arriba como recordatorio ("Tu guion pide: 1 rotura de patrón en Bloque 1, SEOzoom en Bloque 3…"), generado de `guion.desarrollo`.

---

### ETAPA 8 · `publicacion` — La publicación

**Objetivo**: dejar el vídeo subido a YouTube con TODA la metadata optimizada. La etapa más densa: se organiza en **acordeón de 5 subsecciones**.

**Subsección A — Descripción**: `descripcionPublicada` (textarea grande, contador /5000; las 2 primeras líneas resaltadas visualmente como "SEOextracto: esto es lo que se ve antes del 'más'"), `comentarioFijado`.
**Subsección B — Hashtags**: `hashtags.descripcion` (chips, máx 15, validación: empiezan por `#`, sin espacios; hint regla del 3: amplio+medio+específico), `hashtags.titulo` (máx 1), `hashtags.geolocalizacion`.
**Subsección C — Capítulos**: `timestamps[]` (filas `MM:SS` + título; validación dura: el primero debe ser `00:00` — si no, banner rust *"YouTube exige que el primer capítulo sea 00:00"*), `listaReproduccionNombre`.
**Subsección D — Pantallas finales y tarjetas**: `pantallasFinales` (select configuración + editor de elementos según 03), `tarjetas[]` (máx 5; validación en vivo: ninguna en el primer 60s ni a <120s de otra; el límite "últimos 30s" se valida contra `guion.duracionTotalEstimadaSeg` si existe, como warning, no error).
**Subsección E — Momento**: `seoHora` (select día semana + hora), checklist final.

**Checklist** (`stepId: "publicacion"`):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `descripcion-redactada` | Descripción ≥100 chars con SEOextracto | auto | `descripcionPublicada.length ≥ 100` |
| `hashtags-completos` | 3 hashtags en descripción | auto | `hashtags.descripcion.length ≥ 3` |
| `timestamps-creados` | Capítulos con 00:00 inicial | auto | `timestamps[0].tiempo === "00:00"` |
| `lista-asignada` | Lista de reproducción asignada | auto | `listaReproduccionNombre` no nulo |
| `comentario-fijado-redactado` | Comentario fijado redactado | auto | `comentarioFijado` no nulo |
| `pantallas-finales-configuradas` | Pantallas finales planificadas | auto | `pantallasFinales.elementos.length ≥ 1` |
| `tarjetas-planificadas` | Tarjetas planificadas | auto | `tarjetas.length ≥ 1` |
| `seohora-elegida` | Día y hora de publicación elegidos | auto | `seoHora.diaSemana` y `horaPublicacion` no nulos |
| `checklist-prepublicacion-repasada` | Checklist pre-publicación repasada | manual | — |
| `video-subido-youtube` | Vídeo subido y programado en YouTube | manual | — |

**IA**: `descripcion` (usa título, guion, palabras clave) y `hashtags` (devuelve 3 propuestas amplio/medio/específico). **Plantillas**: `tpl_descripcion_video`, `tpl_comentario_fijado`, `tpl_pantallas_finales`, `tpl_tarjetas`, `tpl_checklist_pre_publicacion`, `tpl_seolista`. **Curso**: s10, s11, s13, s14.

**Acción culminante** — botón grande al pie:

```
        [ ✓ Marcar como PUBLICADO ]
   habilitado si: tituloFinal ✓ · miniatura.urlPrincipal ✓
                  · video-subido-youtube ✓
```

Al pulsarlo: modal de confirmación con date-picker (`publishedAt`, defecto ahora) → `PATCH /api/videos/:id/estado` a `publicado` → **confetti 1500ms** (06 §6.8) → toast *"Publicado. Arranca la fase sprint 🚀"* → navegación automática a etapa 9. Si los requisitos no se cumplen, el botón muestra tooltip con lo que falta. `data-testid="btn-mark-published"`.

---

### ETAPA 9 · `sprint` — Fase sprint (7 días)

**Objetivo**: ejecutar la difusión de los 7 días críticos. Solo tiene sentido tras publicar: si `estado ≠ publicado/optimizacion`, la etapa muestra estado vacío *"Publica el vídeo para arrancar el sprint"* + botón a etapa 8.

**Cabecera**: "Día {n} del sprint" calculado de `publishedAt` (n = días transcurridos + 1; a partir de día 8: "Sprint completado").

**Campos**: todo `difusion.*` (toggles y campos según 03) + acceso rápido "Añadir snapshot de métricas" (modal con los campos de `MetricSnapshot` → `POST /api/metricas/snapshot`).

**Checklist** (`stepId: "sprint"`, agrupado visualmente por día):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `email-enviado` | Día 1 · Email a la lista enviado | auto | `difusion.emailEnviado` |
| `post-comunidad-publicado` | Día 1 · Post de comunidad publicado | auto | `difusion.postComunidad.enviado` |
| `redes-compartido` | Día 1 · Compartido en redes | auto | alguna red en `redesCompartido` true |
| `comentarios-dia1-respondidos` | Día 1 · Primeros 20 comentarios respondidos | manual | — |
| `snapshot-dia2` | Día 2 · Snapshot de métricas | auto | existe snapshot con `diasDesdePublicacion` 1–2 |
| `seorepesca-publicada` | Día 3 · Post SEOrepesca publicado | manual | — |
| `snapshot-dia4` | Día 4–5 · Snapshot de métricas | auto | snapshot con días 3–5 |
| `ctr-evaluado` | Día 4–5 · CTR evaluado (¿cambio de miniatura?) | manual | — |
| `snapshot-dia7` | Día 6–7 · Snapshot final del sprint | auto | snapshot con días 6–7 |
| `aprendizajes-anotados` | Día 7 · Aprendizajes anotados en notas | manual | — |

**IA**: `email` (borrador de email de nuevo vídeo) y `comunidad` (post según tipo elegido: Giftcalipsis/SEOencuesta/SEOlaunch/SEOrepesca). **Plantillas**: `tpl_email_nuevo_video`, `tpl_comunidad_*` (4), `tpl_checklist_post_publicacion`, `tpl_campana_ads`. **Curso**: s15, s16, s18.

**Comportamiento**: el día actual del sprint aparece destacado (borde `--accent-primary`); los días pasados con items sin marcar muestran punto coral (no rojo: sin culpabilizar).

---

### ETAPA 10 · `evergreen` — Optimización evergreen

**Objetivo**: revisar el vídeo a partir del día 30 y decidir optimizaciones.

**Acceso**: siempre visitable. Si `publishedAt` < 30 días, banner informativo: *"Este módulo brilla a partir del día 30. Hoy: día {n}."* (sin bloquear).

**Campos**: `estrategiasAplicadas` (chips con tags del glosario, color por familia 06 §6.2.3), `notas`, acceso a snapshots como en etapa 9.

**Checklist** (`stepId: "evergreen"`):

| itemKey | Texto | Tipo | Criterio auto |
|---|---|---|---|
| `snapshot-dia30` | Snapshot del día 30 registrado | auto | snapshot con `diasDesdePublicacion` ≥ 28 |
| `analisis-retencion-hecho` | Gráfica de retención analizada | manual | — |
| `comparativa-canal-revisada` | Comparado con la media del canal | manual | — |
| `decision-miniatura` | Decisión sobre cambiar miniatura tomada | manual | — |
| `decision-titulo` | Decisión sobre retocar título tomada | manual | — |
| `listas-revisadas` | Presencia en listas revisada | manual | — |
| `tarjetas-entrantes-anadidas` | Tarjetas hacia este vídeo desde otros | manual | — |
| `seorepesca-evergreen` | SEOrepesca de rescate valorada | manual | — |
| `aprendizajes-evergreen` | Conclusiones anotadas | manual | — |

**IA**: `analisis_retencion` — el usuario pega datos de retención/Analytics en un textarea del modal y la IA devuelve insights accionables (se guardan como `AIInteraction`, mostrables en histórico). **Plantillas**: `tpl_panel_marca`. **Curso**: s3, s19, s17.

**Comportamiento**: si hay ≥2 snapshots, mini-gráfica de evolución (vistas y CTR) embebida arriba; "Ver métricas completas" enlaza a `/metricas`. Botón secundario "Archivar proyecto" (estado → `archivado`, con confirmación).

---

## 2.5 FLUJOS SECUNDARIOS

| Flujo | Comportamiento |
|---|---|
| **Crear vídeo** | CTA "+ Nuevo vídeo" en dashboard y `/videos` → `/videos/nuevo` (etapa 1, creación perezosa §2.4.1). |
| **Registrar vídeo ya publicado** | En `/videos/nuevo`, link discreto "¿Es un vídeo que ya publicaste?" → mini-form (tituloFinal, URL opcional en `competenciaRefs`… no: usa `notas`, fecha publicación) → crea proyecto con `estado: "publicado"` y `publishedAt` indicado, aterrizando en etapa 9 o 10 según antigüedad. |
| **Duplicar** | `POST /api/videos/:id/duplicar` desde la card o el detalle: copia campos de contenido, resetea `estado: "idea"`, checklists, métricas, `publishedAt`; título = "Copia de {tituloIdea}". |
| **Eliminar** | Modal de confirmación escribiendo nada (botón rust "Eliminar") → soft delete (03 §3.3). Toast con "Deshacer" 5s. |
| **Export/Import** | En `/configuracion`: "Descargar copia (JSON)" → `GET /api/export`. "Importar" → file picker + modal con radio `replaceAll` (*"Sustituir todo"* / *"Fusionar"*) → `POST /api/import`; errores `IMPORT_VERSION_MISMATCH` con mensaje claro. |
| **Cambio de estado manual** | En `/videos/:id`, select de estado con los 8 estados; transiciones no permitidas devuelven `INVALID_STATE_TRANSITION` y la UI lo explica. |

---

## 2.6 VACÍOS, ERRORES Y CASOS LÍMITE

| Pantalla | Caso | UX |
|---|---|---|
| `/videos` | Sin proyectos | Empty state (06 §6.7.10): icono Video, *"Tu primer vídeo empieza con una idea"*, CTA "+ Nuevo vídeo". |
| Wizard | Proyecto no existe | Redirect a `/videos` + toast error `VIDEO_NOT_FOUND`. |
| Wizard | `stepId` inválido en URL | Redirect a la etapa de reanudación (§2.3.5). |
| Etapa 9 | Sin publicar | Estado vacío con CTA a etapa 8 (§2.4.9). |
| Cualquiera | Backend caído | Banner superior persistente *"Sin conexión con el servidor — modo solo lectura"* (01 §1.9); inputs disabled; reintento cada 10s. |
| Bloque IA | Sin clave | Botón disabled + tooltip (§2.3.6). |
| Upload miniatura | >2MB o formato inválido | Mensaje inline rust, no se sube. |
| Curso | Asignatura sin contenido | Placeholder regla de oro #1. |

---

## 2.7 DATA-TESTIDS — CONVENCIÓN GLOBAL

Patrones (siempre kebab-case):

| Patrón | Ejemplo |
|---|---|
| `onboarding-{campo/accion}` | `onboarding-niche`, `onboarding-submit` |
| `wizard-step-{stepId}` (item del stepper) | `wizard-step-miniatura` |
| `wizard-next` / `wizard-prev` | — |
| `checklist-{stepId}-{itemKey}` | `checklist-guion-seoshock-escrito` |
| `ai-generate-{tipo}` / `ai-result-{n}` / `ai-regenerate` | `ai-generate-titulo` |
| `btn-mark-published` | — |
| `field-{nombreCampo}` (inputs de VideoProject) | `field-titulo-final` |
| `video-card-{id}` / `video-card-continue` | — |
| `template-use-{tplId}` | `template-use-tpl-guion-completo` |

> Tests E2E (08_ROADMAP_Y_TESTS.md) se apoyan EXCLUSIVAMENTE en estos testids, nunca en texto visible.
