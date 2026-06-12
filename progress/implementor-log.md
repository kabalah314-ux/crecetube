# Implementor Log — LOTE A (T021: onboarding adaptativo)

**Fecha:** 2026-06-12
**Estado:** Implementación completa. tsc OK · build OK · tests backend 78/78 OK.

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/frontend/src/types.ts` | `canalNombre`, `nicho` → `string \| null`; `frecuenciaObjetivo` → `Frecuencia \| null` |
| `app/frontend/src/i18n/es.ts` | `tuCanalTituloNuevo` → "¿Tienes un nombre pensado para tu canal?"; nuevos: `nombreTodaviaNo`, `nichoTituloNuevo` ("¿Tienes clara la temática?"), `nichoNoSe`, `frecuenciaNoSe`, `sinDecidir`; `bienvenidaToast` acepta `string \| null` (fallback "creador"); `viabilidad.bannerDashboardTituloIncompleto` + `bannerDashboardDescIncompleto` |
| `app/frontend/src/routes/Onboarding.tsx` | Bifurcación completa (ver abajo) |
| `app/frontend/src/routes/Dashboard.tsx` | `perfilIncompleto = tieneCanalYa===false \|\| !canalNombre \|\| !nicho`; useEffect de viabilidad y condición del banner usan esa variable; banner con texto variante según rama; saludo `canalNombre \|\| "creador"`; subtítulo nicho null-safe (sin "·" huérfano) |
| `app/frontend/src/routes/Settings.tsx` | Inputs `?? ""` (canalNombre/nicho); `guardarPerfil()` normaliza vacío→null; select frecuencia con `<option value="">Aún no lo sé</option>` ("" ↔ null) |
| `app/frontend/src/routes/TemplateDetail.tsx` | **Fix extra para tsc** (no estaba en el inventario del explorer): `profile.canalNombre` se usaba como `string`; ahora `profile?.canalNombre ? ... : v.valorPorDefecto` |
| `app/backend/src/routes/profile.js` | `validate()`: canalNombre/nicho aceptan `null` o string 1-80/1-60; frecuenciaObjetivo acepta `null` o valor de FRECUENCIAS. Aplica a POST y PATCH |
| `app/backend/src/prompts.js` | Solo `construirContexto()`: `canalNombre ?? "(sin especificar)"`, `nicho ?? "(sin especificar)"` |
| `e2e/01-onboarding.spec.ts` | Nuevo describe "rama sin canal" (ver abajo). El test existente NO cambió de lógica |

## Detalle Onboarding.tsx

- `pasosActivos(draft)`: `[0,1,3..9]` si `tieneCanalYa===false`, `[0..9]` en el resto (incl. `null` para que la barra no salte antes del paso 1). Helpers `siguientePasoActivo`/`anteriorPasoActivo` a nivel de módulo.
- `next()` y botón Atrás usan los helpers; la barra y el contador son dinámicos: `pasoVisual = indexOf(paso)` sobre activos, `totalVisibles = activos.length - 1` (el paso 0 no cuenta). **Rama con canal: "Paso X de 9". Rama sin canal: "Paso X de 8".**
- Paso 3: título ya condicional (`tuCanalTituloNuevo`); input `value={draft.canalNombre ?? ""}`; botón "Todavía no" (`onboarding-nombre-todavia-no`, solo rama sin canal) → `canalNombre=null` y avanza. `valida(3)`: nombre obligatorio solo si `tieneCanalYa`.
- Paso 4: título adaptado en rama sin canal; chip "Aún no lo sé" (`onboarding-nicho-no-se`) → `nicho=null`, `valida(4)` lo acepta. El campo libre ya existía (input con placeholder), no se duplicó — la tarea decía "si no lo tiene ya".
- Paso 6: Card extra "Aún no lo sé" (`onboarding-frequency-no-se`). **Decisión menor:** en el Draft uso centinela `"no_se"` (no `null`) para distinguir "eligió no sé" de "no eligió nada" (null sigue bloqueando en `valida(6)`); `crear()` lo convierte a `null`.
- `crear()`: `(draft.canalNombre ?? "").trim() || null`, ídem nicho; `gestionMulticanal: false` automático en rama sin canal; frecuencia `"no_se"` → `null`.
- Resumen (paso 9): la fila multicanal se OCULTA en rama sin canal (su botón Editar saltaría a un paso inexistente); nombre/nicho/frecuencia muestran "Todavía sin decidir" en vez de null.

## Detalle e2e

- El nuevo describe va **antes** del existente y limpia en `afterEach` con `POST /api/import {replaceAll:true, data:{version:1}}` (vía proxy Vite). Motivo: los 3 specs comparten BD y usuario "local" en orden (01 con-canal crea el perfil que usan 02/03); el afterEach garantiza limpieza incluso si el test falla.
- Flujo verificado: "Todavía no" canal → multicanal ausente (`toHaveCount(0)`) → nombre "Todavía no" → nicho "Aún no lo sé" → frecuencia "Aún no lo sé" → dashboard con heading `/Hola, creador/` y `dashboard-card-viabilidad` visible.

## Decisiones menores

1. Testid del chip de nicho: `onboarding-nicho-no-se` (literal del encargo del orquestador; el explorer sugería `onboarding-niche-no-se`). Frecuencia: `onboarding-frequency-no-se`.
2. Banner Dashboard: variante "incompleto" cuando `tieneCanalYa !== false` (tiene canal pero falta nombre/nicho); texto original cuando `tieneCanalYa === false`. CTA sin cambios.
3. Tests backend: NO necesitaron ajuste — el caso `canalNombre: ""` sigue dando 422 (vacío ≠ null), que respeta su intención.
4. Saludo Dashboard: cambié `?? "creador"` por `|| "creador"` para cubrir perfiles antiguos con `canalNombre: ""`.

## Verificación (rápida, según rol)

- `npx tsc --noEmit` (frontend): limpio.
- `npm run build` (frontend): OK (warning preexistente de chunk >500 kB, no relacionado).
- `npm test --workspace app/backend`: 78/78 pass.
- Suite E2E NO ejecutada (corresponde al reviewer).

Sin DUDAs pendientes.

---

# LOTE B (T022: cadena del método — requisitos por generador + bloqueo duro + sugerir nombres)

**Fecha:** 2026-06-12
**Estado:** Implementación completa. tests backend 94/94 OK (eran 78) · tsc limpio · build OK.

## Archivos creados

| Archivo | Contenido |
|---------|-----------|
| `app/backend/src/requisitos.js` | Única fuente de verdad: mapa generador→requisitos + `evaluarRequisitos(tipo, { video, profile })` → `null \| { falta, pasoSlug, mensaje }`. Mensajes en tono Romu con consecuencia. 11 generadores con requisitos activos; `romu_aprueba` y `evaluacion_nicho` exentos explícitos |
| `app/backend/tests/requisitos.test.mjs` | 2 tests / 14 subtests: unidad de cada generador (bloqueado+desbloqueado), HTTP 422 REQUISITO_FALTANTE con `details[0].{falta,pasoSlug}` (titulo, descripcion×2, temas_canal, sugerir_nombres_canal), generador de nombres con stub (feliz: dedupe/truncado/máx 5 + historial; malformado: degradación) |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/backend/src/routes/ia.js` | Import `evaluarRequisitos`; chequeo tras cargar el vídeo y ANTES de los bloques de contexto extra → `throw new ApiError("REQUISITO_FALTANTE", 422, mensaje, [{falta, pasoSlug}])`. `ApiError` ya soporta `details` (4º arg) y `errorHandler` ya lo serializa: sin cambios en errors.js |
| `app/backend/src/prompts.js` | Generador NUEVO `sugerir_nombres_canal` (patrón exacto: maxTokens 600, temp 0.9, salida `{"nombres":[{"nombre","porQue"}]}`, 5 ítems, normalizador con dedupe/trim/truncado nombre≤80 porQue≤200). Usa `extraerCorpusIdeacion(2000)` como contexto del método |
| `app/backend/tests/ia-metricas.test.mjs` | El fixture del vídeo ahora cumple la cadena (PATCH con 3 palabrasClave + 1 seoPregunta + tituloFinal) para que titulo/seo_preguntas/hook/hashtags sigan en 200 |
| `app/frontend/src/wizard/AiBlock.tsx` | Estado `bloqueado` al capturar 422 `REQUISITO_FALTANTE`; render candado (`Lock`) + mensaje del backend + enlace "Ir al paso →" (`data-testid="aiblock-bloqueado"`, enlace `aiblock-bloqueado-ir`); botón Generar deshabilitado en ese estado. Helper `enlacePaso(pasoSlug, videoProjectId)`: configuracion→`/configuracion`, viabilidad→`/viabilidad`, resto→`/videos/{id}/wizard/{slug}` (excluye el centinela `videoProjectId="viabilidad"`) |
| `app/frontend/src/routes/Viabilidad.tsx` | Card nuevo en paso 5 tras la evaluación de nicho: AiBlock `sugerir_nombres_canal` (opciones `{nicho: subNicho||perfil.nicho, ideaCanal, pvu}`); tarjetas con "Usar este" → `patchProfile({canalNombre})` + toast. Testids `nombres-canal-block`, `nombre-sugerido-{i}`, `nombre-usar-{i}` |
| `app/frontend/src/routes/Settings.tsx` | Bajo el campo "Nombre del canal", visible SOLO si `!profile.canalNombre && profile.nicho`: mismo AiBlock; "Usar este" aplica al estado local del formulario (`setPerfil`) + toast "Recuerda guardar" (el guardado usa el botón existente, según explorer-log) |
| `app/frontend/src/i18n/es.ts` | `wizard.bloqueadoTitulo`, `wizard.bloqueadoIrAlPaso`; sección nueva `nombresCanal` (etiqueta, tip, usar, aplicadoToast, aplicadoLocal, errorAplicar, parseFallido) |
| `app/frontend/src/styles/wizard.css` | `.ai-bloqueado` + icono/título/mensaje/enlace, con tokens (`--accent-gold`, `--bg-elevated`, `--border-subtle`…), junto al resto de estilos del bloque IA |

## Decisiones menores

1. **Bloqueo reactivo, no proactivo:** hacerlo proactivo exigiría duplicar el mapa de requisitos en el frontend (el explorer lo prohíbe: "Frontend NO duplica el mapa"). El orquestador lo permitía ("si el error llega al pulsar, vale").
2. `services/api.ts` NO necesitó cambios: el `ApiError` del cliente ya expone `details` (línea 7 y parser línea 35). Verificado, no tocado.
3. No añadí prop `videoId` a AiBlock: todos los callers del wizard ya pasan `videoProjectId={video.id}`; el enlace se construye con esa prop. El centinela `"viabilidad"` que usa Viabilidad.tsx queda excluido de los enlaces al wizard.
4. El botón queda deshabilitado mientras dura el estado bloqueado (directiva literal). Si el generador convive en la misma página con el campo que falta (p. ej. `seo_preguntas` en investigación), el usuario debe salir/volver al paso para reintentar. Anotado por si el reviewer quiere relajarlo.
5. El chequeo de requisitos va DESPUÉS de `resolveIaConfig` (sin clave sigue ganando el 503 `AI_NOT_CONFIGURED`, como esperan los tests existentes) y ANTES de los bloques de contexto extra (no se hace trabajo de BD inútil).
6. En el HTTP test de `temas_canal`/`sugerir_nombres_canal` bloqueados se pone `nicho: null` vía PATCH (nullable desde el lote A) y se restaura después.

## Verificación (rápida, según rol)

- `npm test --workspace app/backend`: **94/94 pass** (78 previos + 16 nuevos).
- `npx tsc --noEmit` (frontend): limpio.
- `npm run build` (frontend): OK (warning preexistente de chunk >500 kB).
- E2E/Playwright NO ejecutados (corresponde al reviewer). Hay un preview server corriendo por si el reviewer quiere verificar visualmente el estado `aiblock-bloqueado` y los bloques de nombres.

Sin DUDAs pendientes en el LOTE B.
