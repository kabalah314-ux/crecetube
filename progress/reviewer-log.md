# Reviewer log — T024 (IA por campo) + T025 (viabilidad como paso inicial)

- **Fecha:** 2026-06-12
- **Rol:** director de calidad. Verifiqué los 4 lotes (T024A/B/C/D) y dejé todo en verde.
- (Log anterior, T023, archivado en el historial de git.)

## Qué verifiqué

### 1. Entorno y diff
- `git status`: 13 archivos modificados + 5 nuevos (campos.js, campos.test.mjs, viabilidadReglas.ts, FieldIA.tsx, camposIA.ts) + los 4 logs. **NADA prohibido tocado** (CLAUDE.md, MASTERPROMPT.md intactos; AiBlock.tsx no modificado; testids `ai-generate-*` intactos).
- **AVISO DEL ENCARGO CONFIRMADO:** el explorer se equivocó — Playwright SÍ existe (`playwright.config.ts` + `e2e/` con 8 casos). Lo corrí completo.

### 2. Backend — `node --test app/backend/tests/`
- **125 pass / 0 fail** (104 previos + 21 nuevos de campos.test.mjs). Confirma el número que reportó el lote A.

### 3. Frontend — `npm run typecheck` + `npm run build`
- typecheck: **0 errores**. Los 8 errores que el lote C vio en Viabilidad.tsx quedaron resueltos al cerrar el lote D (confirmado el estado final como pedía el encargo).
- build (vite): **OK**, solo el aviso preexistente de chunk >500 kB (no relacionado con estos cambios).
- No hay ESLint configurado en el proyecto (no hay `eslint.config.*` ni `.eslintrc` propios fuera de node_modules, ni script de lint en ningún package.json). La puerta de calidad del repo es `npm test` (backend + typecheck + build) + Playwright. `tsc --noEmit` cubre el análisis estático.

### 4. Playwright — `npx playwright test` (suite completa, 8 casos)
- **Antes de mi arreglo: 7 pass / 1 fail.** Tras el arreglo: **8 pass / 0 fail.**

## Qué encontré roto y cómo lo arreglé

### FALLO: e2e/01-onboarding.spec.ts:16 — "rama sin canal"
- **Causa:** NO es un bug del código; es un test desactualizado por el cambio intencionado de T025. El lote D modificó `Onboarding.tsx` para que `tieneCanalYa === false` redirija a `/viabilidad` (antes iba a `/dashboard`). El test seguía esperando `/dashboard` en la línea 56 → timeout.
- **Decisión (test vs código):** arreglé el TEST, no el código. La redirección a /viabilidad es justo el comportamiento deseado de T025 ("antes de grabar nada, valida que hay hueco"), está documentada en el log del lote D y respaldada por el MASTERPROMPT. Revertir el código sería romper la feature.
- **Arreglo (2 ediciones en el spec):**
  1. Tras `onboarding-submit`, ahora el test espera `/\/viabilidad/` + `viabilidad-propuesta` visible, pulsa `viabilidad-saltar` ("Ahora no") y entonces espera `/\/dashboard/`. Reproduce el flujo real T025.
  2. La aserción final cambió de `dashboard-card-viabilidad` **visible** a `toHaveCount(0)`: tras saltar el estudio se persiste `saltado: true`, y `Dashboard.tsx` (línea 92: `&& !viabilidad?.saltado`) oculta el banner a propósito. Esto VERIFICA el requisito del encargo "Ahora no → dashboard y no vuelve a aparecer". El test ahora prueba algo más fuerte que antes.
- El `afterEach` del describe resetea la BD (`/api/import replaceAll`), así que el `saltado:true` no contamina los specs 02/03 (que pasan).

## Verificaciones cruzadas de contrato (lectura, sin tocar)

- **getContexto (Viabilidad.tsx / Steps) ↔ campos.js:** revisé los 16 campoIds. Cada clave de contexto que consume `ctxViabilidad(...)` y cada requisito (`opciones.ideaCanal`) están en el `getContexto` del frontend. Tabla campo a campo: **0 mismatches**. Ningún campo se bloquea de más ni genera sin contexto.
- **Registro frontend `camposIA.ts` (16) ↔ whitelist backend `campos.js` (16):** coinciden 1:1 (8 wizard + 8 viabilidad). El whitelist de ia.js rechaza con 422 cualquier campoId fuera de la lista (anti prompt-injection, cubierto por test).
- **Request FieldIA ↔ ia.js:** `{tipo:"rellenar_campo", videoProjectId, opciones:{campoId, reglaCampo, ...ctx}}` exacto. Guardias de tamaño (reglaCampo ≤1200, resto ≤1500) y borrado de claves `_*` del cliente, ANTES de evaluarRequisitos. Correcto.
- **pasoSlug → enlace:** `enlacePaso()` mapea `configuracion → /configuracion`, `viabilidad → /viabilidad`. `viabilidad.ideaCanal` bloqueado devuelve pasoSlug "configuracion" (falta el nicho) y enlaza bien a /configuracion. Resto de viabilidad.* → /viabilidad.
- **"Añadir todas" / acumuladores:** StepInvestigacion (`kwRef`) y StepGuion (`desarrolloRef`) actualizan el ref de forma síncrona en cada `onUsar` y lo re-sincronizan en cada render → no se pierden elementos en las llamadas seguidas del mismo tick. Correcto (el patch no admite updates funcionales, por eso el ref).
- **Popover z-index:** `.field-ia-popover` con z-index 60 (> stepper sticky 10 y acordeón) — por encima del `details.acordeon` de StepPublicacion.

## Diff sano (revisado)
- **Sin console.log/debug** en ninguno de los archivos cambiados (grep limpio).
- **Textos UI en español, sin mojibake.** Revisé las dos secciones de es.ts editadas en paralelo por C y D (`fieldIA`, `viabilidadPropuesta`) + `viabilidadReglas.ts`: tildes, eñes y signos (Añadir, Añadido ✓, Pensando…, ¿Sustituir, «nombre», MÉTODO) correctos. **El precedente de mojibake del proyecto NO se repitió.**
- **es.ts íntegro:** cada sección top-level (`fieldIA`, `viabilidad`, `viabilidadPropuesta`) aparece una sola vez; ninguna pisada por el trabajo en paralelo; sin claves duplicadas.
- **Sin código muerto.** El `onUsar={() => {}}` de StepGuion (modo bloques) es un noop deliberado documentado (la prop es obligatoria por contrato).
- **Falsos positivos descartados:** la herramienta de búsqueda mostró `\ ...` en lugar de `// ...` en StepGuion.tsx:41 y prompts.js:430; verifiqué con lectura directa que el fichero tiene `//` correcto en ambos. No es un bug.

## Números
- Backend: 125 pass / 0 fail (sin cambios; no toqué backend).
- Typecheck: 0 errores. Build: OK.
- Playwright: **7→8 pass** (arreglé 1 test obsoleto; 0 fails finales).

## Patrón de errores recurrentes
- Ninguno. Un solo fallo, de naturaleza "test obsoleto por cambio de feature intencionado", no un patrón repetido entre lotes. Nada que registrar como candidato a `improvements/`.

## Veredicto

**APROBADO** — verificado: backend `node --test` 125/125 ✓, typecheck (tsc --noEmit) 0 errores ✓, build (vite) ✓, Playwright 8/8 ✓. Lint: N/A (el proyecto no define ESLint). Contratos cruzados frontend↔backend verificados sin mismatches. UI en español sin mojibake. Único arreglo: actualicé `e2e/01-onboarding.spec.ts` para reflejar el nuevo flujo T025 (redirect a /viabilidad + skip), sin tocar código de producción.
