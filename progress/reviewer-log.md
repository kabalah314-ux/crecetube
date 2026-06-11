# Reviewer Log — T018: Fase de viabilidad del canal

Fecha: 2026-06-11
Veredicto: **APROBADO** (sin arreglos necesarios)

## Verificaciones ejecutadas (todas en verde)

| Suite | Resultado |
|-------|-----------|
| `tsc --noEmit` (app/frontend) | ✓ 0 errores |
| `npm test` (app/backend) | ✓ 48 tests / 48 pass / 0 fail (42 previos + 6 de `viabilidad.test.mjs`) |
| `npm run build` (app/frontend) | ✓ build OK (solo warning preexistente de tamaño de chunk, no es error) |
| `npm run test:e2e` (Playwright) | ✓ 7/7 specs pasan (31.8s) |
| Lint | n/a — el proyecto no tiene ESLint configurado (ni script `lint` ni config propia; solo dentro de node_modules). El gate de calidad estática es `tsc`, que pasa. |

## Revisión de coherencia con patrones del repo

- **Backend `viabilidad.js`**: usa `h()`, `jparse`, `nowIso`, mismo estilo singleton (`id='main'`) que `course_progress`/`profile`. GET devuelve `null` cuando no hay fila (coherente con `jparse` y con `profile.js`). PATCH hace upsert con `INSERT OR REPLACE` y merge por spread (modelo plano — correcto, no necesita `mergeDeep`). Columna `completado` derivada del payload. Coherente.
- **Humo manual de la API**: cubierto por los 6 subtests de `viabilidad.test.mjs` que pasaron: GET vacío → `null`; PATCH parcial crea y devuelve `createdAt`/`updatedAt`; GET persiste; segundo PATCH fusiona sin pisar `ideaCanal` y marca `completado:true`; GET refleja el estado. Merge parcial verificado correcto.
- **Generador `evaluacion_nicho` (prompts.js)**: normalizador robusto frente a respuestas malformadas — ante `null`/no-objeto retorna `null` (el render del frontend muestra fallback "No se pudo parsear"); ante campos faltantes aplica defaults seguros (veredicto `ajustar`, puntuación clamp 1-10 → 5, fortalezas/riesgos arrays filtrados a strings no vacíos, `siguientePaso` string|null). Nota menor: la guarda `if (!veredicto && ...)` es código muerto inofensivo (veredicto siempre tiene fallback); no afecta funcionalidad ni robustez.
- **Frontend `Viabilidad.tsx`**: autosave con debounce 800ms vía PATCH (igual patrón que el wizard), tokens CSS en todos los estilos inline, sin literales i18n sueltos en los strings de UI clave (las claves usadas coinciden con `es.viabilidad`, incluidos los typos consistentes `verdictoPivotar`/`autoverdictoPivotar`). data-testids presentes: `viabilidad-page`, `viabilidad-step-1..5`, `viabilidad-saltar`, `viabilidad-veredicto`, más extras (`viabilidad-next`/`back`/`completado`).
- **Dashboard**: banner `dashboard-card-viabilidad` se renderiza solo si `tieneCanalYa === false && viabilidad !== undefined && !completado && !saltado`. Estado inicial `undefined` evita flash. Correcto: desaparece tanto al completar como al saltar.

## Cambio frágil señalado por el explorer — VERIFICADO

`Layout.tsx`: el array `NAV` se movió DENTRO del componente y el ítem `/viabilidad` se inserta condicionalmente vía spread `...(profile?.tieneCanalYa === false ? [...] : [])` entre dashboard y videos.
- Con canal (`tieneCanalYa === true` o `undefined`): el spread devuelve `[]`, el sidebar renderiza sin el ítem. **Verificado en E2E spec 01** (el onboarding elige "Sí tengo canal" → perfil con `tieneCanalYa: true` → los 7 specs pasan sin ítem ni banner de viabilidad interfiriendo).
- Sin canal: el ítem aparece reactivamente (lee `profile` del store, reacciona a cambios en `/configuracion`).
- `NAV` no se exportaba: era constante local del módulo, ninguna otra parte lo importaba. Sin efectos colaterales.

## "Saltar por ahora" — VERIFICADO

`saltar()` hace `PATCH { saltado: true }` al backend (no localStorage), navega a `/dashboard` con toast. El registro de viabilidad recuerda `saltado` en BD; el banner del Dashboard lo lee y desaparece. Persistencia real, no efímera. Coherente con lo pedido.

## Patrón recurrente para improvements

Ninguno. Tarea limpia a la primera; no hubo rechazos ni arreglos.
