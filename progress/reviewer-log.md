# Reviewer Log — T021 (onboarding adaptativo) + T022 (cadena del método)

**Fecha:** 2026-06-12
**Agente:** REVIEWER (director de calidad)
**Veredicto:** APROBADO — sin arreglos necesarios. Todo verde.

## Suites ejecutadas

| Suite | Resultado |
|-------|-----------|
| `npm test --workspace app/backend` | **94/94 pass** (12.6s) |
| `npm run typecheck -w app/frontend` (tsc --noEmit) | limpio, 0 errores |
| `npm run build -w app/frontend` (vite) | OK — solo warning preexistente de chunk >500 kB (no relacionado) |
| `npm run test:e2e` (Playwright) — pasada 1 | **8/8 pass** (51.8s) |
| `npm run test:e2e` (Playwright) — pasada 2 | **8/8 pass** (1.1m) — estable, sin residuo entre ejecuciones |

## Verificación dura, punto por punto

### 1. Lógica de la cadena (requisitos.js) — campos REALES
Validado cada requisito contra `videoDefaults.js` y `types.ts`. Todos los campos
evaluados existen y son **planos** (no anidados bajo `investigacion`):
`video.palabrasClave[]`, `video.seoPreguntas[]`, `video.tituloFinal`,
`video.guion.seoInicio`, `video.guion.desarrollo[]`, `video.publishedAt`,
`profile.nicho`. Ningún requisito apunta a un campo inexistente que bloquearía
SIEMPRE. Confirmado además con los subtests unitarios (bloqueado + desbloqueado
por cada generador).

### 2. Flujo end-to-end por API (con stub LLM)
Cubierto por la suite HTTP de `requisitos.test.mjs`:
- crear perfil → `titulo` sin keywords → **422 REQUISITO_FALTANTE**, details[0]={falta:"palabrasClave", pasoSlug:"investigacion"}.
- `descripcion` sin tituloFinal → 422 hacia "titulo"; con título pero sin guion → 422 hacia "guion".
- `temas_canal` / `sugerir_nombres_canal` con nicho=null → 422 hacia "configuracion".
- `sugerir_nombres_canal` con nicho → 200, 5 nombres normalizados (dedupe, vacíos fuera, porQue truncado ≤200, máx 5), historial sin vídeo asociado.
- Respuesta malformada → degradación elegante (parseFallido=true).
El cliente recibe `details`: `errorHandler` los serializa (errors.js) y `AiBlock` los lee (`e.details[0].pasoSlug`).

### 3. Nulabilidad (canalNombre/nicho/frecuencia null)
- `Dashboard`: saludo `canalNombre || "creador"`; subtítulo nicho condicional sin "·" huérfano; banner ampliado a `tieneCanalYa===false || !canalNombre || !nicho`.
- `Settings`: inputs controlados con `?? ""`; select frecuencia con `?? ""` ↔ `null`; guardado normaliza vacío→null; AiBlock sugerir_nombres_canal visible solo si `!canalNombre && nicho`.
- `TemplateDetail`: `profile?.canalNombre ? ... : valorPorDefecto` (sin asunción non-null).
- Resumen onboarding: muestra `sinDecidir` ("Todavía sin decidir") en lugar de null.
- `construirContexto` (prompts.js): `canalNombre ?? "(sin especificar)"`, `nicho ?? "(sin especificar)"` — sin literales "null".
- `bienvenidaToast(nombre: string | null)` con fallback `?? "creador"`.

### 4. Onboarding bifurcado + E2E x2
Ambas ramas correctas por código (`pasosActivos`/`siguientePasoActivo`, centinela
`"no_se"` aislado y convertido a null en `crear()`). Todos los testids del spec
nuevo (`onboarding-nombre-todavia-no`, `onboarding-nicho-no-se`,
`onboarding-frequency-no-se`, etc.) existen en Onboarding.tsx. Suite E2E 8/8 en
dos pasadas; la limpieza con `POST /api/import {replaceAll:true}` en afterEach
mantiene estables los specs 02/03.

### 5. UI del bloqueo (AiBlock)
- Captura solo `REQUISITO_FALTANTE`; `setBloqueado(null)` al regenerar con éxito.
- `finally { setCargando(false) }` → no deja spinner colgado al navegar.
- `enlacePaso`: configuracion→/configuracion, viabilidad→/viabilidad, resto→`/videos/{id}/wizard/{slug}`. Rutas confirmadas contra App.tsx (`/videos/:id/wizard/:stepId`, `/configuracion`, `/viabilidad`). El centinela `videoProjectId="viabilidad"` queda excluido del enlace al wizard.

## Arreglos
Ninguno. Ambos lotes llegaron 100% funcionales tal como se entregaron.

## Patrones recurrentes / candidatos a improvements/
Ninguno (cero rechazos).
