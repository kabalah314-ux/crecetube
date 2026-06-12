# Reviewer Log — T023 (Modo demo: cuenta sandbox precargada desde el login)

**Fecha:** 2026-06-12
**Veredicto:** APROBADO — sin arreglos. Todo pasó a la primera; no toqué código de producto.

## Suites ejecutadas

| Verificación | Resultado |
|--------------|-----------|
| `npm test --workspace app/backend` | **104/104 pass** (94 previos + 10 nuevos de demo.test.mjs) |
| `npx tsc --noEmit` (frontend) | limpio |
| `npm run build` (frontend) | OK (solo warning preexistente de chunk >500 kB) |
| `npm run test:e2e` (Playwright) | **8/8 pass** — corren SIN SESSION_SECRET; nada se rompió, el botón demo no aparece por diseño |
| Lint | N/A — el proyecto no define script de lint ni config ESLint propia (solo dentro de node_modules). El gate de calidad del repo es `test` = backend+tsc+build, todo verde |

## Verificación profunda extra (script efímero, ya borrado)

Arranqué un backend efímero (BD temporal en tmpdir) y verifiqué lo que las suites
existentes no cubren del todo. Todo VERDE:

1. **SEED REAL (con SESSION_SECRET):** POST /api/auth/demo → 201, id `demo-`, esDemo true,
   cookie de sesión. Perfil ready ("Recetas en 15"), 2 canales (principal por defecto +
   "Repostería fácil"), 6 vídeos con estados exactos `[guion, guion, idea, optimizacion,
   publicado, publicado]`. **publishedAt coherente**: solo los publicado/optimizacion lo
   tienen y son fechas pasadas. Snapshots progresivos del publicado **412→1530→4870** vistas;
   resumen vistasTotales=11450, videosConMetricas=3. Curso: **7** asignaturas completadas
   (con notaPersonal). Viabilidad completado=true, autoveredicto "viable".
   **Español con tildes** muestreado y OK en: nicho ("cocina rápida…"), canal ("Repostería
   fácil"), descripción publicada, títulos (¿/tildes), notas de snapshot, notaPersonal de
   curso y PVU de viabilidad.
2. **AISLAMIENTO:** dos demos no comparten ningún vídeo; el usuario local/anónimo ve 0 vídeos
   y perfil 404 (no ve nada del demo).
3. **503 sin SESSION_SECRET:** en child process aparte (config.js congela `cfg` al cargarse),
   POST /demo → 503 y config.authConfigurada=false → el botón demo queda oculto por diseño.
4. **PURGA:** demo envejecida 8 días → `purgeDemoUsers`=1, borrada de las 9 tablas por usuario;
   un usuario NORMAL con createdAt antiguo (999 días) queda **intacto** con su vídeo. Segunda
   pasada idempotente (0).
5. **MIGRACIÓN v5 idempotente:** re-arranque de `initDb` sobre la MISMA BD (migrate v5 +
   purgeDemoUsers en cold-start) sin lanzar; schemaVersion estable en "5".

## UI por código (revisión estática)

- **Botón "Probar la demo"** (`Acceso.tsx`): renderizado solo bajo `authConfig?.authConfigurada`
  (línea 282); reutiliza `enviando`/`fallo()` existentes; `entrarDemo` navega a /dashboard sin
  onboarding. Correcto.
- **Badge DEMO** (`Layout.tsx`): anidado DENTRO de la rama `auth?.modo === "cuenta"` → div
  `sidebar-cuenta`, condicionado a `auth.esDemo`. Las ramas Viabilidad/Proyectos (NAV) y el
  login-local quedan intactas. Usa `.tag` + `--tag-color: var(--accent-gold)`, mismo patrón que
  VideosList y StepTitulo; ambos (clase `.tag` y token `--accent-gold`) existen. No rompe nada.
- i18n: `probarDemo`, `demoHint`, `demoIniciada`, `demoError`, `demoBadge` presentes en `es.ts`.

## Notas

- No hubo nada que arreglar: el implementor entregó la tarea 100% funcional.
- El único cambio que hice en el árbol fue un script de verificación temporal que ya eliminé;
  ningún archivo de producto ni de test permanente fue modificado.
