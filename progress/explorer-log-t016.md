# Explorer Log — T016 + T017
**Fecha:** 2026-06-11
**Agente:** EXPLORER
**Tarea:** T016 "Inicio de sesión con Google" + T017 "Multi-canal: sección Proyectos"

---

## 1. Modelo actual — arquitectura single-user sin autenticación

### Base de datos (`app/backend/src/db.js`)
Tablas existentes y sus claves actuales:

| Tabla | Clave primaria | Relación a usuario |
|---|---|---|
| `profile` | `id TEXT` (UUID) | Singleton: `SELECT … LIMIT 1` siempre |
| `videos` | `id TEXT` | Sin columna userId ni canalId |
| `deleted_videos` | `id TEXT` | Ídem |
| `course_progress` | `asignaturaId TEXT` | Sin userId |
| `templates` | `id TEXT` | Sin userId |
| `ai_interactions` | `id TEXT` | Solo `videoProjectId` |
| `metric_snapshots` | `id TEXT` | Solo `videoProjectId` |
| `meta` | `key TEXT` | Global (seed versions) |

No hay ninguna tabla de sesiones ni tokens. No hay middleware de autenticación en `server.js`. Todas las rutas son públicas.

### Acceso de peticiones al usuario hoy
- `profile.js` usa `getProfileRow(db)` = `SELECT data FROM profile LIMIT 1`. Hoy el perfil es único en la BD.
- `videos.js`, `metricas.js`, `ia.js`, `curso.js`, `plantillas.js`: no leen ni filtran por userId. Cualquiera puede leer/escribir cualquier dato.
- No existe cookie, JWT, ni cabecera de sesión en ningún router.

### Función serverless (Vercel)
- Entrada única: `api/index.mjs` — lazy-init de `createApp()`, una sola instancia.
- Config en `vercel.json`: un rewrite `/api/(.*)` → `/api`, SPA fallback para el resto.
- Variables de entorno usadas hoy: `DB_URL`, `DB_AUTH_TOKEN` (o alias Turso), `LLM_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL`.
- `config.js` lee `.env` manualmente sin dotenv; las envs de Vercel se inyectan directamente como `process.env.*`.

---

## 2. Alcance multi-usuario — qué hay que escopar por `userId`

### Tablas que necesitan columna `userId`
| Tabla | Acción requerida |
|---|---|
| `profile` | Añadir `userId TEXT` como PK real; eliminar el LIMIT 1 singleton |
| `videos` | Añadir `userId TEXT NOT NULL` + índice; filtrar todas las queries |
| `deleted_videos` | Añadir `userId TEXT NOT NULL` |
| `course_progress` | Añadir `userId TEXT NOT NULL`; cambiar PK a `(userId, asignaturaId)` |
| `templates` | Añadir `userId TEXT NOT NULL` solo a las NO precargadas (las precargadas son globales) |
| `ai_interactions` | Añadir `userId TEXT NOT NULL` |
| `metric_snapshots` | Añadir `userId TEXT NOT NULL` |

La tabla `meta` es global (solo guarda versiones de seeds) — no necesita userId.

### Rutas del backend afectadas
Todas las rutas actuales son monousuario. Al añadir auth, **todas** necesitan leer `req.user.id` y filtrar:

- `GET/POST/PATCH /api/profile` — perder el LIMIT 1; buscar/insertar por userId
- `GET/POST/PATCH/DELETE /api/videos` y sub-rutas (`/:id`, `/:id/estado`, `/:id/checklist`, `/:id/duplicar`, `/:id/restaurar`) — añadir `WHERE userId=?`
- `GET /api/metricas/resumen`, `/insights`, `/video/:videoId`, `POST/PATCH/DELETE /api/metricas/snapshot` — filtrar por userId (a través de videos)
- `GET/PATCH /api/curso/progreso` — filtrar por userId
- `GET/POST/PATCH/DELETE /api/plantillas` y sub-rutas — filtrar las propias; las precargadas son globales (esPrecargada=1)
- `POST/GET/PATCH /api/ia/generar`, `/historial`, `/historial/:id` — filtrar por userId
- `GET /api/export`, `POST /api/import` — exportar/importar solo datos del userId autenticado
- `POST /api/ia/test-conexion` — lee el perfil del userId; ya depende de profile

### Tests que asumen single-user
- `app/backend/tests/profile.test.mjs` — usa un perfil singleton, comprueba 409 en segundo POST
- `app/backend/tests/videos.test.mjs` — toda la suite, sin concepto de usuario
- `app/backend/tests/ia-metricas.test.mjs` — crea perfil + vídeo sin userId
- `app/backend/tests/export-import.test.mjs` — dos instancias (a/b) pero sin usuarios
- `app/backend/tests/curso-plantillas.test.mjs` — ídem
- `e2e/01-onboarding.spec.ts` — flujo sin login
- `e2e/02-wizard.spec.ts` — flujo sin login
- `e2e/03-romuald.spec.ts` — flujo sin login
- `app/backend/tests/helpers.mjs` — `PERFIL_OK` sin userId, `boot()` sin auth

---

## 3. Opciones de implementación de Google Sign-In

### Opción A (RECOMENDADA): Google Identity Services (GIS) en el frontend + verificación de ID token en el backend

**Flujo:**
1. Frontend carga el script oficial de Google (`https://accounts.google.com/gsi/client`).
2. El botón GIS genera un `credential` (JWT firmado por Google = "ID token").
3. Frontend envía ese ID token al backend: `POST /api/auth/google { credential }`.
4. Backend verifica la firma del ID token contra los JWKS públicos de Google (URL: `https://www.googleapis.com/oauth2/v3/certs`).
5. Backend extrae `sub` (Google user ID), `email`, `name`, `picture`.
6. Backend busca o crea fila en tabla `users`; genera una sesión propia (JWT firmado con un secreto nuestro, o cookie httpOnly).
7. Todas las rutas posteriores leen `req.user` desde ese JWT/cookie.

**Dependencias mínimas (NO instalar aún, solo documentar):**
- Para verificar el ID token de Google sin llamadas externas en runtime: el backend necesita descargar los JWKS de Google y verificar la firma RS256. Se puede hacer con `google-auth-library` (paquete oficial de Google) o con `jose` (verificación JWKS genérica, ~22 kB). **No instalar ninguna hasta decisión del usuario.**
- Para gestionar la sesión backend: `cookie-parser` + generación de JWT con `jose` (ya útil para lo anterior). Alternativa: `jsonwebtoken` + `cookie-parser`. Si se prefiere sesión stateless pura, solo se necesita firmar el JWT con `crypto.subtle` nativo de Node 20 (sin dependencia externa).
- Variable de entorno nueva: `GOOGLE_CLIENT_ID` (el "client ID" de la aplicación web en Google Cloud Console). No se necesita el client secret en este flujo (el ID token ya viene firmado por Google). Solo se necesita `GOOGLE_CLIENT_ID` para verificar la audiencia del token.
- Variable de entorno nueva: `SESSION_SECRET` (para firmar la cookie/JWT de sesión nuestra).

**Ventajas:** Un solo botón en frontend, sin redirects OAuth. Funciona en Vercel serverless (sin estado de servidor entre invocaciones: la sesión es un JWT stateless). Google gestiona la pantalla de login.

**Desventaja:** Requiere que el usuario cree credenciales en Google Cloud Console. No funciona en localhost sin un dominio autorizado (aunque Google permite añadir `http://localhost:PORT` como origen autorizado).

### Opción B: OAuth 2.0 completo (Authorization Code Flow)
Requiere manejar redirects (`/api/auth/callback`), estado CSRF, y guardar tokens de refresco. Mucho más complejo para una app serverless (el `state` y code verifier necesitan persistirse entre invocaciones). **No recomendado** para este stack.

### Opción C: Email+contraseña propio
Sin dependencia de Google pero obliga a gestionar hashing (bcrypt), recuperación de contraseña (SMTP), validación de email. **Fuera de alcance** si la petición es "Continuar con Google".

### Opción D: Servicio externo (Auth0, Clerk, NextAuth)
Añadiría una dependencia de infraestructura de pago/cuenta externa. **No alineado** con la filosofía del proyecto (autohosted, mínimas dependencias).

---

## 4. Modo local vs nube — no romper el uso local

**Situación hoy:** la app funciona en localhost apuntando a un archivo SQLite local, sin cuentas. Muchos usuarios usarán la app en local sin credenciales de Google.

**Opciones para mantener compatibilidad local:**

### Opción 4A (RECOMENDADA): Auth opcional con "usuario local por defecto"
Si `GOOGLE_CLIENT_ID` no está configurado en las variables de entorno, el backend opera en **modo local anónimo**:
- `req.user` se asigna automáticamente a un userId fijo (`"local"` o un UUID fijo en la meta-tabla).
- El botón de Google no aparece en el frontend; el onboarding va directo al paso de nombre del canal.
- Comportamiento idéntico al actual.

Si `GOOGLE_CLIENT_ID` sí está configurado (producción Vercel), se activa la auth obligatoria:
- El frontend muestra la pantalla de login antes del onboarding.
- Las rutas devuelven 401 si no hay sesión válida.

**Implicaciones:**
- El frontend lee un endpoint `GET /api/auth/config` que devuelve `{ authRequired: boolean, googleClientId: string | null }` y adapta la UI.
- El userId en modo local siempre es el mismo → la BD local sigue siendo single-user de facto, sin cambio de comportamiento.
- La migración de datos existentes (base de datos ya poblada) es trivial: un script de migración asigna `userId = "local"` a todos los registros existentes.

### Opción 4B: Auth siempre obligatoria
Rompe el uso local a menos que el usuario configure credenciales de Google. No recomendado.

### Opción 4C: Auth solo en producción via variable
Similar a 4A pero implementado como middleware que lee `process.env.GOOGLE_CLIENT_ID` en cada request. Más simple pero menos flexible.

---

## 5. Multi-canal (T017)

### Modelo Canal propuesto
Nueva tabla `channels`:
```
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  nombre TEXT NOT NULL,
  handle TEXT,
  nicho TEXT,
  url TEXT,
  esDefault INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_channels_user ON channels(userId);
```

La tabla `videos` gana una columna `canalId TEXT NOT NULL` (con FK lógica al canal).
La tabla `metric_snapshots` NO necesita canalId directamente (se infiere por el video).

### Campos nuevos en `profile`
- `multicanal: boolean` — si el usuario gestiona más de un canal (pregunta nueva en onboarding).
- `canalActivoId: string | null` — el canal seleccionado actualmente (para la UI).

(Estos campos se guardan dentro del JSON `data` del perfil, no requieren columna extra en la tabla `profile`.)

### Pregunta nueva en el onboarding (T017)
Nuevo paso (entre el paso actual 0/bienvenida y el paso 1/¿tienes canal?):
- "¿Gestionas un canal o varios?"
  - Opción A: "Un canal" → flujo actual, sin cambios en la navegación.
  - Opción B: "Varios canales" → activa `multicanal: true`. En el onboarding se crea el primer canal; se pueden añadir más luego.

El total de pasos del onboarding subiría de 9 a 10 (un paso nuevo, antes del paso 1).

### Migración de datos existentes
Al aplicar el nuevo esquema, un script de migración (o lógica en `initDb`):
1. Crea un canal por defecto con los datos del perfil actual (`canalNombre`, `nicho`, `canalUrl`).
2. Asigna `canalId = <id del canal por defecto>` a todos los vídeos existentes.
3. Asigna `multicanal = false` al perfil.

Esto es seguro y no destructivo: los datos existentes quedan intactos bajo el nuevo modelo.

### UI multi-canal — cómo está montada la sección Vídeos hoy

**Archivos afectados:**
- `app/frontend/src/components/Layout.tsx`: el array `NAV` tiene `{ to: "/videos", label: es.nav.videos, icon: Video }`. En modo multicanal este ítem pasaría a `{ to: "/proyectos", label: "Proyectos", icon: FolderOpen }` o se mantiene la misma ruta con label dinámico.
- `app/frontend/src/App.tsx`: rutas `/videos`, `/videos/nuevo`, `/videos/:id`, `/videos/:id/wizard/:stepId`. En modo multicanal se añadirían rutas `/proyectos`, `/proyectos/:canalId`, `/proyectos/:canalId/nuevo`, etc.
- `app/frontend/src/routes/VideosList.tsx`: lista plana de vídeos. En modo multicanal se transformaría en una lista de canales, o en una vista filtrada por canal activo.
- `app/frontend/src/store/useStore.ts`: añadir `canalActivo`, `canales`, `setCanal`.
- `app/frontend/src/services/api.ts`: sin cambios de estructura (solo las URLs que llama).
- `app/frontend/src/i18n/es.ts`: añadir keys `nav.proyectos`, textos del selector de canal, etc.
- `app/frontend/src/types.ts`: añadir interfaz `Channel`, campo `canalId` en `VideoProject`, campos `multicanal`/`canalActivoId` en `UserProfile`.

**Patrón selector/breadcrumb:**
En modo multicanal, la sidebar o el topbar mostraría un selector de canal (dropdown) que establece el `canalActivoId`. Las rutas de vídeos filtran automáticamente por ese canal. El breadcrumb sería: `Proyectos > Nombre del Canal > Vídeos`. La estructura de rutas más limpia sería mantener `/videos` como alias del canal activo, y `/proyectos` como vista global.

### Rutas del backend afectadas por T017
- Nueva ruta: `GET/POST/PATCH/DELETE /api/channels` — CRUD de canales.
- `GET/POST /api/videos` — aceptar y filtrar por `canalId` en query/body.
- `POST /api/videos` — el body debe incluir `canalId` (o asignarse al canal activo del perfil).
- `app/backend/src/db.js` — ampliar SCHEMA con tabla `channels` y columna `canalId` en `videos`.

---

## 6. Impacto en E2E y tests backend

### Tests backend a adaptar
- `helpers.mjs` — `boot()` necesita un mecanismo para autenticar si la auth está activa (o pasar `GOOGLE_CLIENT_ID=""` para activar modo local). `PERFIL_OK` no cambia en modo local.
- `profile.test.mjs` — el test "segundo POST → 409" ya no aplica si el perfil está ligado a userId; hay que reescribir el test de duplicado.
- `videos.test.mjs` — todas las llamadas necesitan el header de auth (o modo local en tests).
- `ia-metricas.test.mjs` — ídem.
- `export-import.test.mjs` — el export ya no es global sino por userId; el test de instancias A/B necesita usuarios distintos si se quiere aislar.
- `curso-plantillas.test.mjs` — ídem.

**Estrategia para tests:** en los tests, pasar una variable de entorno `GOOGLE_CLIENT_ID=""` forzará el modo local. `req.user` se asignará a `userId="local"` automáticamente. Los tests existentes no cambian estructuralmente; solo `helpers.mjs` necesita confirmar que el middleware sabe que está en modo local.

### Tests E2E a adaptar
- `e2e/01-onboarding.spec.ts` — si hay pantalla de login antes del onboarding, el test necesita un paso previo. En modo local (sin `GOOGLE_CLIENT_ID` en el servidor de test), el onboarding va directo como hoy.
- `e2e/02-wizard.spec.ts` — depende de que 01 haya creado el perfil; si el orden cambia (login → onboarding), hay que actualizar la dependencia.
- `e2e/03-romuald.spec.ts` — ídem.

---

## 7. RECOMENDACIÓN — Plan por fases para el implementor

### Fase 0 (sin credenciales de Google) — se puede hacer YA
1. **Nuevo esquema de BD**: añadir columna `userId TEXT NOT NULL DEFAULT "local"` a todas las tablas, tabla `channels`, columna `canalId` en `videos`. Script de migración no destructiva en `initDb`.
2. **Middleware de auth mode-aware**: leer `process.env.GOOGLE_CLIENT_ID`; si vacío → `req.user = { id: "local" }`; si existe → leer y verificar JWT de cookie.
3. **Escopado de todas las rutas**: añadir `WHERE userId=req.user.id` a todas las queries.
4. **Nuevo endpoint `/api/auth/config`**: devuelve `{ authRequired, googleClientId }` para que el frontend sepa qué mostrar.
5. **Endpoint `/api/auth/logout`**: solo limpia la cookie (en modo local es no-op).
6. **T017 — tabla `channels` y CRUD**: implementar rutas `/api/channels` y asociar vídeos a canal.
7. **T017 — pregunta de onboarding**: añadir el nuevo paso "¿un canal o varios?" al onboarding.
8. **T017 — UI "Proyectos"**: condicionalmente mostrar "Proyectos" vs "Vídeos" según `profile.multicanal`.
9. **Actualizar tests**: `helpers.mjs` + los 5 test files backend.

### Fase 1 (BLOQUEADA hasta que el usuario cree credenciales en Google Cloud Console)
10. **Botón Google Sign-In en el frontend**: cargar el script GIS, mostrar el botón.
11. **Endpoint `POST /api/auth/google`**: verificar ID token (con `jose` o `google-auth-library`), buscar/crear usuario en tabla `users`, emitir JWT de sesión en cookie httpOnly.
12. **Tabla `users`**: `id TEXT PK, googleSub TEXT UNIQUE, email TEXT, nombre TEXT, foto TEXT, createdAt TEXT, updatedAt TEXT`.
13. **Pantalla de login**: antes del onboarding si `authRequired: true`.
14. **Migración de datos de `userId="local"` a userId real** (cuando el usuario se registra por primera vez en un servidor que antes era local).

### Modelo de datos final propuesto

```
users: id, googleSub, email, nombre, foto, createdAt, updatedAt
channels: id, userId, nombre, handle, nicho, url, esDefault, createdAt, updatedAt
profile: id, userId, data (JSON con multicanal, canalActivoId, etc.), ...
videos: id, userId, canalId, data, estado, createdAt, updatedAt, publishedAt
deleted_videos: id, userId, canalId, data, deletedAt
course_progress: id, userId, asignaturaId, data
templates: id, userId (NULL si esPrecargada), data, tipo, esPrecargada
ai_interactions: id, userId, data, videoProjectId, tipo, createdAt
metric_snapshots: id, userId, data, videoProjectId, fecha
meta: key, value (global, sin userId)
```

### Decisiones que necesitan al usuario ANTES de implementar
1. **¿Auth obligatoria u opcional?** La recomendación es "opcional con modo local por defecto" (Opción 4A). Si el usuario quiere auth obligatoria desde el primer día, el alcance de los tests E2E cambia.
2. **¿Instalar `google-auth-library` o `jose`?** Ambas son ligeras; `jose` es más genérica. Requiere aprobación explícita.
3. **¿Instalar `cookie-parser`?** Necesario para leer cookies httpOnly firmadas en Express. También requiere aprobación.
4. **¿El usuario ya tiene el `GOOGLE_CLIENT_ID`?** Hasta que no lo tenga, la Fase 1 está bloqueada.
5. **¿En T017, las rutas mantienen `/videos` o pasan a `/proyectos`?** Una opción es mantener `/videos` cuando hay un solo canal y agregar `/proyectos` cuando hay varios (alias dinámico), o siempre usar `/proyectos` con una capa de redirección. Necesita decisión de UX.

---

## Archivos a tocar (resumen para el implementor)

| Archivo | Motivo |
|---|---|
| `app/backend/src/db.js` | Nuevo schema: tabla `users`, tabla `channels`, columnas `userId`/`canalId` en otras tablas; lógica de migración no destructiva |
| `app/backend/src/config.js` | Nuevas env vars: `GOOGLE_CLIENT_ID`, `SESSION_SECRET` |
| `app/backend/src/server.js` | Montar middleware de auth + nuevas rutas `auth` y `channels` |
| `app/backend/src/routes/profile.js` | Filtrar por `req.user.id`; cambiar singleton por userId |
| `app/backend/src/routes/videos.js` | Añadir `userId`/`canalId` a todas las queries |
| `app/backend/src/routes/ia.js` | Filtrar historial por userId |
| `app/backend/src/routes/metricas.js` | Filtrar por userId (a través de videos) |
| `app/backend/src/routes/curso.js` | Filtrar progreso por userId |
| `app/backend/src/routes/plantillas.js` | Filtrar plantillas propias por userId |
| `app/backend/src/routes/system.js` | Export/import escopado por userId |
| `app/backend/src/routes/auth.js` | NUEVO: `POST /auth/google`, `GET /auth/config`, `POST /auth/logout` |
| `app/backend/src/routes/channels.js` | NUEVO: CRUD de canales |
| `app/backend/src/middleware/auth.js` | NUEVO: middleware que inyecta `req.user` |
| `app/backend/tests/helpers.mjs` | Modo local forzado en tests |
| `app/backend/tests/*.test.mjs` (5 archivos) | Adaptación a esquema con userId |
| `app/frontend/src/types.ts` | Añadir `Channel`, campos `multicanal`/`canalActivoId` en `UserProfile`, `canalId` en `VideoProject` |
| `app/frontend/src/store/useStore.ts` | Añadir canales, canalActivo, setCanal; lógica de auth (user session) |
| `app/frontend/src/services/api.ts` | Añadir `credentials: "include"` para cookies + endpoint helper para auth |
| `app/frontend/src/App.tsx` | Rutas nuevas `/proyectos`, `/proyectos/:canalId`; guard de login |
| `app/frontend/src/components/Layout.tsx` | Nav condicional "Vídeos" vs "Proyectos" |
| `app/frontend/src/routes/Onboarding.tsx` | Nuevo paso "¿un canal o varios?" |
| `app/frontend/src/routes/VideosList.tsx` | Vista condicional: canal único (lista de vídeos) vs multicanal (lista de canales) |
| `app/frontend/src/i18n/es.ts` | Keys nuevas para auth, proyectos, selector de canal |
| `app/frontend/src/routes/Login.tsx` | NUEVO: pantalla con botón Google (solo si `authRequired`) |
| `app/frontend/src/routes/Proyectos.tsx` | NUEVO: lista de canales (solo en modo multicanal) |
| `e2e/01-onboarding.spec.ts` | Adaptar si hay pantalla de login previa |

---

## Riesgos y zonas frágiles

1. **Migración no destructiva del esquema SQLite/Turso**: libSQL no permite `ALTER TABLE ADD COLUMN` con `NOT NULL` sin default en tablas existentes. La columna `userId` debe añadirse con `DEFAULT "local"` para no romper datos existentes. Hay que hacer esto con `ALTER TABLE … ADD COLUMN` (no recrear la tabla).
2. **Base de datos en Vercel/Turso (producción)**: el esquema se aplica con `CREATE TABLE IF NOT EXISTS` y `ALTER TABLE IF NOT EXISTS` (si libSQL lo soporta) o con un sistema de versiones de migración. La lógica actual en `initDb` es idempotente pero no hace `ALTER TABLE`. Hay que añadir un mecanismo de migraciones versionadas.
3. **Cold starts serverless + middleware de auth**: verificar JWKS de Google implica una llamada HTTP externa en el cold start (o cachear las claves). Esto puede añadir latencia. La solución es cachear los JWKS en memoria del módulo (persisten entre invocaciones calientes).
4. **La table `profile` hoy tiene PK `id`**, no `userId`. En modo multi-usuario el perfil debe tener `(id, userId)` y buscarse por `userId`, no por `LIMIT 1`. Si el frontend asume que `GET /api/profile` siempre devuelve UNO, eso se mantiene (filtrado por userId de la sesión).
5. **Tests E2E con BD compartida**: los specs 01, 02, 03 comparten la misma BD (el 02 depende del perfil creado por el 01). Si se añade auth, todos necesitan que el servidor E2E esté en modo local (`GOOGLE_CLIENT_ID=""`).
6. **`course_progress` usa `asignaturaId` como PK**: en multi-usuario dos usuarios con la misma asignatura colisionan. La PK debe cambiar a `(userId, asignaturaId)` o a un UUID. Este es un cambio de esquema que **no puede hacerse con ADD COLUMN**: hay que DROP+CREATE o usar una tabla de migración.
7. **Export/import en multi-usuario**: el endpoint actual exporta TODA la BD. Con multi-usuario debe exportar solo los datos del usuario autenticado. El `IMPORT_VERSION` debería subir a 2 para distinguir backups del nuevo formato.
8. **El frontend no envía cookies por defecto**: el `api.ts` usa `fetch` sin `credentials: "include"`. Sin ese campo, las cookies httpOnly no se envían ni se reciben. Es un cambio mínimo pero crítico.
