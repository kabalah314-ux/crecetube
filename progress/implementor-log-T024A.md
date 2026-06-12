# Implementor log — T024 Lote A (backend rellenar_campo)

- **Fecha:** 2026-06-12
- **Tarea delegada:** backend del generador genérico `rellenar_campo` (IA por campo del wizard + viabilidad), según §2 y "Lote A" de `progress/explorer-log.md`.

## Archivos creados
- `app/backend/src/campos.js` — registro `CAMPOS_IA` con 16 campos: 8 del wizard (`descripcionCorta`, `palabrasClave`, `guion.desarrollo`, `guion.seoResultado`, `guion.psicoCta`, `guion.cliffhanger`, `comentarioFijado`, `listaReproduccionNombre`) y 8 de viabilidad (`viabilidad.ideaCanal`, `.aQuienAyuda`, `.formatoPrevisto`, `.busquedasEncontradas`, `.canalesReferencia`, `.anguloReferencia`, `.subNicho`, `.pvu`). Cada entrada: `requisitos({video, profile, opciones})`, `instrucciones`, `contexto(video, profile, opciones) → string[]|null`, `maxTokens`, `temperatura`, `n`, `usaCorpus`. Mensajes de bloqueo en tono Romuald. `busquedasEncontradas` y `canalesReferencia` instruyen explícitamente a NO inventar resultados/canales (solo búsquedas/consultas a comprobar).
- `app/backend/tests/campos.test.mjs` — 21 tests (2 top-level + 19 subtests): requisitos por campo (unidad, vía `evaluarRequisitos("rellenar_campo")`), completitud del registro, whitelist 422 VALIDATION_ERROR (campoId desconocido y ausente), 422 REQUISITO_FALTANTE con `details[0].falta/pasoSlug`, normalizador de sugerencias (dedupe, vacíos/no-strings fuera, tope n), caso especial `guion.desarrollo` (bloques saneados, duración inválida/negativa → 120, contenido ausente → ""), guardias de tamaño (reglaCampo 50000 chars truncada a ≤1200; opciones de cliente ≤1500; claves `_*` del cliente descartadas), requisito de viabilidad sobre `opciones`, corpus solo con `usaCorpus`, degradación elegante con reintento, historial.

## Archivos modificados
- `app/backend/src/prompts.js` — añadido `GENERADORES.rellenar_campo` al final (los 12 generadores existentes intactos). `user(op)` monta: corpus (`extraerCorpusIdeacion(2000)` solo si `op._usaCorpus`) + `op._contexto` + regla Romuald (`op.reglaCampo` truncada ≤1200) + `op._instrucciones` + formato de salida (`{"sugerencias": [...]}` o, para `guion.desarrollo`, `{"bloques": [...]}`). `normalizar(p, op)` único: rama bloques si `op.campoId === "guion.desarrollo"`, rama sugerencias → `[{texto}]` en el resto.
- `app/backend/src/routes/ia.js` — bloque `if (tipo === "rellenar_campo")` ANTES de `evaluarRequisitos` (patrón temas_canal/romu_aprueba): whitelist contra `CAMPOS_IA` (422 VALIDATION_ERROR), borrado de claves `_*` enviadas por el cliente (anti prompt-injection), truncado de toda opción string (reglaCampo ≤1200, resto ≤1500), inyección de `_instrucciones`/`_contexto`/`_usaCorpus`/`_n`. `pedir()` usa `campoIA?.temperatura ?? gen.temperatura` y `campoIA?.maxTokens ?? gen.maxTokens` (los límites del campo mandan). `gen.normalizar(parsed)` → `gen.normalizar(parsed, opciones)` en las 2 llamadas (retro-compatible: los normalizadores existentes ignoran el 2º argumento). `evaluarRequisitos(tipo, { video, profile, opciones })`.
- `app/backend/src/requisitos.js` — entrada `rellenar_campo: ({video, profile, opciones}) => CAMPOS_IA[opciones?.campoId]?.requisitos?.(...) ?? null`; firma de `evaluarRequisitos` acepta `opciones` (retro-compatible); comentario de cabecera ampliado con los slugs `idea` y `viabilidad`.

## Contrato congelado — cumplido sin cambios
- Request `POST /api/ia/generar` `{ tipo: "rellenar_campo", videoProjectId: string|null, opciones: { campoId, reglaCampo?, ...contexto } }`.
- 200 `{ interactionId, resultados: [{texto}], parseFallido }`; `guion.desarrollo` → `[{titulo, contenido, duracionSegundos}]`.
- 422 `REQUISITO_FALTANTE` con `details: [{falta, pasoSlug}]`; 422 `VALIDATION_ERROR` para campoId inválido; 503 `AI_NOT_CONFIGURED` intacto (llm.js no tocado).

## Decisiones menores tomadas
1. **`viabilidad.ideaCanal` → `pasoSlug: "configuracion"`** (no "viabilidad"): lo que falta es `profile.nicho`, que se rellena en Configuración (mismo precedente que `temas_canal`). Enviar al usuario a /viabilidad no desbloquearía nada. El resto de campos `viabilidad.*` sí usan `pasoSlug: "viabilidad"` como pedía el encargo (lo que falta, `ideaCanal`, se rellena en el propio estudio).
2. **`listaReproduccionNombre` bloqueado → `falta: "palabrasClave"`, `pasoSlug: "investigacion"`**: el requisito es OR (tituloFinal O ≥1 keyword); se enlaza al desbloqueo más barato y temprano de la cadena. El mensaje menciona ambas vías.
3. **Tope `n` vía `opciones._n`**: `normalizar` no recibe el campo, así que ia.js inyecta `_n` (server-side) y pasa `opciones` como 2º argumento a `normalizar` — cambio retro-compatible verificado con la suite completa.
4. **Guardia extra no pedida pero necesaria**: el cliente podría enviar `_instrucciones`/`_contexto` en `opciones` para inyectar prompt; el bloque de ia.js borra toda clave que empiece por `_` antes de inyectar las del servidor (cubierto por test).
5. **`guion.seoResultado` bloqueado por guion → `falta: "guion.seoInicio"`**: mismo identificador que ya usa el generador `descripcion` para el caso equivalente (consistencia con el frontend existente).
6. Saneado de bloques: `titulo` obligatorio (sin título → fuera), `titulo` ≤120 chars, `contenido` ≤2000 (ausente → `""`), `duracionSegundos` acepta números o strings numéricos (`Number()` + round), inválida/≤0 → 120.

## Verificación
- `node --test app/backend/tests/` → **125 pass / 0 fail** (104 existentes + 21 nuevos). `requisitos.test.mjs` y `ia-metricas.test.mjs` pasan sin cambios.

## Dudas / pendiente para el orquestador
- Ninguna bloqueante. Solo confirmar que el frontend (Lotes B/D) maneja el `pasoSlug: "configuracion"` para `viabilidad.ideaCanal` (decisión 1) además de "viabilidad".
