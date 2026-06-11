# Estado de Sesión

Proyecto: CRECETUBE Assistant
Última sesión: 2026-06-11
Estado general: **v1 + capa Romuald + Fase 2 COMPLETAS** — 13/14 tareas; solo queda T012 (contenido del curso, en manos del usuario)

---

## Tarea actual
T012 `en_progreso` — el usuario aporta vídeos de YouTube y el agente redacta. **Tandas 1+2 completadas: 63/169 asignaturas** (seed v4 en producción). Regla: en conflicto gana el vídeo MÁS NUEVO. Pipeline: `node scripts/extraer-transcripciones.mjs <ids>` → agente `redactor` por lote (fragmentos G*.json) → `scripts/fusionar-contenido-curso.mjs` (sube version; BD local y Turso recargan solas) → control de calidad (¡vigilar ortografía: G7 llegó sin tildes y hubo que corregirlo!). Quedan 106 pendientes (`_pendientes.md`); secciones enteras sin material: s7 sorteos, s8 tráiler, s15 comunidad, s16 crossplatform, s18 email. OJO: el endpoint de subtítulos de YouTube aplica rate limit tras ~20 vídeos seguidos — el extractor reintenta con backoff y si persiste hay que esperar ~35 min.

## Últimas decisiones tomadas
- Capa de consejos Romuald (T008–T011) completada, verificada con QA visual en navegador y commiteada (d449e71, f7a22c3).
- T013 PDF de plantillas: pdfkit, sanitizado WinAnsi (transcribe → ≤ ✓, omite emojis), botón .pdf en TemplateDetail.
- T014 E2E Playwright: 3 specs (onboarding, wizard, capa Romuald) en puertos propios 8002/5174 con BD temporal; `npm run test:e2e` (NO incluido en `npm test`). Proxy de vite parametrizado con BACKEND_PORT (defecto 8001).
- Vercel NO se despliega solo con el push a GitHub: hay que lanzar `npx vercel deploy --prod`.
- `improvements/002`: patrón recurrente de comillas tipográficas alteradas al escribir código (2 apariciones: T009 y T013).

## Próximo paso
Acciones SOLO del usuario (bloqueantes de lo que indican):
1. ~~**Turso**~~ ✅ HECHO (2026-06-11) — integración Vercel+Turso conectada, credenciales en env vars, redeploy OK, API operativa.
2. **OpenRouter** (bloquea probar los 9 generadores IA): clave gratis en openrouter.ai → pegarla en Configuración de la app.
3. **T012 tanda 2**: buscar vídeos de YouTube que cubran las 113 asignaturas pendientes (lista con títulos y secciones en `app/guia_maestra/contenido_fragmentos/_pendientes.md`) y pasar los links al agente. Secciones enteras sin cubrir: s7 (sorteos), s8 (tráiler), s15 (comunidad), s16 (crossplatform), s18 (email marketing).

Estado del deploy: **100% operativa** (crecetube.vercel.app, 2026-06-11). Backend con Turso conectado — `/api/plantillas` sirve las 25 plantillas con seeds, `/api/videos` operativo. BD fresh (sin usuarios aún, se crean en onboarding).

## Bloqueadores activos
Ninguno en el código. La API de producción espera credenciales Turso (acción del usuario, no bloquea el trabajo local).

---

*Este archivo lo actualiza el agente al cerrar cada sesión con `/wrap`.*
*La siguiente sesión lee SOLO este archivo para ponerse al día, sin releer `progress/`.*
