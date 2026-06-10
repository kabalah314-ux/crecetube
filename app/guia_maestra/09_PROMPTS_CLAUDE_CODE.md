# 09 · PROMPTS LISTOS PARA CLAUDE CODE (POR SPRINT)

> **Para el humano**: si delegas la construcción en Claude Code (u otra IA), pega estos prompts UNO POR SPRINT en una sesión nueva cada vez. Cada prompt es autosuficiente: dice qué leer, qué construir y cómo verificar. No pegues dos sprints a la vez.
>
> Requisito previo: la guía maestra completa en `app/guia_maestra/` (archivos 00–09 + 2 seeds JSON).

---

## PROMPT 0 — ARRANQUE DE SESIÓN (pegar siempre primero)

```text
Trabaja en este repo siguiendo el harness (CLAUDE.md): lee SESSION.md, ejecuta scripts/init.sh
y consulta el resumen de TASKS.json. La especificación del producto está en app/guia_maestra/
(leer 00_INDICE_MAESTRO.md primero; el stack está FIJADO en 08 §8.1: React+Vite+TS / Express /
better-sqlite3, workspaces npm en la raíz). No inventes campos ni rutas: todo está en 02 y 03.
Idioma de la UI: español. Antes de cerrar, deja TASKS.json y progress/ actualizados.
```

## PROMPT SPRINT 1 (T002)

```text
Ejecuta la tarea T002 (Sprint 1 — Fundación y Onboarding) según app/guia_maestra/08_ROADMAP_Y_TESTS.md §8.3.
Lee antes: 01 (rutas y arquitectura), 02 §2.1-2.2 (arranque y onboarding), 03 §3.1.1 y §3.2.1
(UserProfile y su API), 06 (tokens CSS COMPLETOS, §6.2-6.6 van literales a styles/tokens.css).
Construye: monorepo workspaces + backend (db.js con seeds desde app/guia_maestra/*.json,
/api/health y /api/profile) + frontend (tokens, fuentes @fontsource Fraunces/Manrope/JetBrains,
sidebar, 14 rutas con placeholders, tema dark/light, onboarding 9 pasos con borrador localStorage).
Termina cuando TODOS los criterios de §8.3 estén verdes, npm test pase e init.sh no dé errores.
```

## PROMPT SPRINT 2 (T003)

```text
Ejecuta T003 (Sprint 2 — Wizard Core) según 08 §8.4. Lee antes: 02 §2.3 (principios del wizard:
autosave 800ms, checklists auto/manual, mapeo etapa↔estado, reanudación) y §2.4 etapas 1-5;
03 §3.1.2 y §3.2.2 (VideoProject y su API). Construye los endpoints de vídeos (PATCH = merge
parcial profundo; transiciones de estado validadas), /videos con filtros, /videos/nuevo con
creación perezosa, layout del wizard (stepper + panel contextual + indicador autosave) y las
etapas idea, investigacion, titulo, miniatura y guion con sus checklists EXACTOS (itemKeys de 02).
Bloque IA solo en modo deshabilitado (tooltip). Criterios §8.4 + tests backend.
```

## PROMPT SPRINT 3 (T004)

```text
Ejecuta T004 (Sprint 3 — Wizard completo + Dashboard) según 08 §8.5. Lee antes: 02 §2.4 etapas
6-10 (acordeón de publicación con validaciones duras: timestamps 00:00, tarjetas máx 5/regla
2min/no primer minuto; botón Marcar como PUBLICADO con requisitos y confetti; sprint con días;
evergreen con banner 30 días) y §2.5-2.6 (flujos secundarios y edge cases). Construye también
/dashboard (KPIs + continuar) y /videos/:id (estado manual, duplicar, soft delete con Deshacer).
Criterios §8.5 + tests.
```

## PROMPT SPRINT 4 (T005)

```text
Ejecuta T005 (Sprint 4 — Curso + Plantillas) según 08 §8.6. Lee antes: 07_ESQUELETO_CURSO.md
(IDs inmutables y placeholder obligatorio), 05_PLANTILLAS.md §5.14 (formatos de descarga),
03 §3.1.3-3.1.4 y §3.2.3-3.2.4. Los datos salen de los seeds 07_curso_seed.json y
05_plantillas_seed.json YA cargados en BD (no hardcodear en frontend). Construye las 3 vistas
del curso con progreso, la biblioteca de plantillas con resolución de {variables}, copiar,
descarga md/txt y duplicado editable, y conecta el panel contextual del wizard a datos reales.
Criterios §8.6 + tests (incluye verificación 20 secciones/169 asignaturas/25 plantillas).
```

## PROMPT SPRINT 5 (T006)

```text
Ejecuta T006 (Sprint 5 — IA + Métricas) según 08 §8.7. Lee antes: 04_MODULO_IA.md ENTERO
(los prompts de los 9 generadores van LITERALES al backend; cliente HTTP §4.3; errores y
fallback de parseo §4.5; defaults §4.2 con modelo openrouter/free) y 03 §3.1.5-3.1.6,
§3.2.5-3.2.6. El cliente LLM debe aceptar un transporte inyectable para testearlo con stub.
Construye también /configuracion (sección IA con test de conexión y aviso de privacidad),
el componente AiBlock en las etapas 2/3/4/5/8/9/10 y /metricas (KPIs, gráfica Recharts,
snapshots CRUD con unicidad por fecha, insights heurísticos). Criterios §8.7 + tests.
```

## PROMPT SPRINT 6 (T007)

```text
Ejecuta T007 (Sprint 6 — Pulido y cierre) según 08 §8.8. Construye export/import JSON
(replaceAll/merge, IMPORT_VERSION_MISMATCH), pasada completa de accesibilidad (06 §6.11),
microinteracciones restantes (06 §6.8 con prefers-reduced-motion), empty states, README de
arranque. Después ejecuta la checklist final 08 §8.9 punto por punto y deja constancia en
progress/ de cada verificación. Solo entonces marca T007 completada y cierra con /wrap.
```

---

## NOTAS DE USO

1. **Una sesión por sprint**: el contexto se mantiene pequeño y el agente relee solo lo necesario.
2. Si un sprint se queda a medias, el siguiente prompt debe empezar por: *"Continúa T00X; revisa progress/ y el estado real del código antes de tocar nada."*
3. Si la IA propone cambiar el stack o añadir dependencias fuera de 08 §8.1 → rechazar y recordarle el prompt 0.
4. Los criterios de aceptación de 08 son la definición de "hecho": no aceptar un sprint "casi".
