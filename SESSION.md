# Estado de Sesión

Proyecto: CRECETUBE Assistant
Última sesión: 2026-06-10
Estado general: **v1 COMPLETA** — guía maestra (T001) + app entera (T002–T007) construidas y verificadas

---

## Tarea actual
Ninguna en curso. Las 7 tareas de TASKS.json están completadas.

## Últimas decisiones tomadas
- Stack FIJADO: React 18 + Vite + TypeScript / Express / better-sqlite3 (documental), workspaces npm en raíz, app en `app/frontend` + `app/backend`.
- IA por OpenRouter con modelo gratuito por defecto (`openrouter/free`); la app funciona 100% sin clave.
- Seeds (`05_plantillas_seed.json`, `07_curso_seed.json`) se generan con `node scripts/build_seeds.mjs` y el backend los lee directamente de `app/guia_maestra/`.
- Recortes conscientes de v1 (documentados en 08): descarga PDF de plantillas → fase 2; E2E Playwright → fase 2 (los data-testid ya están puestos según 02 §2.7); editor TipTap → fase 2 (textareas en v1).
- Verificación final: 42/42 tests backend, tsc limpio, build OK, init.sh "Proyecto listo", smoke OK.

## Próximo paso
HECHO ADEMÁS: QA visual en navegador (onboarding→dashboard→wizard→curso→plantillas→tema), 2 bugs encontrados y arreglados (stepper móvil bajo topbar; future flags React Router). Detalle en progress/2026-06-10.md. La BD real tiene datos de prueba del QA (borrar `app/backend/data/crecetube.db` con la app parada para estrenar de cero).

Sugeridos (a elegir por el usuario):
1. Rellenar el contenido didáctico de las 169 asignaturas (la app ya lo renderiza; IDs en 07).
2. Probar los generadores IA con una clave real de OpenRouter (gratis en openrouter.ai).
3. Fase 2: Playwright sobre los data-testid + PDF de plantillas.

## Bloqueadores activos
Ninguno.

---

*Este archivo lo actualiza el agente al cerrar cada sesión con `/wrap`.*
*La siguiente sesión lee SOLO este archivo para ponerse al día, sin releer `progress/`.*
