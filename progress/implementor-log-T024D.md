# Implementor log — Lote D (T025: viabilidad como paso inicial + IA en sus campos)

- **Fecha:** 2026-06-12
- **Alcance:** Viabilidad.tsx (propuesta + 8 FieldIA + unificación de reglas), Onboarding.tsx (redirect), VideosList.tsx (modal al crear canal), es.ts (sección `viabilidadPropuesta`), camposIA.ts (solo unificación de reglas). NO se tocó backend, wizard/steps/*, FieldIA.tsx, AiBlock.tsx ni Dashboard.tsx.

## Archivos creados
- `app/frontend/src/routes/viabilidadReglas.ts` — NUEVO. Exporta:
  - `TIPS_VIABILIDAD` (idea / demanda / hueco / triangulo): los 4 textos que antes eran literales JSX de los `TipViabilidad` de Viabilidad.tsx.
  - `REGLAS_CAMPO_VIABILIDAD`: regla por campoId = tip del paso + matiz del campo (conserva las guardias anti-alucinación del lote B en `busquedasEncontradas`/`canalesReferencia`). El combo más largo ronda 550 chars (el backend trunca a ≤1200).

## Archivos modificados
- `app/frontend/src/routes/Viabilidad.tsx`:
  - **Pantalla de propuesta** (T025): estado `propuesta` que se activa cuando el GET `/api/viabilidad` devuelve `null` (estudio nunca empezado ⇒ tampoco saltado). Render a pantalla completa ANTES del wizard: titular Romuald (`es.viabilidadPropuesta.titulo`), lista de los 5 pasos (reutiliza `es.viabilidad.pasoNTitulo/Desc` vía const `PASOS_PROPUESTA`), botón "Empezar estudio" (`setPropuesta(false)` → paso 0) y "Ahora no" (→ `saltar()` existente: PATCH `saltado:true` + navigate /dashboard). testids: `viabilidad-propuesta`, `viabilidad-empezar`, `viabilidad-saltar`.
  - **8 FieldIA** (uno por campo `viabilidad.*`): `videoProjectId={null}`, `modo="texto"`, anclados a la fila del label con un `<div>` flex inline-style (las labels `field-label` no tienen CSS propio; el `.field-ia-wrap` es inline-flex con popover absoluto, encaja sin tocar CSS). Cada uno con `valoresActuales={[datos.campo]}` (confirm anti-pisado de FieldIA) y `onUsar={usarIA("campo")}`.
  - **`getContexto` por campo** — espejo exacto de lo que cada entrada de `app/backend/src/campos.js` consume (requisito `opciones.ideaCanal` + `ctxViabilidad(...)`), leído del estado local en el momento del click (evita la carrera con el autosave de 800ms):
    - `ideaCanal`: sin getContexto (requisito = `profile.nicho` server-side; contexto null).
    - `aQuienAyuda`: `{ ideaCanal }` · `formatoPrevisto`: `{ ideaCanal, aQuienAyuda }` · `busquedasEncontradas`: `{ ideaCanal, aQuienAyuda }` · `canalesReferencia`: `{ ideaCanal, busquedasEncontradas }` · `anguloReferencia`: `{ ideaCanal, canalesReferencia }` · `subNicho`: `{ ideaCanal, busquedasEncontradas }` · `pvu`: `{ ideaCanal, subNicho, aQuienAyuda }`.
  - Helper `usarIA(campo)`: update funcional (`setDatos(prev => …)`) que dispara `guardarDebounced(nuevo)` con el estado resultante — respeta el autosave existente.
  - Los 4 `TipViabilidad` ahora pintan `TIPS_VIABILIDAD.*` (textos idénticos a los originales, byte a byte).
- `app/frontend/src/wizard/camposIA.ts` — SOLO sección viabilidad: las 8 reglas espejo sustituidas por `REGLAS_CAMPO_VIABILIDAD[...]` (import de `../routes/viabilidadReglas`); comentario "T025 las unificará" retirado. Sección wizard intacta.
- `app/frontend/src/routes/Onboarding.tsx` — en `crear()`: `navigate(draft.tieneCanalYa === false ? "/viabilidad" : "/dashboard")`, toast intacto.
- `app/frontend/src/routes/VideosList.tsx` — en `ProyectosGrid`: tras crear canal con éxito (el `window.prompt` se conserva, scope descartado), GET `/api/viabilidad` para saber si hay estudio `completado` y apertura de `Modal` (components/ui/Modal.tsx): título `modalTitulo(nombre)`, texto estándar o variante "revisar" si `completado`, botones "Hacer estudio"/"Revisar estudio" (→ `/viabilidad`) y "Ahora no" (cierra). testids: `modal-viabilidad-canal` (en el `<p>` del cuerpo — Modal no acepta data-testid), `modal-viabilidad-si`, `modal-viabilidad-no`.
- `app/frontend/src/i18n/es.ts` — sección nueva `viabilidadPropuesta` (titulo, intro, incluye, empezar, ahoraNo, modalTitulo(fn), modalTexto, modalTextoRevisar, modalHacer, modalRevisar) tras la sección `viabilidad`. Editada AL FINAL del trabajo como pedía el aviso de paralelismo con el lote C; el Edit entró a la primera.

## Decisiones (con motivo)
1. **Unificación de reglas TipViabilidad: HECHA, vía archivo nuevo `viabilidadReglas.ts`** (no exportando desde Viabilidad.tsx): exportar desde Viabilidad.tsx crearía el ciclo Viabilidad.tsx → FieldIA.tsx → camposIA.ts → Viabilidad.tsx. `viabilidadReglas.ts` es hoja (sin imports) y lo consumen ambos lados. Los 4 tips quedaron idénticos a los literales originales; las reglas por campo conservan los matices anti-alucinación del lote B (que eran más ricas que los tips: no se perdió información, se compone tip + matiz). `viabilidad.formatoPrevisto` mantiene su regla propia del lote B porque ese campo no tiene TipViabilidad asociado en pantalla.
2. **Condición de la propuesta = GET null** (sin comprobar `saltado` aparte): si el GET devuelve null el estudio nunca se tocó, luego no puede estar saltado; si existe con `saltado: true`, se entra directo al wizard (el banner del Dashboard, intacto, sigue siendo el recordatorio). En el `.catch` del GET (error de red) NO se muestra la propuesta — comportamiento previo conservado.
3. **testid `viabilidad-saltar` duplicado en código pero nunca en DOM**: la propuesta usa el mismo testid que el botón "Saltar por ahora" del header (lo pedía el encargo); son ramas de render excluyentes, así que no coexisten.
4. **`usarIA` con side-effect (`guardarDebounced`) dentro del updater funcional**: necesario para guardar el estado resultante sin closure viejo; en StrictMode el doble invoke solo resetea el debounce con datos idénticos (PATCH idempotente), sin efecto observable.
5. **GET de viabilidad en `anadirCanal` (no al montar ProyectosGrid)**: una sola petición justo cuando hace falta y con dato fresco; si falla, degrada a la propuesta estándar.
6. **`modo` de los 8 campos sigue siendo `"texto"`** (como dejó el lote B): los campos del estudio son textareas/inputs de texto libre, no chips.

## Verificación
- `npm run typecheck` (app/frontend): **0 errores**.
- `npm run build` (vite): **OK** (aviso preexistente de chunk >500 kB, ya documentado por el lote B).
- Smoke manual no ejecutado (opcional según el encargo; pasada funcional a cargo del reviewer). Puntos a mirar por el reviewer: /viabilidad con estudio null → propuesta; "Ahora no" → toast + dashboard + banner; FieldIA de `viabilidad.aQuienAyuda` sin ideaCanal → popover bloqueado 422 con enlace a /viabilidad; `viabilidad.ideaCanal` sin nicho → enlace a /configuracion (pasoSlug "configuracion", manejado por el `enlacePaso` de FieldIA); modal tras crear canal en /videos (multicanal).

## Desviaciones
- Ninguna sobre el encargo. Sin DUDAs bloqueantes.
