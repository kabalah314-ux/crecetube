# Implementor Log — T023 (Modo demo: cuenta sandbox precargada desde el login)

**Fecha:** 2026-06-12
**Estado:** Implementación completa. tests backend 104/104 OK (eran 94) · tsc limpio · build OK.

## Archivos creados

| Archivo | Contenido |
|---------|-----------|
| `app/backend/src/demoSeed.js` | `sembrarDemo(db, userId)`: datos realistas en español del nicho "cocina rápida para gente sin tiempo". Perfil completo (canal "Recetas en 15", tieneCanalYa, gestionMulticanal, nivel intermedio, semanal, suscriptores), 2 canales ("Recetas en 15" por defecto + "Repostería fácil"), 6 vídeos construidos con `nuevoVideo()` de videoDefaults.js y mutados (nunca campos inventados), 6 snapshots con progresión creíble, 7 asignaturas completadas (s1_a7/a8/a9, s5_a1/a2/a7/a8 — todas con contenido real; 2 con notaPersonal), estudio de viabilidad completado:true con autoveredicto "viable". Todo en un solo `db.batch` |
| `app/backend/tests/demo.test.mjs` | 2 tests / 8 subtests: creación (201, id `demo-`, esDemo, cookie), /me con esDemo, perfil ready, 2 canales, 6 vídeos con estados `[guion, guion, idea, optimizacion, publicado, publicado]` y 2 canales usados, snapshots>0 con progresión, curso+viabilidad, aislamiento entre 2 demos y modo local, purga (envejece 8 días vía SQL, `purgeDemoUsers`→1, tablas limpias, demo nueva intacta, sesión purgada→perfil 404, segunda pasada→0) |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/backend/src/db.js` | Migración **v5**: `addColumn(users, "esDemo INTEGER NOT NULL DEFAULT 0")`. Constante `TABLAS_POR_USUARIO` (profile, videos, deleted_videos, course_progress, templates, metric_snapshots, ai_interactions, channels, viabilidad — las mismas de export/import + viabilidad). `purgeDemoUsers(db, dias=7)` exportada y llamada al final de `initDb` (idempotente, apta cold-start) |
| `app/backend/src/routes/auth.js` | `POST /demo`: `requireSecret()` (503 sin SESSION_SECRET, como el resto) → INSERT user `{ id: demo-uuid, nombre: "Cuenta demo", email: null, esDemo: 1 }` → `sembrarDemo` → cookie de sesión normal → 201. `publicUser` ahora incluye `esDemo: Boolean(u.esDemo)`; `GET /me` selecciona `esDemo` y la respuesta de modo local añade `esDemo: false` |
| `app/backend/tests/helpers.mjs` | `boot()` devuelve también `app` (acceso a `app.locals.db` para el test de purga). No rompe a los demás callers |
| `app/frontend/src/types.ts` | `AuthUser.esDemo: boolean` |
| `app/frontend/src/store/useStore.ts` | Fallback de `loadAuth` (backend antiguo/sin conexión) añade `esDemo: false` |
| `app/frontend/src/routes/Acceso.tsx` | `entrarDemo()`: POST /api/auth/demo → `loadAuth` + `loadProfile` → toast → `/dashboard` (replace, cero onboarding). Botón secundario `acceso-demo` + hint "Una cuenta de ejemplo…" bajo la grid de login/registro, visible SOLO si `authConfig?.authConfigurada`. Reutiliza `fallo()` y el estado `enviando` existentes |
| `app/frontend/src/components/Layout.tsx` | Badge `sidebar-demo-badge` (clase `.tag` con `--tag-color: var(--accent-gold)`) dentro del div `sidebar-cuenta` existente, solo si `auth.esDemo`. El botón Salir es el existente; NO se tocaron las ramas Viabilidad/Proyectos/login-local |
| `app/frontend/src/i18n/es.ts` | `acceso.probarDemo`, `demoHint`, `demoIniciada`, `demoError`, `demoBadge` |

## Resumen del seed (6 vídeos)

1. **Publicado hace 20 días** (mixto, canal principal): "5 cenas en 15 minutos con 6 ingredientes (sin horno)" — keyword en título, descripción completa, timestamps, tarjeta SEOjeta, difusión completa, 3 snapshots (412→1530→4870 vistas, CTR 4.2→5.6).
2. **Sprint día 3** (publicado hace 3 días): "3 desayunos para llevar que preparas el domingo" — difusión a medias (email+post sí, twitter/tiktok no), checklist sprint hasta snapshot-dia2, 1 snapshot.
3. **Guion a medias**: "7 errores al congelar comida" — seoInicio+seoShock escritos, 1 bloque de desarrollo, sin seoResultado, nota de pendientes.
4. **Idea recién creada** (ayer): "Menú semanal con 25 euros".
5. **Evergreen 40 días** (estado `optimizacion`, el que produce la transición automática): "Batch cooking para principiantes" — 2 snapshots con aceleración (980 d7 → 6200 d30), checklist evergreen a medias.
6. **En miniatura** (canal secundario): "Bizcocho de yogur sin báscula" — estrategia SEOcara elegida, brief escrito, título cerrado.

## Decisiones menores

1. El vídeo 5 se siembra directamente en `optimizacion` (lo que `aplicarTransicionesAuto` produciría con publishedAt −40d): estados deterministas en tests y banner de optimización visible desde el primer render.
2. La purga vive en `db.js` (no en demoSeed.js): es mantenimiento de BD ligado a `initDb`, y el test la importa de ahí. `demoSeed.js` solo siembra.
3. No hay test del 503 de `/demo` sin SESSION_SECRET: `helpers.mjs` fija el secreto a nivel de módulo y la suite existente tampoco lo cubre para registro/login (mismo `requireSecret()` compartido).
4. `templates` se purga por `userId` directo: las precargadas tienen `userId='local'` (default v1), jamás colisionan con un `demo-uuid`.
5. El botón demo comparte el estado `enviando` con login/registro (evita doble submit cruzado).

## Verificación (rápida, según rol)

- `npm test --workspace app/backend`: **104/104 pass** (94 previos + 10 nuevos).
- `npx tsc --noEmit` (frontend): limpio.
- `npm run build` (frontend): OK (warning preexistente de chunk >500 kB).
- E2E/Playwright NO ejecutados (encargo explícito). Para verificar el botón en el preview, el backend debe tener SESSION_SECRET (si no, el botón no se muestra por diseño): queda para el reviewer.

Sin DUDAs pendientes.
