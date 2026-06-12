# Implementor Log — T019 (Recomendador IA de temas con el conocimiento recopilado)
**Fecha:** 2026-06-12
**Agente:** IMPLEMENTOR
**Verificación:** `npm test --workspace app/backend` → **76 pass / 0 fail** (eran 73; +3 subtests nuevos) · `npx tsc --noEmit -p app/frontend` limpio · `npm run build --workspace app/frontend` OK (32.9s; warning de chunk >500 kB preexistente).

## Archivos creados
- `app/backend/src/corpus.js` — `extraerCorpusIdeacion(maxChars = 4000)`. Importa `07_curso_seed.json` con `with { type: "json" }` (mismo patrón que `db.js`). Filtra secciones s3/s4/s6, solo asignaturas con `contenido` no vacío, compacta espacios, reparte presupuesto por asignatura descontando cabeceras y aplica guardia final `.slice(0, maxChars)` (jamás pasa el seed entero al LLM). Corpus real generado hoy: **3.994 caracteres** (15 asignaturas, 3 secciones). Se recalcula en cada llamada: mejora solo cuando el seed crezca.

## Archivos modificados
- `app/backend/src/prompts.js` — generador `temas_canal` en `GENERADORES` (patrón `evaluacion_nicho`: sin vídeo). `maxTokens: 1200`, `temperatura: 0.9`. El `user()` inyecta corpus + perfil (canalNombre, nicho, tieneCanalYa) + `opciones.titulosExistentes` (truncados a 2.000 chars) con orden explícita de NO repetir temas. Salida pedida: `{"temas":[{titulo, angulo, porQueFunciona, formato: video|short, dificultad: baja|media|alta}]}`. Normalizador robusto: filtra títulos vacíos/duplicados, trunca (100/160/300), defaults `formato="video"` y `dificultad="media"` ante valores inválidos, máx. 5 temas, devuelve `null` si no hay lista (→ degradación elegante del endpoint).
- `app/backend/src/routes/ia.js` — bloque `if (tipo === "temas_canal")` (junto al de `analisis_retencion`): puebla `opciones.titulosExistentes` con `tituloFinal ?? tituloIdea` de TODOS los vídeos no archivados del usuario (`WHERE userId=? AND estado != 'archivado'` — todos sus canales, sin filtro canalId) y copia `canalNombre`/`nicho`/`tieneCanalYa` del perfil a `opciones`. El historial `ai_interactions` se registra igual que el resto (videoProjectId = null).
- `app/frontend/src/wizard/AiBlock.tsx` — `videoProjectId?: string | null` (opcional) y el POST envía `videoProjectId ?? null`. Usos existentes (wizard + Viabilidad) intactos: todos pasan string.
- `app/frontend/src/routes/Dashboard.tsx` — card "Ideas para tu próximo vídeo" entre los KPIs y "Continuar donde lo dejaste": `AiBlock tipo="temas_canal"` sin videoProjectId. Render: 5 tarjetas (título en negrita, ángulo, porQueFunciona, chips `tag` de formato y dificultad). testids: `dashboard-ideas-block`, `idea-tema-{i}`. Sin clave IA el propio AiBlock degrada (botón deshabilitado + enlace a Configuración).
- `app/frontend/src/i18n/es.ts` — bloque `ideas`: etiqueta, tip, parseFallido, mapas formato/dificultad.
- `app/backend/tests/ia-metricas.test.mjs` — 3 subtests: (1) feliz: 5 temas normalizados sin videoProjectId, defaults aplicados a formato/dificultad inválidos, el prompt incluye el título del vídeo existente, historial `?tipo=temas_canal` con `videoProjectId=null`; (2) `{"temas":"esto no es una lista"}` → `parseFallido=true` con texto crudo; (3) corpus ≤4.000 chars (y ≤500 con maxChars=500), ninguna asignatura sin contenido de s3/s4/s6 aparece, alguna con contenido sí.

## Decisiones menores
1. El encargo decía "nombreCanal"; el campo real del perfil es `canalNombre` (decisión 3 del lote multi-usuario): usado el real.
2. El perfil entra al prompt por dos vías: `construirContexto(profile, null)` (que el endpoint antepone siempre) y los campos copiados a `opciones` que el `user()` del generador formatea como "PERFIL DEL CREADOR" con `tieneCanalYa` (que el contexto común no incluye). Redundancia mínima y aceptada: el encargo pedía explícitamente el perfil en el user prompt.
3. Chips con la clase `tag` existente (sin CSS nuevo); etiquetas legibles vía mapas en `es.ts` con fallback al valor crudo.
4. `formato` usa los valores del encargo del orquestador ("video"|"short"), no los del explorer-log ("long"|"short"|"live"); tampoco hay campo `tipo` (evergreen/sprint) en la salida: encargo > explorer-log.
5. `opciones.metricasResumen` (idea opcional del explorer) NO implementado: el encargo del orquestador no lo pedía.
6. El stub del test feliz captura el payload del transport (`(iaCfg, body)`) para asertar que los títulos existentes viajan en el prompt.

## Dudas
- Ninguna bloqueante.

## Para el reviewer
- Verificación en navegador pendiente (rol implementor: tests/tsc/build). Flujos a mirar: Dashboard con IA configurada (generar → 5 tarjetas con chips), sin clave IA (botón deshabilitado + enlace a Configuración), y regenerar.
