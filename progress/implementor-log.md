# Implementor Log — T016+T017 LOTE 1 (backend: multi-usuario + multi-canal + auth)
**Fecha:** 2026-06-12
**Agente:** IMPLEMENTOR
**Resultado tests:** `npm test --workspace app/backend` → **73 pass / 0 fail** (9 archivos de test)

## Archivos creados
- `app/backend/src/middleware/auth.js` — cookie JWT `ct_session` (HS256, jose, 30 días). Sin cookie válida o sin `SESSION_SECRET` → `req.userId = "local"` (nunca 401).
- `app/backend/src/routes/auth.js` — `POST /api/auth/registro` (scrypt salt:hash, 422/409), `POST /api/auth/login` (timingSafeEqual, 401), `POST /api/auth/google` (jose createRemoteJWKSet contra certs de Google, issuer accounts.google.com, audience GOOGLE_CLIENT_ID, upsert por googleSub→email), `POST /api/auth/logout`, `GET /api/auth/me` (modo `local`|`cuenta`).
- `app/backend/src/routes/canales.js` — CRUD `/api/canales`. DELETE 422 `CHANNEL_NOT_DELETABLE` si es por defecto o tiene vídeos. PATCH acepta `nombre` y `esPorDefecto:true` (mueve el default).
- `app/backend/tests/auth.test.mjs` — registro→me→logout→login, password mala 401, duplicado 409, aislamiento de datos local/cuenta, cookie manipulada → modo local, google sin client id → 503.
- `app/backend/tests/canales.test.mjs` — CRUD + default + filtro `?canalId=` + default en POST /videos + `gestionMulticanal` en perfil.

## Archivos modificados
- `app/backend/src/db.js` — **4 migraciones versionadas** (meta `schemaVersion`): v1 tabla `users` (+seed usuario `local`) + columna `userId TEXT NOT NULL DEFAULT 'local'` en profile/videos/deleted_videos/templates/ai_interactions/metric_snapshots; v2 tabla `channels` + canal por defecto del usuario local (nombre = `canalNombre` del perfil o "Mi canal") + `videos.canalId` + adopción (columna Y JSON interno del vídeo); v3 `course_progress` recreada con PK `(userId, asignaturaId)`; v4 `viabilidad` recreada con PK `(userId, id)`. Helpers exportados: `ensureDefaultChannel`, `adoptVideosSinCanal`. `addColumn()` tolera "duplicate column" (reanudación segura).
- `app/backend/src/config.js` — `SESSION_SECRET`, `GOOGLE_CLIENT_ID`.
- `app/backend/src/server.js` — `cookieParser()` + `authMiddleware` ANTES de las rutas; monta `/api/auth` y `/api/canales`.
- `app/backend/src/routes/profile.js` — escopado por userId (adiós `LIMIT 1`); `getProfileRow(db, userId)`; campo `gestionMulticanal` (default false, validado booleano-opcional).
- `app/backend/src/routes/videos.js` — todo escopado; `GET /` acepta `?canalId=`; `POST /` acepta `canalId` (default: canal por defecto, 422 si es ajeno); `PATCH /:id` permite mover de canal validando propiedad; soft-delete/restaurar con userId.
- `app/backend/src/routes/curso.js`, `metricas.js`, `ia.js` — escopados por `req.userId` en todas las queries e inserts.
- `app/backend/src/routes/plantillas.js` — visibles: `esPrecargada=1 OR userId=?` (precargadas globales); propias con userId.
- `app/backend/src/routes/viabilidad.js` — singleton POR usuario (PK compuesta).
- `app/backend/src/routes/system.js` — export/import escopados; export incluye `canales`; import los restaura y `adoptVideosSinCanal` cubre backups v1 antiguos sin canales. `EXPORT_VERSION` sigue en 1 (formato compatible).
- `app/backend/src/videoDefaults.js` — `canalId: null` en el shape del vídeo.
- `app/backend/tests/helpers.mjs` — fija `SESSION_SECRET` de tests (las llamadas SIN cookie siguen siendo modo local: intención de los tests intacta); `call()` acepta `{ cookie }` y devuelve `setCookie`.
- `app/backend/package.json` — dependencias nuevas: `jose@^6.2.3`, `cookie-parser@^1.4.7` (las dos autorizadas, ninguna más). `package-lock.json` raíz actualizado.
- `.env.example` — `SESSION_SECRET=` y `GOOGLE_CLIENT_ID=` comentados (vacíos = modo local; init.sh no los exige al estar comentados).

## Decisiones menores
1. El SCHEMA base queda en forma v0: BD nueva y BD existente pasan por la MISMA lista de migraciones (un solo camino de upgrade).
2. `viabilidad` no estaba en el explorer-log (es posterior, T018) pero es dato de usuario: escopada igualmente. Código real > explorer-log.
3. El campo real del perfil es `canalNombre` (el encargo decía "nombreCanal"): usado el real.
4. Auth endpoints devuelven 503 `AUTH_NOT_CONFIGURED` si falta `SESSION_SECRET`/`GOOGLE_CLIENT_ID`; el resto de la app jamás exige sesión.
5. `GET /api/auth/me` con cookie válida de un usuario ya inexistente responde modo local (sin 500).
6. Email se normaliza a minúsculas en registro/login; duplicado → 409 `EMAIL_ALREADY_EXISTS` (patrón 409 del repo).
7. El canal por defecto de una cuenta nueva se llama "Mi canal" (al registrarse aún no hay perfil); el lote 2 puede renombrarlo en onboarding vía `PATCH /api/canales/:id`.

## Dudas
- Ninguna bloqueante.

---

# Implementor Log — T016+T017 LOTE 2 (frontend: acceso + sidebar + onboarding multicanal + vista Proyectos)
**Fecha:** 2026-06-12
**Agente:** IMPLEMENTOR (continuación: un agente anterior dejó el lote al ~40%)
**Verificación:** `npx tsc --noEmit` limpio · `npm run build` (frontend) OK (37s; warning de chunk >500 kB ya preexistente) · `npm test --workspace app/backend` → 73 pass / 0 fail.

## Encontrado ya hecho (agente anterior) — NO rehecho
- `app/frontend/src/routes/Acceso.tsx` — página completa (login, registro, GIS bajo demanda, testids).
- `app/frontend/src/services/api.ts` — `credentials: "include"`.
- `app/frontend/src/store/useStore.ts` — `auth`, `authConfig`, `loadAuth()` (me + config en paralelo, fallback a modo local), `logout()` (recarga con `window.location.assign("/")`).
- `app/frontend/src/types.ts` — `AuthUser`, `AuthConfig`, `Channel`, `gestionMulticanal` en `UserProfile`.
- `app/frontend/src/i18n/es.ts` — bloques `acceso`, `proyectos`, strings multicanal del onboarding, `nav.proyectos`.
- Backend: `GET /api/auth/config` YA existía en `app/backend/src/routes/auth.js` (líneas 44-49) con la forma exacta pedida. No tocado.

## Archivos modificados (este lote)
- `app/frontend/src/App.tsx` — ruta `/acceso` registrada FUERA de `RequireProfile` (antes del grupo con Layout).
- `app/frontend/src/components/Layout.tsx` — `loadAuth()` al montar si `auth === null`; en `sidebar-foot`: modo `cuenta` → nombre/email (`sidebar-cuenta`) + botón Salir (`sidebar-logout`); modo `local` + `authConfigurada` → NavLink discreto a `/acceso` (`sidebar-login`); modo local sin auth → sidebar idéntico a antes. Etiqueta del nav de vídeos pasa a `es.nav.proyectos` si `profile.gestionMulticanal`. NAV condicional de Viabilidad intacto.
- `app/frontend/src/routes/Onboarding.tsx` — paso 2 nuevo "¿Gestionas un canal o varios?" (radio-cards, testids `onboarding-multichannel-single`/`-multi`); pasos 2..8 renumerados a 3..9 (valida, pasos, resumen con fila "Canales", progreso "Paso X de 9", submit); `gestionMulticanal: Boolean(...)` en `createProfile`.
- `app/frontend/src/routes/VideosList.tsx` — dividido en `VideosList` (router), `ProyectosGrid` (rejilla de canales: GET /api/canales + conteo de vídeos por canal vía GET /api/videos; `proyectos-grid`, `proyecto-card-{id}`, `proyectos-add` con `window.prompt` → POST /api/canales) y `ListaVideos` (lista de siempre, ahora con `?canalId=` en el fetch, título = nombre del canal, enlace de volver `videos-volver-proyectos`, "Nuevo vídeo" propaga canalId). Con `gestionMulticanal=false` el comportamiento es idéntico al anterior.
- `app/frontend/src/routes/NewVideo.tsx` — lee `?canalId=` y lo incluye en el POST /api/videos; el enlace de volver conserva el canal.
- `app/frontend/src/routes/Acceso.tsx` — aviso de modo local ahora también proactivo (`authConfig.authConfigurada === false`), no solo tras un intento fallido.
- `app/frontend/src/i18n/es.ts` — `bienvenidaSub` "6 preguntas" → "7 preguntas"; `proyectos.volver`, `proyectos.errorCrear`.
- `app/frontend/src/styles/onboarding.css` — `.acceso-grid` (la clase la usaba Acceso.tsx pero NO existía).
- `app/frontend/src/styles/components.css` — `.proyecto-card` (+hover, meta).
- `app/frontend/src/styles/layout.css` — `.sidebar-cuenta` (no clicable, ellipsis).
- `e2e/01-onboarding.spec.ts` — paso multicanal añadido tras "¿ya tienes canal?", comentarios renumerados (10 pasos). NO ejecutado (orden expresa).

## Decisiones menores
1. Pregunta multicanal incondicional (también si `tieneCanalYa=false`): el encargo no la condicionaba.
2. Conteo de vídeos por canal calculado en cliente (GET /api/videos completo) porque GET /api/canales no devuelve conteos; evita tocar backend fuera del encargo.
3. Borradores de onboarding antiguos (paso > 2 guardado) saltarían la pregunta nueva → `gestionMulticanal` queda `false` (default seguro, igual que hoy).
4. "Añadir canal" usa `window.prompt` (string `proyectos.promptNombre` ya lo había dejado preparado el agente anterior); sin modal nuevo.
5. El canal por defecto NO se renombra en onboarding (decisión 7 del lote 1 lo dejaba como opcional); fuera del encargo delegado.

## Para el reviewer
- Verificación en navegador pendiente (rol implementor: solo tsc/build/tests). Flujos a cubrir: /acceso (con y sin SESSION_SECRET), sidebar en los 3 modos, onboarding 10 pasos, vista Proyectos con gestionMulticanal=true.
- Durante la verificación hubo UN crash transitorio de `vite build` (error nativo de Node, código 2147483651); el reintento inmediato compiló bien dos veces. No parece relacionado con el código.
