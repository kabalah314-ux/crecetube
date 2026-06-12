# Reviewer Log — T016+T017 COMPLETO (lotes 1 backend + 2 frontend)
**Fecha:** 2026-06-12
**Agente:** REVIEWER (director de calidad)
**Resultado:** APROBADO CON ARREGLO MENOR DE ENTORNO (no se tocó código de producción)

## Resumen ejecutivo
Verificado con dureza el bloque multi-usuario + multi-canal + auth. Todo el código de
producción funciona; no hubo que corregir nada en la app. El único arreglo fue de higiene
del entorno de tests (BDs e2e huérfanas que provocaban un fallo inicial flaky).

## Suites ejecutadas (todas en verde)
- `scripts/init.sh` → ✓ (incluye tests Node + build frontend)
- `npm test --workspace app/backend` → **73 pass / 0 fail** (9 archivos)
- `npm run typecheck --workspace app/frontend` (`tsc --noEmit`) → ✓ limpio
- `npm run build --workspace app/frontend` → ✓ (21s; único warning: chunk >500 kB, preexistente)
- `npx playwright test` (e2e COMPLETO) → **7 pass / 0 fail**, confirmado en 2 ejecuciones consecutivas

## Migración sobre BD existente (camino v0 → v4) — CRÍTICO, verificado
La BD real `app/backend/data/crecetube.db` YA estaba en schemaVersion 4 (el backend se había
arrancado durante el desarrollo). Para probar el camino de upgrade sobre datos existentes:
1. Copié la BD real + sus sidecars `-wal`/`-shm` a `node_modules/.cache/review-migra.db`
   (los datos vivían en el WAL de 1.2 MB; copiar solo el `.db` de 4 KB daba "no such table").
   **JAMÁS toqué el archivo real.**
2. Revertí la copia a estado v0 genuino (sin tablas `users`/`channels`, sin columnas
   userId/canalId, sin `meta.schemaVersion`), conservando el vídeo real (id 30637c14),
   el perfil real (`canalNombre: "Canal de Oscar"`), 25 plantillas.
3. Arranqué las migraciones reales (`initDb`) sobre la copia v0.

Resultado:
- **schemaVersion final = 4** ✓
- Vídeo conservado, `userId='local'`, **adoptado por el canal por defecto** en la columna
  `canalId` Y en el JSON interno (ambos apuntan al mismo canal) ✓
- Canal por defecto creado con el nombre real del perfil: **"Canal de Oscar"** (la migración v2
  lee `profile.canalNombre`, no usa el genérico "Mi canal") ✓
- Perfil intacto, `course_progress` y `viabilidad` recreadas con PK compuesta, 25 plantillas ✓
- **Idempotente**: segundo arranque idéntico, sin duplicar canal ni datos ✓

## Seguridad auth — verificada (crítico)
- scrypt con salt aleatorio de 16 bytes (`randomBytes`), formato `salt:hash`, comparación con
  `timingSafeEqual` y chequeo de longitud previo → ✓
- Cookie de sesión `ct_session`: `httpOnly`, `sameSite: "lax"`, `secure` solo en producción,
  `path: "/"`, maxAge 30d → ✓
- JWT de sesión HS256 firmado/verificado con `jose` y `SESSION_SECRET`; `algorithms:["HS256"]`
  explícito en verify → ✓
- `POST /api/auth/google`: verifica firma contra JWKS de Google (`createRemoteJWKSet`),
  `issuer` (accounts.google.com en sus 2 formas) Y `audience: GOOGLE_CLIENT_ID`. Sin
  `GOOGLE_CLIENT_ID` → 503 (no acepta tokens). Token inválido → 401 → ✓
- Comportamiento ante cookie inválida/caducada: cae a `req.userId = "local"` (modo local),
  nunca 401. Sin `SESSION_SECRET`, la app entera funciona en modo local → ✓
- `GET /me` con cookie de usuario inexistente → modo local (sin 500) → ✓
- **Aislamiento por userId**: revisadas TODAS las rutas (profile, videos, curso, metricas, ia,
  plantillas, viabilidad, canales, system). Todos los SELECT/INSERT/UPDATE de datos de usuario
  filtran por `userId`. Los UPDATE/DELETE por `id` sin userId en la línea van SIEMPRE precedidos
  de un SELECT escopado por userId que establece propiedad → ninguna ruta filtra datos ajenos ✓
- Plantillas precargadas visibles globalmente (`esPrecargada=1 OR userId=?`); las propias por
  userId → ✓

## Coherencia del Layout — verificada
- Sidebar foot: modo `cuenta` → nombre/email + botón Salir; modo `local` + `authConfigurada`
  → enlace discreto "Iniciar sesión"; modo local sin auth → no muestra nada (idéntico al
  estado previo al bloque) ✓
- NAV: "Vídeos" → "Proyectos" solo si `profile.gestionMulticanal`; Viabilidad condicional a
  `tieneCanalYa === false` intacta ✓
- Onboarding: paso multicanal con testids `onboarding-multichannel-single`/`-multi`, valida la
  elección, `gestionMulticanal` propagado a `createProfile`; spec 01 cubre los 10 pasos ✓

## Regresiones — sin impacto
- Curso, Viabilidad y wizard de frontend NO se tocaron (Curso.tsx/Viabilidad.tsx sin cambios);
  en backend solo se añadió `WHERE userId=?` (curso.js y viabilidad.js: +9 líneas cada uno).
- Tutorial OpenRouter: el spec 01 lo abre y lo cierra correctamente (pasó).
- Wizard / capa Romuald: specs 02 y 03 verdes (vídeo creado, checklists, TipBanner, ContextPanel).
- Curso filtrado (63 visibles): lógica de seed/frontend no tocada por este bloque.

## Lo que estaba "roto" y cómo lo arreglé
**Nada de código.** En la PRIMERA ejecución de `npx playwright test` los 7 tests fallaron
(el 01 no redirigía a /onboarding porque encontraba un perfil ya creado). Causa: **12 BDs
`run-*.db` huérfanas** acumuladas en `node_modules/.cache/e2e/` de runs abortados durante el
desarrollo + carrera de arranque del dev server. La config de Playwright crea una BD nueva por
ejecución, pero las huérfanas ensuciaban el diagnóstico y el arranque.
- **Arreglo:** limpié las 12 BDs huérfanas de `node_modules/.cache/e2e/` (solo ese directorio
  de cache; jamás la BD real). Tras limpiar, la suite completa pasó 7/7 en dos ejecuciones
  consecutivas. No es un bug del bloque T016/T017; es higiene del entorno de tests.

## Patrones recurrentes (candidatos a improvements/)
- Ninguno con frecuencia ≥2. Nota de mejora opcional (NO bloqueante): la config e2e podría
  borrar las BDs `run-*.db` previas al arrancar, para evitar acumulación y diagnósticos
  confusos. Lo dejo a criterio del orquestador (`/improve`); fuera del alcance del bloque revisado.

## Veredicto
**APROBADO** — init.sh ✓ · tsc ✓ · backend tests 73/73 ✓ · build ✓ · playwright 7/7 ✓ ·
migración v0→v4 sobre BD existente ✓ · seguridad auth ✓ · aislamiento userId ✓ ·
Layout coherente ✓ · sin regresiones.
