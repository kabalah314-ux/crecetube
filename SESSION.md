# Estado de Sesión

Proyecto: CRECETUBE Assistant
Última sesión: 2026-06-12
Estado general: **19/20 tareas completadas** — v1 + capa Romuald + Fase 2 + curso 63/169 (oculta vacías) + tutorial OpenRouter + viabilidad + multi-usuario con login (Google/email) + multi-canal Proyectos + recomendador IA de temas + sello Romu aprueba. TODO EN PRODUCCIÓN (crecetube.vercel.app). Solo queda T012 en curso (más tandas de vídeos del usuario).

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
Acciones SOLO del usuario:
1. **Crear su cuenta en crecetube.vercel.app/acceso y pegar su clave OpenRouter en Configuración** (el agente no introduce claves) → estrenar los 11 generadores IA (9 del wizard + Ideas + sello Romu) en vivo con el agente.
2. **T012 tandas siguientes**: más vídeos de YouTube para las 106 asignaturas pendientes (lista en `app/guia_maestra/contenido_fragmentos/_pendientes.md`; el curso las oculta hasta que se rellenen). Secciones enteras sin cubrir: s2 (Studio), s7 (sorteos), s8 (tráiler), s15 (comunidad), s16 (crossplatform), s18 (email).
3. Opcional: borrar el usuario QA de producción (qa.smoke@crecetube.test) y "Publicar app" en Google Auth Platform cuando quiera abrir el login con Google a todo el mundo (hoy: usuarios de prueba).

Credenciales/config ya en producción: Turso, SESSION_SECRET, GOOGLE_CLIENT_ID (orígenes localhost:5173 y crecetube.vercel.app).

Estado del deploy: **100% operativa** (crecetube.vercel.app, 2026-06-11). Backend con Turso conectado — `/api/plantillas` sirve las 25 plantillas con seeds, `/api/videos` operativo. BD fresh (sin usuarios aún, se crean en onboarding).

## Bloqueadores activos
Ninguno en el código. La API de producción espera credenciales Turso (acción del usuario, no bloquea el trabajo local).

---

*Este archivo lo actualiza el agente al cerrar cada sesión con `/wrap`.*
*La siguiente sesión lee SOLO este archivo para ponerse al día, sin releer `progress/`.*
