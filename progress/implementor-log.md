# Implementor Log — T014: Tests E2E con Playwright

Fecha: 2026-06-11

## Resultado de ejecución

7/7 tests PASANDO en 39.5s (3 intentos de corrección hasta llegar al verde).

```
ok 1  e2e/01-onboarding.spec.ts › Onboarding — 9 pasos hasta el dashboard (3.6s)
ok 2  e2e/02-wizard.spec.ts › crear vídeo desde /videos/nuevo (3.6s)
ok 3  e2e/02-wizard.spec.ts › marcar ítem manual del checklist (17.4s)
ok 4  e2e/03-romuald.spec.ts › TipBanner descartar/reabrir (1.8s)
ok 5  e2e/03-romuald.spec.ts › ContextPanel consejo y glosario 9 dt (2.0s)
ok 6  e2e/03-romuald.spec.ts › grabacion 8 checkboxes (2.0s)
ok 7  e2e/03-romuald.spec.ts › sprint 11 checkboxes (1.8s)
```

---

## Archivos creados

- `playwright.config.ts` (raíz) — webServer array [backend node puerto 8002 BD temporal UUID, frontend vite puerto 5174], fullyParallel false, workers 1, reporter list, trace retain-on-failure
- `e2e/01-onboarding.spec.ts` — flujo completo de 9 pasos con datos de prueba realistas en español
- `e2e/02-wizard.spec.ts` — creación perezosa, autosave, persistencia de checklist manual
- `e2e/03-romuald.spec.ts` — TipBanner, ContextPanel con glosario, conteo de checkboxes grabacion/sprint

## Archivos modificados

- `app/frontend/vite.config.ts` — proxy parametrizado con `process.env.BACKEND_PORT ?? "8001"`; sin BACKEND_PORT el comportamiento en dev es idéntico al anterior
- `package.json` (raíz) — añadido script `"test:e2e": "playwright test"`
- `.gitignore` — añadidas líneas `playwright-report/`, `test-results/`, `node_modules/.cache/e2e/`

---

## Decisiones tomadas

1. **UUID vs número en URLs**: el ID de vídeo es un UUID (`7538f37b-ef2d-...`), no un entero. Los patrones de URL usan `/\/videos\/.+\/wizard\//` (no `\d+`). El explorer-log no especificaba el formato del ID; se descubrió en el primer run y se corrigió.

2. **Botón "Siguiente" del onboarding**: usa `data-testid="onboarding-next"`, no texto visible. Verificado leyendo `Onboarding.tsx` antes de escribir el spec.

3. **Slug de chips en nicho**: la función `slug()` del componente normaliza tildes NFD: "tecnología" → "tecnologia". El chip correcto es `onboarding-niche-chip-tecnologia`.

4. **Indicador autosave en checklist manual**: `toggleManual` NO actualiza `saveState` (la barra "Guardado ✓"). El spec 02 usa `page.waitForResponse` para esperar la respuesta del PATCH `/checklist` antes de recargar.

5. **Contexto Playwright entre tests**: cada test recibe un contexto de navegador fresco (sin cookies ni localStorage), pero la BD SQLite es compartida dentro del mismo run. Test 02 navega a `/videos/nuevo` y encuentra el perfil creado por test 01 porque la llamada `GET /api/profile` va a la BD compartida.

6. **Grabacion checklist**: el ítem índice 5 es `energia-camara` ("Roturas de energía planificadas..."). Verificado en `config.ts`.

7. **Sprint checklist primer ítem**: es `sin-cambios-24h` ("Día 1 · Sin tocar miniatura..."), no `email-enviado`. El orden en `config.ts` pone `sin-cambios-24h` primero.

8. **BD temporal**: ruta computada en el config con `Date.now()` bajo `node_modules/.cache/e2e/`, directorio creado con `mkdirSync({ recursive: true })` antes de usarlo.

9. **`__dirname` en playwright.config.ts**: usado `__dirname` (disponible en contexto CommonJS que Node usa para el config); la alternativa ESM `import.meta.dirname` también funcionaría pero `__dirname` es más portable.

---

## Correcciones aplicadas (3 intentos)

**Intento 1 — 7 fallos**: En el onboarding usé `getByRole("button", { name: /siguiente/ })` pero el botón tiene `data-testid="onboarding-next"`. Corregido leyendo `Onboarding.tsx`.

**Intento 2 — 6 fallos**: Todos por UUID en URLs (`\d+` no matchea UUID). Corregidos los tres patrones de URL a `.+`.

**Intento 3 — 7/7 pasan**.
