# 08 · ROADMAP DE IMPLEMENTACIÓN + CRITERIOS DE ACEPTACIÓN + TESTS

> **Para la IA constructora**: orden de construcción en 6 sprints (= tareas T002–T007 de `TASKS.json`). No avances de sprint sin cumplir sus criterios de aceptación. El stack está FIJADO (no elegir otro): ver 8.1.

---

## 8.1 STACK Y LAYOUT DEFINITIVOS

| Capa | Elección | Versión mínima |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Node 20 |
| Estado | Zustand | — |
| Routing | react-router-dom v6+ | — |
| Estilos | CSS plano con tokens de `06_DISENO_UI.md` (variables CSS) — sin Tailwind, sin MUI | — |
| Iconos | lucide-react | — |
| Gráficas | Recharts | — |
| Fuentes | @fontsource (Fraunces display, Manrope body, JetBrains Mono) | — |
| Backend | Node 20 + Express | — |
| BD | SQLite vía better-sqlite3, estilo documental: tablas con columna `data` JSON + columnas indexables extraídas | — |
| IA | fetch nativo contra OpenRouter (04) | — |

**Layout del repo** (la guía vive junto a la app):

```
Crecetube/
├── package.json            # workspaces: app/backend, app/frontend · scripts dev/test
├── scripts/init.sh
├── app/
│   ├── guia_maestra/       # este kit (+ seeds JSON = fuente de verdad)
│   ├── backend/
│   │   ├── package.json
│   │   ├── src/ (server.js, db.js, llm.js, routes/*.js)
│   │   └── tests/*.test.mjs
│   └── frontend/
│       ├── package.json
│       └── src/ (routes/, components/, store/, services/, styles/, i18n/)
└── progress/ …             # harness
```

- El backend lee los seeds DIRECTAMENTE de `app/guia_maestra/*.json` (sin copias que se desincronicen).
- Comandos raíz: `npm install` (instala los 2 workspaces), `npm run dev` (backend :8001 + frontend :5173 a la vez), `npm test` (tests backend + typecheck/build frontend).
- Puertos: backend `8001`, frontend dev `5173` con proxy `/api` → `8001` (sin CORS en dev).

---

## 8.2 ESTRATEGIA DE TESTS

| Nivel | Herramienta | Qué cubre | Cuándo corre |
|---|---|---|---|
| API backend | `node --test` + `fetch` contra servidor efímero con BD temporal | contratos de 03: CRUD, validaciones, códigos de error, seeds | `npm test` e `init.sh` |
| Tipos/build frontend | `tsc --noEmit` + `vite build` | que todo compila y enlaza | `npm test` e `init.sh` |
| E2E navegador | Playwright sobre los `data-testid` de 02 §2.7 | flujos onboarding y wizard | **fase 2** (no instalar en v1; los testids ya quedan listos) |
| Manual por sprint | checklist de criterios de aceptación | UX real | al cerrar cada sprint |

Reglas:
1. Cada endpoint nuevo llega con al menos 1 test feliz + 1 de error.
2. Los tests usan una BD SQLite en fichero temporal (variable `DB_PATH`), nunca la real.
3. Ningún test depende de red externa: el cliente LLM se prueba sin clave (error `AI_NOT_CONFIGURED`) y el resto con un stub inyectable.

---

## 8.3 SPRINT 1 — FUNDACIÓN + ONBOARDING (T002)

**Alcance**: monorepo workspaces; backend con BD, seeds y perfil; frontend con tokens, layout, rutas y onboarding completo.

Backend:
- `db.js`: apertura SQLite (`DB_PATH`, defecto `app/backend/data/crecetube.db`), creación de tablas (`profile`, `videos`, `course_progress`, `templates`, `ai_interactions`, `metric_snapshots`, `deleted_videos`, `meta`), carga de seeds con versionado (03 §3.3.5: si `version` del seed > versión cargada → merge no destructivo).
- Endpoints: `GET /api/health`, `GET|POST|PATCH /api/profile`, `GET /api/profile/ia-status` (03 §3.2.1) con enmascarado de `apiKey`.
- Manejo de errores global con formato `{ error, code, details? }`.

Frontend:
- `styles/tokens.css` = 06 §6.2–6.6 literal (ambos temas vía `[data-theme]`); fuentes @fontsource; `components.css` con clases base (botón, input, card, modal, toast, tag, empty state).
- Router completo con las 14 rutas de 01 §1.5 (las no implementadas muestran placeholder "En construcción" SIN romper).
- Sidebar desktop + drawer móvil; tema oscuro defecto + toggle persistido en `preferenciasUi.tema`.
- Onboarding de 9 pasos según 02 §2.2 (borrador en localStorage, validaciones, redirect).

**Criterios de aceptación**:
- [ ] `npm install && npm run dev` levanta ambos servicios sin errores.
- [ ] Sin perfil, cualquier ruta redirige a `/onboarding`; con perfil, `/onboarding` redirige a `/dashboard`.
- [ ] Completar onboarding crea el perfil (verificable vía `GET /api/profile`) y aterriza en dashboard con toast.
- [ ] Recargar a mitad de onboarding conserva paso y respuestas.
- [ ] El toggle de tema cambia tokens al vuelo y sobrevive recarga.
- [ ] `GET /api/profile` devuelve `apiKey: "***"` cuando existe.
- [ ] `npm test` verde (tests de perfil) e `init.sh` sin errores.

---

## 8.4 SPRINT 2 — WIZARD CORE: ETAPAS 1–5 (T003)

**Alcance**: CRUD de vídeos, wizard con stepper/autosave/checklists, etapas `idea`→`guion`.

Backend: `GET|POST /api/videos` (filtros `estado`, `tipo`, `q`), `GET|PATCH|DELETE /api/videos/:id` (PATCH = merge parcial profundo), `PATCH /api/videos/:id/estado` (validando transiciones de 01 §1.6: avanzar libre, retroceder solo manual, `INVALID_STATE_TRANSITION` si el estado no existe), `PATCH /api/videos/:id/checklist`, `POST /api/videos/:id/duplicar`.

Frontend: `/videos` con cards (06 §6.7.3) + filtros; `/videos/nuevo` con creación perezosa (02 §2.4.1); layout wizard completo (stepper clicable, panel contextual con datos estáticos por ahora, indicador autosave con reintentos); etapas 1–5 con todos sus campos, checklists auto/manual (02 §2.4.1–2.4.5) y bloque IA en modo "sin configurar" (disabled+tooltip).

**Criterios de aceptación**:
- [ ] Escribir el primer carácter del título en `/videos/nuevo` crea el proyecto y la URL pasa a `/videos/:id/wizard/idea`.
- [ ] Editar un campo y esperar ~1s muestra "Guardado ✓"; recargar conserva el dato.
- [ ] Items auto se marcan/desmarcan solos al cumplir criterio; los manuales persisten tras recarga.
- [ ] El estado del proyecto avanza al entrar en etapas posteriores y NUNCA retrocede solo.
- [ ] Drag&drop reordena bloques del guion y persiste.
- [ ] Tests: CRUD vídeos, merge parcial, checklist, transiciones de estado, duplicar.

---

## 8.5 SPRINT 3 — WIZARD COMPLETO + DASHBOARD (T004)

**Alcance**: etapas 6–10, publicación con confetti, dashboard, detalle de vídeo.

- Etapas 6–7 (checklists manuales + recordatorios derivados del guion), etapa 8 en acordeón con TODAS las validaciones (timestamps `00:00`, tarjetas: máx 5 / no primer minuto / distancia 2 min, hashtags formato), botón "Marcar como PUBLICADO" con requisitos + modal fecha + confetti + salto a etapa 9.
- Etapa 9 con cabecera "Día N", agrupación por días y campos `difusion.*`; etapa 10 con banner de 30 días y checklist evergreen. Reanudación inteligente (02 §2.3.5).
- `/dashboard`: saludo, KPIs (proyectos activos, publicados últimos 30 días, % medio de checklist), lista "Continuar donde lo dejaste" (3 proyectos más recientes), accesos rápidos.
- `/videos/:id`: resumen, select de estado manual, duplicar, eliminar (soft delete + toast Deshacer 5s), archivar.

**Criterios de aceptación**:
- [ ] Imposible marcar publicado sin título final + miniatura + check "vídeo subido" (tooltip explica qué falta).
- [ ] Publicar registra `publishedAt`, lanza confetti y aterriza en sprint con "Día 1".
- [ ] Un timestamp inicial ≠ `00:00` muestra el banner de error y desmarca el item auto.
- [ ] Tarjeta en segundo 30 o a <2 min de otra → error inline, no se guarda en estado inválido.
- [ ] Eliminar → desaparece de la lista; "Deshacer" lo restaura intacto.
- [ ] Tests: soft delete/restore, reglas de publicación, validación de tarjetas y timestamps (backend).

---

## 8.6 SPRINT 4 — CURSO + PLANTILLAS (T005)

**Alcance**: curso navegable con progreso y biblioteca de plantillas operativa.

Backend: `GET /api/curso/estructura` (desde seed en BD), `GET /api/curso/progreso`, `PATCH /api/curso/progreso/:asignaturaId` (upsert); `GET|POST /api/plantillas`, `GET|PATCH|DELETE /api/plantillas/:id` (`TEMPLATE_NOT_EDITABLE` si precargada), `POST /api/plantillas/:id/aplicar`, `GET /api/plantillas/:id/descargar?formato=md|txt` (PDF → 422 con mensaje "disponible en fase 2"; documentado aquí como recorte consciente de v1).

Frontend: `/curso` (20 secciones con color de familia, % y anillo de progreso), `/curso/:sId` (asignaturas con check, duración, plantilla relacionada), `/curso/:sId/:aId` (placeholder regla de oro #1, toggle completado, nota personal autosave, "vincular a vídeo"); `/plantillas` (filtro por tipo, badge sección), `/plantillas/:id` (form de variables → preview en vivo → Copiar / Descargar / Duplicar editable). Panel contextual del wizard pasa a datos reales (enlaces curso + "Usar en este vídeo").

**Criterios de aceptación**:
- [ ] Las 20 secciones y 169 asignaturas se renderizan desde la BD (no hardcode en frontend).
- [ ] Marcar asignatura actualiza el % de su sección y el global inmediatamente.
- [ ] Aplicar variables resuelve `{placeholders}` y los no rellenados quedan visibles como `{nombre}`.
- [ ] Editar plantilla precargada → 403 `TEMPLATE_NOT_EDITABLE`; duplicarla crea copia editable.
- [ ] Descarga `.md` y `.txt` con el contenido resuelto.
- [ ] Tests: progreso upsert, aplicar variables, protección de precargadas, estructura completa (20/169/25).

---

## 8.7 SPRINT 5 — MÓDULO IA + MÉTRICAS (T006)

**Alcance**: 04 completo + panel de métricas.

Backend: `llm.js` (cliente 4.3 con inyección de transporte para tests), constructores de prompts de los 9 generadores (4.6 literal), `POST /api/ia/generar`, `POST /api/ia/test-conexion`, `GET /api/ia/historial`, registro `AIInteraction` (4.7); `GET /api/metricas/resumen`, `GET /api/metricas/insights` (heurísticas locales: mejor/peor CTR, tendencia velocidad; sin IA), CRUD snapshots con unicidad (`videoProjectId`,`fecha`) → `DUPLICATE_SNAPSHOT`.

Frontend: `/configuracion` sección IA (proveedor, modelo con los slugs de 4.2.2, clave, temperatura, probar conexión, aviso privacidad); componente `AiBlock` real en etapas 2/3/4/5/8/9/10 con cards de resultado y aplicación a campos; `/metricas` (KPIs agregados, gráfica Recharts de evolución por vídeo, tabla de snapshots con alta/edición/borrado, insights).

**Criterios de aceptación**:
- [ ] Sin clave: botones disabled con tooltip; `POST /api/ia/generar` → 503 `AI_NOT_CONFIGURADO`… (código exacto: `AI_NOT_CONFIGURED`).
- [ ] Con clave inválida: test-conexión muestra ✗ y mensaje; nada se rompe.
- [ ] Respuesta no-JSON simulada (stub) → flujo de fallback termina en card de texto bruto.
- [ ] Aplicar un resultado IA rellena el campo correcto y registra `seleccionUsuario`.
- [ ] Snapshot duplicado (mismo vídeo+fecha) → 409 y mensaje claro.
- [ ] Tests: generar sin clave, fallback parseo con stub, historial, unicidad snapshot, resumen agregado.

---

## 8.8 SPRINT 6 — PULIDO + EXPORT/IMPORT + CIERRE (T007)

**Alcance**: lo que convierte "funciona" en "terminado".

- `GET /api/export` (estado completo con `version`) y `POST /api/import` (`replaceAll` o merge; `IMPORT_VERSION_MISMATCH`).
- Accesibilidad (06 §6.11): focus ring, skip-link, `aria-live` en autosave/toasts, labels, navegación teclado en wizard y modales, `prefers-reduced-motion`.
- Microinteracciones restantes (06 §6.8) + confetti definitivo + empty states ilustrados.
- `README.md` de la app: requisitos, arranque, configuración IA, backup.
- Verificación final: TODOS los criterios 8.3–8.7 repasados + checklist 8.9.

**Criterios de aceptación**:
- [ ] Export descarga un JSON que, importado con `replaceAll` en BD vacía, reproduce el estado (test de ida y vuelta).
- [ ] Import con versión incompatible → 422 explicado en UI.
- [ ] Tab-only: se puede completar el onboarding y navegar el wizard sin ratón.
- [ ] `prefers-reduced-motion` desactiva animaciones (visual).
- [ ] `npm test` e `init.sh` completamente verdes.

---

## 8.9 CHECKLIST FINAL "LISTO PARA ENTREGAR" (la que cita `00_INDICE_MAESTRO.md`)

- [ ] Reglas de oro 1–10 del índice maestro verificadas una a una.
- [ ] Las 14 rutas de 01 §1.5 navegables sin error de consola.
- [ ] Wizard completo: crear → publicar → sprint → evergreen con datos reales de prueba.
- [ ] Curso: 20/169 desde BD, placeholder en asignaturas vacías.
- [ ] Plantillas: 25 precargadas, aplicar/copiar/descargar/duplicar.
- [ ] IA: apagada por defecto, encendida con clave, errores elegantes.
- [ ] Métricas: snapshots + gráfica + insights.
- [ ] Export/import de ida y vuelta sin pérdida.
- [ ] `data-testid` en todos los interactivos según 02 §2.7.
- [ ] Sin emojis decorativos en UI, sin Inter, sin morados (06 §6.14).
- [ ] `npm test` + `init.sh` verdes en máquina limpia.
