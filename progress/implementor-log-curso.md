# Implementor Log — T012: ocultar asignaturas del curso sin contenido (solo frontend)

Fecha: 2026-06-12

## Qué se hizo

Filtro de visibilidad del curso en frontend: las asignaturas con `contenido === ""` se ocultan en todas las vistas, y las secciones que quedan sin asignaturas visibles desaparecen. Sin tocar datos (backend/seed intactos): cuando se rellene el contenido, reaparecen solas. Contadores, porcentajes y navegación prev/next operan solo sobre lo visible (63 asignaturas hoy, no 169).

## Archivos creados

- `app/frontend/src/lib/cursoVisible.ts` — helper único `filtrarCursoVisible(curso: CourseStructure): CourseStructure`. Filtra asignaturas vacías, elimina secciones sin asignaturas visibles y recalcula `totalSecciones` y `totalAsignaturas`. Tipado con los types existentes de `src/types.ts`.

## Archivos modificados

- `app/frontend/src/routes/CourseIndex.tsx` — aplica `filtrarCursoVisible` al recibir la estructura. El porcentaje global y los contadores por sección pasan a calcularse sobre visibles. Además, `totalHechas` ahora cuenta solo completadas que sigan visibles (antes contaba todo el progreso, lo que podría dar >100% con asignaturas completadas y luego ocultas). Guard contra división por cero si todo estuviera vacío.
- `app/frontend/src/routes/CourseSection.tsx` — busca la sección dentro de la estructura filtrada. Si la sección quedó vacía (oculta), cae en el redirect existente a `/curso`. Lista y contador `hechas/total` solo sobre visibles.
- `app/frontend/src/routes/CourseLesson.tsx` — busca sección y asignatura en la estructura filtrada. URL directa a una clase oculta → redirect existente a `/curso` (comportamiento aceptado por el orquestador). prev/next navegan solo entre clases visibles. El placeholder `lesson-placeholder` NO se tocó (red de seguridad).

## Verificación

- `npx tsc --noEmit` (app/frontend): sin errores.
- `npm run build --workspace app/frontend`: build OK (warnings preexistentes de chunk >500 kB y de import dinámico/estático de `wizard/config.ts`, no relacionados con este cambio).
- No se ejecutaron E2E (instrucción explícita).

## Decisiones menores

- El filtro se aplica en el punto de fetch de cada vista (las tres únicas consumidoras de `GET /api/curso/estructura` según grep), no en `services/api`, para no alterar el contrato del cliente HTTP.
- Criterio de visibilidad exacto según la delegación: `contenido !== ""` (sin trim).
- Dashboard NO consume la estructura del curso (su progreso sale de los VideoProject), así que no se tocó.

## DUDA (no bloqueante, para el orquestador)

- `app/frontend/src/routes/Dashboard.tsx` línea ~174 tiene copy hardcodeado: "20 secciones y 169 clases del método...". No es un contador derivado de la estructura, pero ahora contradice lo que ve el usuario (63 clases visibles). No se modificó por estar fuera del alcance delegado. Decidir si se actualiza el texto (p. ej. quitar las cifras).
