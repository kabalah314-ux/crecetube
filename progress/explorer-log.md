# Explorer log — T014: Tests E2E con Playwright

> Análisis hecho por el orquestador (QA visual en navegador de hoy + lectura de config).
> Fecha: 2026-06-11. El implementor debe leer este log completo antes de escribir nada.
> (El log anterior de T009 quedó archivado en git, commit d449e71.)

## Decisión de arquitectura E2E

- `@playwright/test` 1.60.0 YA instalado en la raíz (devDependency) y chromium-1223 YA descargado. NO reinstalar.
- Los E2E usan **puertos propios** para no chocar con el dev normal: backend **8002**, frontend **5174**.
- BD **temporal file:** por ejecución (nunca la real `app/backend/data/crecetube.db`).
- `playwright.config.ts` en la RAÍZ con `webServer` (array de 2):
  1. Backend: `node app/backend/src/server.js` con env `PORT=8002` y `DB_URL=file:<ruta-temporal>` — `config.js` ya lee ambos del env (verificado, líneas 19 y 22).
  2. Frontend: `npm run dev -w app/frontend -- --port 5174 --strictPort` con env `BACKEND_PORT=8002`.
- `baseURL: http://localhost:5174`, proyecto único chromium, `fullyParallel: false`, `workers: 1` (los 3 specs comparten estado en orden: onboarding crea perfil → wizard crea vídeo → romuald lo usa).
- La ruta temporal de BD se computa EN el config (es TS ejecutado por node): p. ej. `node_modules/.cache/e2e/run-${Date.now()}.db` (crear el directorio con mkdirSync recursive en el config).

## Cambio necesario en vite.config.ts (único archivo existente a tocar)

`app/frontend/vite.config.ts` tiene el proxy fijo: `"/api": "http://localhost:8001"`.
Parametrizar: `const backend = \`http://localhost:\${process.env.BACKEND_PORT ?? "8001"}\`;` y usarlo en `/api` y `/uploads`. Sin BACKEND_PORT todo sigue igual (8001) — cero impacto en dev.

## Testids VERIFICADOS hoy en navegador (capa wizard/Romuald)

- Stepper: `wizard-step-{slug}` con slugs `idea|investigacion|titulo|miniatura|guion|grabacion|edicion|publicacion|sprint|evergreen` (click navega SPA).
- TipBanner: `tip-banner-{slug}` (mismo testid expandido y colapsado; distingue por `className`: `tip-banner` vs `tip-banner-collapsed`), `tip-banner-dismiss-{slug}`, `tip-banner-reopen-{slug}` (span interior del colapsado), `tip-banner-more-{slug}` (solo si hay detalle; sprint lo tiene, idea no).
- Banner descartado persiste en `localStorage["ct.tipbanner.{slug}"] = "1"`; reabrir lo borra.
- ContextPanel: `context-consejo-romuald` (primer bloque) y `context-glosario-romuald` (`<details>` con 9 `<dt>` dentro).
- Checklist: los ítems son `<label>` con `<input type="checkbox">`; grabacion tiene 8 ítems (el 6º es "Roturas de energía planificadas"), sprint tiene 11 (el 1º es "Día 1 · Sin tocar miniatura, título ni descripción durante 24h"). Mirar `app/frontend/src/wizard/Checklist.tsx` para los testids exactos de cada ítem antes de usarlos.
- Autosave: indicador con texto "Guardado" aparece ~1s tras editar (debounce 800ms). Localizar su testid en `app/frontend/src/routes/VideoWizard.tsx` (hay indicador de autosave en la titlebar).

## Onboarding y rutas (el implementor DEBE leer estas fuentes)

- `app/guia_maestra/02_FLUJOS_Y_UX.md` §2.2 (onboarding 9 pasos: campos, validaciones, redirect) y §2.7 (catálogo completo de data-testid).
- Comportamiento verificado: sin perfil, cualquier ruta redirige a `/onboarding`; con perfil, `/onboarding` → `/dashboard`.
- Creación perezosa de vídeo: en `/videos/nuevo`, teclear el primer carácter del título crea el proyecto y la URL pasa a `/videos/:id/wizard/idea` (02 §2.4.1).

## Riesgos conocidos

- Primera carga tras arrancar Vite puede tardar (optimización de deps): `webServer.timeout` generoso (120s) y en los specs usar `await expect(...).toBeVisible()` con auto-retry, nunca sleeps fijos.
- El autosave tarda ~1s: esperar al texto "Guardado" con expect, no con waitForTimeout.
- React Router SPA: tras `page.goto`, esperar a un testid raíz visible.
- Los specs deben usar SOLO `data-testid` (getByTestId) o roles accesibles; cero selectores de clase CSS.

## Alcance de archivos para el implementor

CREAR: `playwright.config.ts` (raíz), `e2e/01-onboarding.spec.ts`, `e2e/02-wizard.spec.ts`, `e2e/03-romuald.spec.ts`.
MODIFICAR: `app/frontend/vite.config.ts` (proxy parametrizado), `package.json` raíz (script `test:e2e": "playwright test"`), `.gitignore` (añadir `playwright-report/`, `test-results/`, `node_modules/.cache/e2e/` si no están).
NO tocar: nada más. NO añadir Playwright a `npm test` (sigue siendo suite rápida); e2e es script aparte.
