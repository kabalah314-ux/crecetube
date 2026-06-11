# Reviewer Log — T014: Tests E2E con Playwright

Fecha: 2026-06-11
Veredicto: **APROBADO** (sin arreglos — todo pasó a la primera, estabilidad confirmada).

---

## Qué verifiqué

### 1. Huella de git (`git status --short`)
Coincide con el alcance de T014. Archivos de la tarea:

- **Nuevos**: `playwright.config.ts` (raíz), `e2e/01-onboarding.spec.ts`, `e2e/02-wizard.spec.ts`, `e2e/03-romuald.spec.ts`.
- **Modificados (T014)**: `app/frontend/vite.config.ts`, `package.json` (raíz), `.gitignore`, `progress/implementor-log.md`, `progress/explorer-log.md`.
- **Legítimos T013 (PDF con pdfkit, aún sin commit)**: `app/backend/package.json`, `package-lock.json`, `app/backend/src/routes/plantillas.js`, `app/backend/tests/curso-plantillas.test.mjs`, `app/frontend/src/routes/TemplateDetail.tsx`. NO son de T014: son la implementación de descarga PDF de T013 en el árbol de trabajo. Auditado su diff: añaden formato `pdf` a `/descargar` (con transcripción WinAnsi del texto), ajustan el test (pdf ahora → 200/application/pdf con cabecera `%PDF-`, formato desconocido → 422) y un botón `.pdf` en la UI. Coherentes entre sí; los dejo intactos (no son mi tarea).
- **`TASKS.json`**: tocado por el orquestador, legítimo.

Nota sobre la huella esperada por el orquestador: `progress/2026-06-11.md` y la mayoría de los archivos de T008–T011 ya NO aparecen como modificados porque se consolidaron en los commits `d449e71` y `f7a22c3` entre medias. Sin archivos inesperados fuera de T013/T014.

### 2. Contenido de `playwright.config.ts`
Correcto: `testDir: e2e`, `fullyParallel: false`, `workers: 1`, `reporter: list`, `baseURL: http://localhost:5174`, `trace: retain-on-failure`. `webServer` array de 2: backend `node app/backend/src/server.js` con `PORT=8002` y `DB_URL=file:<temporal>` (ruta computada bajo `node_modules/.cache/e2e/run-<Date.now()>.db`, con `mkdirSync` recursivo y normalización de backslashes a `/` para Windows), frontend `npm run dev -w app/frontend -- --port 5174 --strictPort` con `BACKEND_PORT=8002`. `reuseExistingServer: false` y timeout 120s en ambos. Nunca toca la BD real.

### 3. Contenido de los 3 specs (7 tests)
- Solo `getByTestId` y roles/locators por testid (`[data-testid^=...]`, `getByRole`). Cero selectores de clase CSS como localizador (las clases solo se comprueban con `toHaveClass`, que es aserción, no selector — correcto).
- Cero `waitForTimeout`/sleeps fijos: todo con `expect(...).toBeVisible/toHaveURL/toHaveValue/toBeChecked` (auto-retry) y `page.waitForResponse` para el PATCH del checklist.
- Patrones de URL con `.+` para el id UUID (no `\d+`).
- Español en descripciones y datos de prueba.

### 4. Diff de `app/frontend/vite.config.ts`
Exacto al pedido: `const backend = ${'`'}http://localhost:${'$'}{process.env.BACKEND_PORT ?? "8001"}${'`'};` aplicado a `/api` y `/uploads`. Sin `BACKEND_PORT`, el dev normal sigue apuntando a 8001 — cero impacto. `port: 5173` intacto.

### 5. `package.json` raíz y `.gitignore`
- `package.json`: añade `"test:e2e": "playwright test"` y declara `@playwright/test` en devDependencies. El script `test` (suite rápida) queda intacto — Playwright NO se metió en `npm test`, como exigía el explorer.
- `.gitignore`: añade `playwright-report/`, `test-results/`, `node_modules/.cache/e2e/`.

---

## Ejecuciones

### E2E (`npm run test:e2e`) — 2 corridas para confirmar estabilidad
Puertos de test 8002/5174 verificados libres antes de correr; dev del usuario en 8001/5173 NO se tocó.

- Corrida 1: **7 passed (26.2s)**
- Corrida 2: **7 passed (25.3s)**

```
ok 1 e2e\01-onboarding.spec.ts › Onboarding — 9 pasos hasta el dashboard
ok 2 e2e\02-wizard.spec.ts › crear vídeo desde /videos/nuevo, autosave y persistencia
ok 3 e2e\02-wizard.spec.ts › marcar un ítem manual del checklist y que persista
ok 4 e2e\03-romuald.spec.ts › (a) TipBanner — descartar/reabrir; localStorage
ok 5 e2e\03-romuald.spec.ts › (b) ContextPanel — consejo visible y glosario con 9 dt
ok 6 e2e\03-romuald.spec.ts › (c-1) grabacion → 8 checkboxes; 6º 'Roturas de energía'
ok 7 e2e\03-romuald.spec.ts › (c-2) sprint → 11 checkboxes; 1º 'Día 1'
```

Resultado idéntico en ambas corridas: suite **estable, no flaky**.

### Suite rápida (`npm test`) — backend + tsc + vite build
Cambio en `vite.config.ts` obliga a confirmar el build.

- Backend (`node --test`): **# tests 42 · # pass 42 · # fail 0** (incluye el test de PDF de T013 modificado, que pasa).
- Typecheck (`tsc --noEmit`): sin errores.
- Vite build: **✓ built in 12.08s**. Dos advertencias informativas preexistentes (dynamic import de `config.ts`; chunk >500 kB) — no son fallos; el build completa con éxito.

---

## Higiene post-ejecución
Tras los runs: puertos 8002/5174 libres (Playwright cerró sus webServers, sin procesos huérfanos); dev del usuario en 8001/5173 intacto. BD real nunca tocada (los E2E usaron BD temporal por ejecución).

## Arreglos aplicados
Ninguno. El implementor entregó la tarea funcionando al 100% en la primera verificación.

## Patrones recurrentes / candidatos a improvements/
Ninguno detectado en esta tarea.
