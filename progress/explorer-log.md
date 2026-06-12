# Explorer log — T024 (IA por campo en el wizard) + T025 (viabilidad como paso inicial)

- **Tarea:** T024 "IA por campo: 'Rellenar con IA' en cada campo de texto del wizard" (en_progreso) + T025 "Viabilidad como paso inicial del flujo sin canal + IA en sus campos" (pendiente, depende de T024).
- **Fecha exploración:** 2026-06-12

---

## 1. Inventario completo de campos de texto editables

Rutas frontend: `app/frontend/src/wizard/steps/*.tsx`, `app/frontend/src/routes/Viabilidad.tsx`.
Modelo de datos: `app/backend/src/videoDefaults.js` (nuevoVideo + validarVideo con límites duros).

### Wizard (10 etapas) — 30 campos de texto editables

| # | Campo (ruta real en VideoProject) | Etapa | Tipo | ¿Generador hoy? |
|---|---|---|---|---|
| 1 | `tituloIdea` | idea | corto (≤200) | HUÉRFANO (temas_canal existe pero solo en Dashboard) |
| 2 | `descripcionCorta` (brief) | idea | largo (≤500) | HUÉRFANO |
| 3 | `nicho` | idea | corto (≤60) | HUÉRFANO (viene del perfil; valor IA bajo) |
| 4 | `palabrasClave` | investigacion | LISTA chips (≤15) | HUÉRFANO |
| 5 | `seoPreguntas` | investigacion | LISTA (≤10) | SÍ — AiBlock `seo_preguntas` (añadir de 1 en 1) |
| 6 | `competenciaRefs[].url/notas` | investigacion | lista url+notas | EXCLUIR (URLs reales: la IA alucinaría) |
| 7 | `tituloFinal` | titulo | corto (≤100) | SÍ — AiBlock `titulo` ("Elegir") |
| 8 | `titulosAlternativos` | titulo | LISTA (≤9) | SÍ — mismo AiBlock ("Guardar") |
| 9 | `hashtags.titulo[0]` | titulo | corto | SEMI — generador `hashtags` vive en publicación; en titulo es huérfano |
| 10 | `miniatura.palabrasMiniatura` | miniatura | corto (3-5 palabras) | SEMI — `miniatura_brief` devuelve `palabrasSugeridas` |
| 11 | `miniatura.briefIA` | miniatura | largo | SÍ — AiBlock `miniatura_brief` |
| 12-14 | `guion.seoShock/seoInicio/seoLoop` | guion | largos | SEMI — AiBlock `hook` (5 ganchos con destino) |
| 15 | `guion.desarrollo[i].titulo` | guion | corto | HUÉRFANO |
| 16 | `guion.desarrollo[i].contenido` | guion | largo | HUÉRFANO (el más valioso: esqueleto desde seoPreguntas) |
| 17 | `guion.seoResultado` | guion | largo | HUÉRFANO |
| 18 | `guion.psicoCta` | guion | largo | HUÉRFANO |
| 19 | `guion.cliffhanger` | guion | largo opcional | HUÉRFANO |
| 20 | `notas` (compartido grabacion/edicion/evergreen, StepGenerico+StepEvergreen) | 3 etapas | largo | HUÉRFANO — EXCLUIR v1 (apuntes personales, IA aporta poco) |
| 21 | `descripcionPublicada` | publicacion | largo (≤5000) | SÍ — AiBlock `descripcion` |
| 22 | `comentarioFijado` | publicacion | largo | HUÉRFANO |
| 23 | `hashtags.descripcion` | publicacion | LISTA chips (≤15) | SÍ — AiBlock `hashtags` |
| 24 | `hashtags.geolocalizacion` | publicacion | corto | EXCLUIR (dato personal del usuario) |
| 25 | `timestamps[].tiempo/titulo` | publicacion | lista estructurada | HUÉRFANO — ¡derivable SIN IA! de `guion.desarrollo` (titulo + duracionSegundos acumulados) |
| 26 | `listaReproduccionNombre` | publicacion | corto | HUÉRFANO (nombre de SEOlista desde nicho+keywords) |
| 27 | `tarjetas[].destino/cta` + `pantallasFinales[].destino` | publicacion | cortos | EXCLUIR (URLs/títulos de vídeos propios) |
| 28 | `difusion.postComunidad.contenido` | sprint | largo | SÍ — AiBlock `comunidad` |
| 29 | (email) | sprint | — | SÍ — AiBlock `email` (a portapapeles, sin campo) |
| 30 | `datosPegados` (estado local) | evergreen | largo | EXCLUIR (son datos reales de Analytics) |

**Resumen wizard:** 30 campos de texto; 8 con generador hoy; **13 huérfanos accionables** (1, 2, 4, 9*, 10*, 15, 16, 17, 18, 19, 22, 26 + timestamps sin IA); 6 excluidos con motivo.
(*9 y 10 se resuelven reutilizando generadores existentes, no con prompt nuevo.)

### Viabilidad (T025) — 8 campos (`routes/Viabilidad.tsx`, interfaz `EstudioViabilidad`)

| Campo | Tipo | Qué necesita la IA | Nota |
|---|---|---|---|
| `ideaCanal` | largo | `profile.nicho` (campo abierto → sugerencias amplias) | usa corpus ideación |
| `aQuienAyuda` | largo | `ideaCanal` | |
| `formatoPrevisto` | corto | `ideaCanal` | |
| `busquedasEncontradas` | largo | `ideaCanal` | OJO: el método exige ir a YouTube Autocomplete. La IA debe sugerir **semillas de búsqueda a probar**, no inventar resultados. Etiquetar "Sugerir búsquedas a comprobar". |
| `canalesReferencia` | largo | `ideaCanal` | Riesgo alucinación de canales concretos → IA sugiere **consultas para encontrarlos**, no nombres. |
| `anguloReferencia` | largo | `ideaCanal` + `canalesReferencia` | propone ángulos diferenciales |
| `subNicho` | corto | `ideaCanal` (+ `busquedasEncontradas`) | 3-5 sub-nichos, corpus s4 |
| `pvu` | largo | `ideaCanal` + `subNicho` | 1 frase, corpus |

**Total inventariado: 38 campos** (30 wizard + 8 viabilidad). A cubrir con el patrón nuevo: ~21.

---

## 2. Razonamiento por campo huérfano: requisitos + regla Romuald + salida

Formato: campo → requisitos mínimos (mismos términos que `requisitos.js`) → fuente de la regla (`consejos.ts`) → salida.

- **tituloIdea** → requisito: `profile.nicho` (igual que `temas_canal`) → regla `CONSEJOS.idea.campos.tituloIdea` → NO usa `rellenar_campo`: reutiliza **`temas_canal`** (ya inyecta corpus + titulosExistentes para no repetir temas). Tarjetas {titulo, angulo, porQueFunciona, formato} con "Usar esta" → patch tituloIdea (+ descripcionCorta y formato si están vacíos).
- **descripcionCorta** → requiere `tituloIdea` no vacío → regla `idea.campos.descripcionCorta` ("qué problema resuelve, quién lo busca") → 2-3 variantes de brief.
- **palabrasClave** → requiere `tituloIdea` (la inversa del bloqueo actual: hoy `seo_preguntas` exige 1 keyword; este generador es el que la produce) → regla `investigacion.campos.palabrasClave` (cola larga primero) → LISTA de 8-10 chips, añadir de 1 en 1 o "Añadir todas" (dedupe + tope 15).
- **hashtags.titulo[0]** → reusar generador **`hashtags`** existente (ya devuelve campo `titulo`); requisito existente: tituloFinal. Solo falta el botón en StepTitulo.
- **palabrasMiniatura** → reusar `miniatura_brief.palabrasSugeridas`; o campo propio que requiere `tituloFinal` → regla `miniatura.campos.palabrasMiniatura` ("intriga, no explicar").
- **desarrollo (esqueleto)** → requiere `tituloFinal` + `seoPreguntas.length >= 1` → regla `guion.banner` (estructura 'entrar a matar') + `roturaPatron` → salida especial: lista de bloques {titulo, contenido, duracionSegundos} que se AÑADEN a `guion.desarrollo` (nunca reemplazan). Único campo con salida estructurada propia.
- **seoResultado** → requiere `tituloFinal` y algo de desarrollo (≥1 bloque o seoInicio) → regla `guion.campos.seoResultado` (cumplir promesa + enlazar cadena) → 2-3 variantes.
- **psicoCta** → requiere `tituloFinal` → regla `guion.campos.psicoCta` (CTA win-win) → 2-3 variantes.
- **cliffhanger** → requiere `tituloFinal` → regla `guion.campos.cliffhanger` (bucle abierto al siguiente vídeo) → 2-3 variantes.
- **comentarioFijado** → requiere `tituloFinal` (mismo criterio que `comunidad`) → regla `publicacion.campos.comentarioFijado` (gancho de cadena) → 2-3 variantes.
- **listaReproduccionNombre** → requiere `tituloFinal` o `palabrasClave>=1` → regla `publicacion.campos.timestamps`/tpl_seolista → 3-5 nombres cortos.
- **timestamps** → SIN IA: botón "Derivar del guion" (00:00 Introducción + bloques con sumas de duracionSegundos → MM:SS). Determinista, 0 tokens, respeta validación "primer capítulo 00:00".
- **Viabilidad** (8 campos): requisitos sobre los datos del estudio (ver §6); reglas = los textos `TipViabilidad` ya escritos en Viabilidad.tsx (triángulo pasión×demanda×competencia, validación triple) — extraerlos a constantes exportables o duplicarlos en el registro.

### Arquitectura backend recomendada: UN generador genérico + registro por campo

**`rellenar_campo`** único en `GENERADORES` (prompts.js) + **`campos.js`** nuevo (espejo exacto del patrón `requisitos.js`):

```js
// app/backend/src/campos.js
export const CAMPOS_IA = {
  "descripcionCorta": {
    requisitos: ({ video }) => hayTexto(video?.tituloIdea) ? null : { falta: "tituloIdea", pasoSlug: "idea", mensaje: "..." },
    instrucciones: "Redacta 2-3 versiones del brief...",   // qué pedir, formato del campo
    contexto: (video, profile, opciones) => [...],          // líneas extra (p.ej. resumen guion)
    maxTokens: 500, temperatura: 0.8, n: 3,                  // nº de sugerencias
    usaCorpus: false,                                        // true solo en ideación/viabilidad
  },
  "viabilidad.subNicho": { ... },                            // prefijo para los de T025
};
```

- Salida SIEMPRE uniforme: `{"sugerencias": ["...", "..."]}` → un solo `normalizar` → `[{texto}]`. Excepción única: `guion.desarrollo` (bloques). Esto elimina 12 normalizadores repetidos.
- La **regla Romuald viaja desde el frontend** en `opciones.reglaCampo` (texto de `CONSEJOS[slug].campos[k]`), igual que ya hace `romu_aprueba` con `opciones.reglas` — `consejos.ts` sigue siendo única fuente de verdad y no se duplica la Biblia en backend. El backend la trunca (slice ≤1200) e inyecta en el prompt.
- En `ia.js`: bloque `if (tipo === "rellenar_campo")` que valida `campoId` contra whitelist `CAMPOS_IA` (422 si no existe — anti prompt-injection), aplica guardias de tamaño a todas las opciones de cliente y monta contexto extra (patrón idéntico a los bloques `temas_canal`/`romu_aprueba` ya existentes, líneas 51-76).
- En `requisitos.js`: entrada `rellenar_campo: ({ video, profile, opciones }) => CAMPOS_IA[opciones.campoId]?.requisitos(...)`. OJO: `evaluarRequisitos` hoy NO recibe `opciones` — hay que pasárselas desde ia.js (cambio de firma retro-compatible).

---

## 3. UI: componente único `FieldIA` + pestañita

### Patrón existente a no romper
- `AiBlock.tsx` ya resuelve: gating por apiKey (`profile?.iaConfig.apiKey === "***"` → botón disabled + link a /configuracion), spinner, error `REQUISITO_FALTANTE` → caja `.ai-bloqueado` con mensaje Romuald + `enlacePaso(pasoSlug)` → Link al paso. **No tocar los 8 AiBlock existentes ni sus testids** (`ai-generate-${tipo}`, `aiblock-bloqueado`).

### Componente nuevo: `app/frontend/src/wizard/FieldIA.tsx`
- Botón compacto (icono `Sparkles` 14px, clase nueva `.field-ia-btn`) que se coloca **en la fila del label** (no como adornment del input: los inputs usan clases planas `.input/.textarea` sin wrapper; meterse dentro implicaría tocar el CSS de todos los campos. La fila del label ya existe en todos).
- Al pulsar → POST `/api/ia/generar { tipo: "rellenar_campo", videoProjectId, opciones: { campoId, reglaCampo, ...contexto } }`.
- **Pestañita = popover anclado al botón** (position absolute bajo el botón, cierre por click-fuera/Escape; no existe ningún popover en el proyecto — `data-tip` es CSS hover puro y `Modal` es demasiado grande). Tres estados dentro del popover:
  1. **Bloqueado** (HTTP 422 `REQUISITO_FALTANTE`): mensaje + Link al paso → reutilizar las clases `.ai-bloqueado*` ya estilizadas.
  2. **Sugerencias**: lista `[{texto}]` con botón "Usar" (campo único, confirm si pisa texto existente — patrón StepPublicacion línea 146) o "+ Añadir" por ítem (listas).
  3. **Cargando / sin configurar** (mismo gating que AiBlock).
- Props: `{ campoId, videoProjectId, modo: "texto"|"lista", regla, getContexto?: () => Record<string,unknown>, onUsar: (texto: string) => void, valoresActuales?: string[], max?: number, disabledExtra? }`.
- La detección de requisito faltante es **lazy** (pulsar → 422): el backend bloquea ANTES de llamar al LLM (coste 0 tokens) y evita duplicar `requisitos.js` en el frontend. Opcional: hint estático `requisitosHint` en el registro frontend para tooltip pasivo.
- Registro frontend pequeño `app/frontend/src/wizard/camposIA.ts`: `campoId → { regla: CONSEJOS.x.campos.y, modo, getContexto(video) }` para que los Step*.tsx solo pasen `campoId` + `onUsar`.
- testids: `field-ia-${campoId}` (botón), `field-ia-popover`, `field-ia-sugerencia-${i}`, `field-ia-bloqueado`.

### Coste real de integración por etapa (tocando lo mínimo)
- StepIdea: 2 inserciones (+1 bloque "Sugerir ideas" con temas_canal, §5) — el más caro, ~40 líneas.
- StepInvestigacion: 1 (palabrasClave).
- StepTitulo: 1 (hashtag título, reusa generador `hashtags`).
- StepMiniatura: 0-1 (palabrasMiniatura; opcional, ya hay palabrasSugeridas).
- StepGuion: los 5 campos SEO se renderizan desde el array `CAMPOS_SEO` → **1 cambio cubre 5 campos**; +1 botón "Esqueleto de bloques" en Desarrollo.
- StepPublicacion: 3 (comentarioFijado, listaReproduccion, botón "Derivar capítulos del guion").
- StepSprint/Evergreen/Genérico: 0.
- Viabilidad: 8 (un solo archivo, campos homogéneos).
Total ≈ 17 puntos de inserción de ~3-6 líneas cada uno.

---

## 4. Campos de lista
- Política: **añadir, nunca reemplazar**. Chips sugeridos en el popover; "+" individual (disabled si duplicado o tope alcanzado — patrón exacto de StepInvestigacion líneas 44-45) + "Añadir todas" con `[...new Set([...actuales, ...nuevas])].slice(0, max)` (patrón StepPublicacion línea 208).
- `seoPreguntas`, `titulosAlternativos`, `hashtags.descripcion`: ya cubiertos por AiBlocks — NO migrar en T024 (riesgo regresión sin beneficio).
- `guion.desarrollo`: añade bloques al final con flags rotura/reset/zoom en false.

## 5. StepIdea — sugerencias amplias
- Reutilizar `temas_canal` tal cual (corpus + antirepetición de títulos ya resuelto en ia.js líneas 53-59). Dos opciones:
  a) FieldIA con prop `tipoGenerador` (default `rellenar_campo`) y render custom de tarjetas.
  b) AiBlock `temas_canal` colapsable bajo el campo, copiando el render del Dashboard (líneas 139-179) y añadiendo botón "Usar esta" → `patch({ tituloIdea: tema.titulo, descripcionCorta: si vacío (angulo + porQueFunciona), formato: tema.formato === "short" ? "short" : "long" })`.
- Recomiendo (b): cero cambios en FieldIA, componente ya probado. Requisito ya existente (`profile.nicho`) → bloqueo enlaza a /configuracion.

## 6. T025 — viabilidad como paso inicial
1. **Tras onboarding sin canal:** en `Onboarding.tsx` función `crear()` (línea 160): si `draft.tieneCanalYa === false` → `navigate("/viabilidad")` en vez de `/dashboard` (manteniendo el toast).
2. **Pantalla de propuesta** (no banner): nueva vista de intro DENTRO de `Viabilidad.tsx` — si el estudio no existe aún (GET null) y no está saltado, renderizar card de propuesta a pantalla completa: titular Romuald ("antes de grabar nada, valida que hay hueco"), qué incluye (5 pasos), botones "Empezar estudio" (→ paso 0) y "Ahora no" (→ `saltado: true` vía PATCH y navegar a /dashboard — la función `saltar()` ya existe, línea 231). El banner del Dashboard (líneas 92-122) queda como recordatorio si saltó. Sin rutas nuevas.
3. **Al crear canal nuevo en Proyectos** (`VideosList.tsx` → `anadirCanal`, línea 44): tras crear con éxito, `Modal` de propuesta ("¿Estudio de viabilidad para [nombre]?") con "Hacer estudio" → `/viabilidad` y "Ahora no". OJO: `anadirCanal` usa `window.prompt` — sustituirlo por Modal sería deseable pero es scope extra; decisión del orquestador.
4. **RIESGO de modelo:** la viabilidad es **singleton por usuario** (`routes/viabilidad.js`, `ID="main"`). Para "canal nuevo" v1: reutilizar el singleton (si ya hay uno completado, la propuesta ofrece "revisar/rehacer"). Extender a per-canal (id=canalId) es cambio de backend+tests — proponer como decisión explícita, NO hacerlo de tapadillo.
5. **FieldIA en viabilidad:** mismos componentes; `videoProjectId` null; requisitos por campo evaluados server-side sobre `opciones` del cliente (precedente: `evaluacion_nicho` ya recibe todo del cliente), con guardias slice. CampoIds con prefijo `viabilidad.`. Los campos usan clases `field-input/field-label` (¡distintas del wizard `input/label`!) — FieldIA no debe asumir clase del input, solo anclarse al label.

## 7. Presupuesto de tokens y guardias
- `rellenar_campo` típico: SYSTEM_BASE (~350 tok) + construirContexto (~100-250) + reglaCampo (≤1200 chars ~300) + contexto extra (≤1500 chars) + instrucciones (~100). Entrada ~900-1500 tok; salida: corto 300 / largo 700 / lista 500 / desarrollo 900 maxTokens. SIN corpus por defecto; `extraerCorpusIdeacion(2000)` SOLO en ideación/viabilidad (4 campos).
- Guardias obligatorias (patrón `romu_aprueba` en ia.js 63-76 y `corpus.js`): truncar toda opción de cliente, whitelist `campoId`, reglaCampo slice. Todo pasa por el flujo extracción→reintento→degradación ya implementado (ia.js 89-99) y queda en `ai_interactions` (historial/costes gratis).
- **Tests:** NO hay Playwright en el repo (no existe e2e/ ni playwright.config, pese a la mención en CLAUDE.md). El reviewer ejecuta `npm run typecheck` (frontend) + `node --test` backend (`app/backend/tests/*.test.mjs`, stub `setTransport` de llm.js). Añadir `campos.test.mjs`: requisitos por campoId (espejo de requisitos.test.mjs), whitelist 422, normalizador, guardias de tamaño; ampliar viabilidad.test.mjs si T025 toca backend.

## Archivos a tocar
**Backend** (`app/backend/src/`):
- `campos.js` — NUEVO: registro CAMPOS_IA (requisitos+instrucciones+contexto+límites) wizard + viabilidad.
- `prompts.js` — añadir generador `rellenar_campo` (user genérico + normalizador único).
- `routes/ia.js` — bloque rellenar_campo: whitelist, guardias, contexto extra.
- `requisitos.js` — entrada `rellenar_campo` delegando en CAMPOS_IA; firma de evaluarRequisitos acepta `opciones`.
- `tests/campos.test.mjs` — NUEVO.

**Frontend** (`app/frontend/src/`):
- `wizard/FieldIA.tsx` — NUEVO: botón + popover (bloqueado/sugerencias/lista).
- `wizard/camposIA.ts` — NUEVO: registro campoId → regla CONSEJOS + modo + getContexto.
- `styles/components.css` — clases `.field-ia-btn`, `.field-ia-popover` (reusar tokens y `.ai-bloqueado`).
- `i18n/es.ts` — textos botón/popover/propuesta viabilidad.
- `wizard/steps/StepIdea.tsx`, `StepInvestigacion.tsx`, `StepTitulo.tsx`, `StepGuion.tsx`, `StepPublicacion.tsx` (+ `StepMiniatura.tsx` opcional) — inserciones puntuales.
- `routes/Viabilidad.tsx` — pantalla propuesta + 8 FieldIA.
- `routes/Onboarding.tsx` — redirect condicional a /viabilidad.
- `routes/VideosList.tsx` — modal propuesta al crear canal.

## Convenciones a respetar
- Comentarios y UI en español; cabecera de archivo con referencia a tarea (`// FieldIA — T024: ...`).
- testids kebab-case `data-testid="field-ia-*"`; tips vía `data-tip` (CSS hover) solo para texto estático.
- `consejos.ts` es única fuente de verdad de reglas Romuald (no duplicar textos en backend; viajan en opciones).
- Errores backend: `ApiError(code, status, mensaje, details)`; bloqueo = `REQUISITO_FALTANTE` 422 con `[{falta, pasoSlug}]` y mensaje en tono Romuald (corto, directo, con consecuencia).
- Límites del modelo en `validarVideo` (15 kw, 10 preguntas, 9 títulos, 1 hashtag título…) — la UI nunca debe superar topes al "Añadir todas".
- Wizard usa clases `.input/.label/.field`; Viabilidad usa `.field-input/.field-label` (divergencia existente, no "arreglarla" de paso).

## Reutilizable (el implementor DEBE usar)
- `AiBlock.tsx`: patrón de gating apiKey, manejo REQUISITO_FALTANTE y `enlacePaso()` — copiar la lógica, no el componente.
- `api.post` + `isApiError` (`services/api.ts`); `useStore` (profile, toast).
- `evaluarRequisitos`/patrón requisitos.js; guardias de `romu_aprueba` (ia.js 63-76); `extraerCorpusIdeacion(maxChars)`.
- `CONSEJOS[slug].campos[k]` como reglas; `LabelConTip` (fields.tsx) para la fila del label.
- Generadores existentes para no reinventar: `temas_canal` (ideas), `hashtags` (hashtag título), `miniatura_brief.palabrasSugeridas`.
- Patrones de dedupe/tope de listas: StepInvestigacion 44-45, StepPublicacion 208.
- `Modal` (components/ui/Modal.tsx) para la propuesta al crear canal.

## Riesgos
1. `evaluarRequisitos` cambia de firma (añadir opciones) — revisar requisitos.test.mjs.
2. Viabilidad singleton: el flujo "canal nuevo" puede pisar el estudio existente — necesita decisión del orquestador (reusar vs per-canal).
3. Popover nuevo: cuidar z-index/overflow dentro de `details.acordeon` (StepPublicacion) y del grid del wizard.
4. Carrera con autosave (debounce 800ms en Viabilidad; debounce también en useVideoProject): el usuario pulsa ✨ antes de persistir → el backend ve datos viejos. Mitigación: FieldIA manda los valores actuales en `opciones` (el server los usa para requisitos de viabilidad); en el wizard es tolerable.
5. No romper los 8 AiBlock/testids existentes ni los textos de consejos.ts (guía de tono §6).
6. Coste de tokens si el usuario repite ✨: los bloqueos por requisito no consumen tokens, las generaciones sí — sin rate limit actual (mismo statu quo que AiBlock).

## Recomendación — plan por lotes para implementors
- **Lote A (backend, 1 implementor):** campos.js + rellenar_campo en prompts.js + ia.js + requisitos.js + tests. Contrato congelado: request `{tipo:"rellenar_campo", videoProjectId, opciones:{campoId, reglaCampo, ...}}` → `{resultados:[{texto}], parseFallido}` | 422 REQUISITO_FALTANTE.
- **Lote B (frontend núcleo, 1 implementor, EN PARALELO con A gracias al contrato):** FieldIA.tsx + camposIA.ts + CSS + i18n.
- **Lote C (integración wizard, tras B):** 5-6 Step*.tsx (~17 inserciones) + bloque temas_canal en StepIdea + "Derivar capítulos" sin IA.
- **Lote D (T025, tras A+B, paralelo con C):** propuesta en Viabilidad + redirect Onboarding + modal en VideosList + 8 FieldIA + campoIds `viabilidad.*` en campos.js + tests.
- Reviewer: `tsc --noEmit` (frontend) + `node --test` (backend); smoke manual del popover en publicación (acordeón) y en viabilidad.
