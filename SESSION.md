# Estado de Sesión

Proyecto: CRECETUBE Assistant
Última sesión: 2026-06-11
Estado general: **v1 + capa Romuald + Fase 2 COMPLETAS** — 13/14 tareas; solo queda T012 (contenido del curso, en manos del usuario)

---

## Tarea actual
Ninguna en curso. T012 (rellenar contenido de las 169 asignaturas) está `pendiente` y APLAZADA por decisión del usuario ("en privado"): la redacta él externamente (NotebookLM + IA ejecutora) usando `app/guia_maestra/GUIA_CONTENIDO_CURSO.md`. Cuando entregue el seed relleno: validar IDs/estructura (20/169), recargar seeds y verificar render.

## Últimas decisiones tomadas
- Capa de consejos Romuald (T008–T011) completada, verificada con QA visual en navegador y commiteada (d449e71, f7a22c3).
- T013 PDF de plantillas: pdfkit, sanitizado WinAnsi (transcribe → ≤ ✓, omite emojis), botón .pdf en TemplateDetail.
- T014 E2E Playwright: 3 specs (onboarding, wizard, capa Romuald) en puertos propios 8002/5174 con BD temporal; `npm run test:e2e` (NO incluido en `npm test`). Proxy de vite parametrizado con BACKEND_PORT (defecto 8001).
- Vercel NO se despliega solo con el push a GitHub: hay que lanzar `npx vercel deploy --prod`.
- `improvements/002`: patrón recurrente de comillas tipográficas alteradas al escribir código (2 apariciones: T009 y T013).

## Próximo paso
Acciones SOLO del usuario (bloqueantes de lo que indican):
1. **Turso** (bloquea la API en producción): crear BD en turso.tech o instalar la integración Turso del marketplace de Vercel y configurar `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` en el proyecto Vercel (hoy NO hay ninguna env var → `FUNCTION_INVOCATION_FAILED`). Después: `npx vercel deploy --prod` (o pedirlo al agente).
2. **OpenRouter** (bloquea probar los 9 generadores IA): clave gratis en openrouter.ai → pegarla en Configuración de la app.
3. **T012**: redactar el contenido de las 169 asignaturas con la guía y entregar el JSON.

Estado del deploy: frontend en producción OK (crecetube.vercel.app, commit f7a22c3); API rota SOLO por falta de credenciales Turso (diagnóstico completo en progress/2026-06-11.md).

## Bloqueadores activos
Ninguno en el código. La API de producción espera credenciales Turso (acción del usuario, no bloquea el trabajo local).

---

*Este archivo lo actualiza el agente al cerrar cada sesión con `/wrap`.*
*La siguiente sesión lee SOLO este archivo para ponerse al día, sin releer `progress/`.*
