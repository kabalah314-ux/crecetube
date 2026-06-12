# Implementor Log — T020 (Sello "Romu aprueba": evaluación IA por etapa del wizard)
**Fecha:** 2026-06-12
**Agente:** IMPLEMENTOR
**Verificación:** `npm test --workspace app/backend` → **78 pass / 0 fail** (eran 76; +2 subtests nuevos) · `npx tsc --noEmit -p app/frontend` limpio · `npm run build --workspace app/frontend` OK (16.9s; warning de chunk >500 kB preexistente).

## Archivos creados
- `app/frontend/src/wizard/RomuAprueba.tsx` — componente con UN punto de integración (patrón TipBanner). Construye `datosEtapa` (mapa slug→campos del VideoProject, ver abajo) + `checklist` (texto/hecha de cada item vía `stepBySlug`/`isItemDone` de config.ts, cubre checks manuales y automáticos) y `reglas` (banner + bannerDetalle + valores de campos y checks de `CONSEJOS[slug]`). Monta `AiBlock tipo="romu_aprueba"` con `videoProjectId=video.id` y etiqueta de es.ts. Render: sello verde (`romu-sello-ok`, "ROMU APRUEBA" + puntuación/10) o ámbar (`romu-sello-ajustar`, "Romu dice: ajusta esto") + lista de puntos (✓ mint / ✗ rust con comentario) + resumen en cursiva. Campos largos recortados client-side con `corta()` para que la guardia del backend no se coma campos posteriores. testids: `romu-aprueba-block`, `romu-aprueba-veredicto` (con `data-veredicto`), `romu-punto-{i}`. Devuelve `null` en `grabacion` y `edicion` (StepGenerico: sin datos evaluables) → no se monta ahí.

## Archivos modificados
- `app/backend/src/prompts.js` — generador `romu_aprueba` en `GENERADORES` (maxTokens 1000, temperatura 0.5). User prompt: etapaNombre + etapaProposito + nicho + datosEtapa (JSON serializado por ia.js) + reglas, con orden de evaluar crítico-constructivo, sin consejo genérico, con consecuencia si se viola el método, 3-6 puntos. Salida `{veredicto: aprobado|ajustar, puntuacion: 1-10, puntos: [{aspecto, ok, comentario}], resumen}`. Normalizador: veredicto inválido → deducido de los puntos (algún no-ok → "ajustar"); si ni veredicto válido ni puntos → `null` (degradación elegante); puntuación fuera de rango/no numérica → 5, redondeada; máx 6 puntos; truncados aspecto 80 / comentario 300 / resumen 300; `ok: x.ok === true`.
- `app/backend/src/routes/ia.js` — bloque `if (tipo === "romu_aprueba")` antes de `construirContexto`: serializa `opciones.datosEtapa` (JSON.stringify indent 1) y une `opciones.reglas` en lista "- …", ambos recortados a `MAX_EVAL_CHARS = 6000` (filosofía maxChars de corpus.js); etapaNombre ≤80, etapaProposito ≤300; copia `nicho` del perfil. El videoProjectId llega del frontend y el flujo genérico ya lo guarda en `ai_interactions` (sin cambios ahí).
- `app/frontend/src/routes/VideoWizard.tsx` — import + `<RomuAprueba slug={step.slug} video={video} />` entre `<Checklist>` y `.wizard-nav`. TipBanner y testids existentes intactos.
- `app/frontend/src/styles/wizard.css` — bloque `.romu-aprueba` / `.romu-sello*` / `.romu-puntos` / `.romu-resumen` con tokens existentes (`--accent-mint` ok, `--accent-gold` ámbar, `--accent-rust` para las ✗; patrón color-mix de `.banner-aviso`). No existen tokens `--ok`/`--warning` en tokens.css: usados los acentos.
- `app/frontend/src/i18n/es.ts` — bloque `romu`: etiqueta "¿Romu aprueba esta etapa?", tip, "ROMU APRUEBA", "Romu dice: ajusta esto", parseFallido y mapa `proposito` (slug→propósito de la etapa que viaja en el prompt).
- `app/backend/tests/ia-metricas.test.mjs` — 2 subtests: (1) feliz: veredicto normalizado, 8.6→9, 8 puntos→6, resumen presente, prompt incluye dato y regla, guardia: relleno de 20k chars en datosEtapa y en reglas NO viaja entero (`!includes(x.repeat(7000))`), historial `?tipo=romu_aprueba` con `videoProjectId=video.id`; (2) `{"veredicto":"ni idea","puntos":"sin lista"}` → `parseFallido=true` con texto crudo.

## Mapa etapa→campos (datosEtapa)
- `idea` → tituloIdea, tipo, formato, brief (descripcionCorta≤600), nicho
- `investigacion` → palabrasClave, seoPreguntas, competencia (url + notas≤200)
- `titulo` → tituloFinal, longitudTituloFinal, titulosAlternativos, palabrasClave, hashtagsEnTitulo
- `miniatura` → estrategia, palabrasMiniatura, brief (briefIA≤800), miniaturaSubida (bool), variantesAB (n)
- `guion` → seoShock/seoInicio/seoLoop/seoResultado/psicoCta (≤500), cliffhanger (≤300), bloquesDesarrollo (titulo+duración+flags, sin contenido), duracionTotalEstimadaSeg
- `publicacion` → descripcion (≤1200), hashtagsDescripcion, timestamps, listaReproduccion, comentarioFijado (≤400), pantallasFinales (tipos), numTarjetas, seoHora
- `sprint` → difusion (emailEnviado, postComunidad enviado/tipo, redesCompartido)
- `evergreen` → snapshotsRegistrados (metricasIds.length)
- TODAS las montadas añaden `checklist: [{tarea, hecha}]` de la etapa
- `grabacion`/`edicion` → null (no se monta)

## Decisiones menores
1. Montado DESPUÉS de la Checklist (no justo bajo CuerpoEtapa): el sello evalúa la etapa completa incluida la checklist y actúa de "puerta" antes de Siguiente. El encargo permitía "donde encaje mejor".
2. La checklist (manual + auto) entra en datosEtapa de todas las etapas montadas: da señal evaluable a la IA en sprint/evergreen (mayoría de checks manuales) y los objetivos del método en el resto.
3. El contexto común `construirContexto(profile, video)` ya antepone canal/nicho/vídeo al prompt; aun así `nicho` viaja también en el user del generador porque el encargo lo pedía explícito (misma redundancia aceptada que en temas_canal, decisión 2 de T019).
4. `etapaProposito` vive en `es.romu.proposito` (convención strings en es.ts) y lo envía el frontend; el backend lo recorta a 300.
5. parseFallido en el render: mensaje corto (patrón Dashboard/Viabilidad), no el texto crudo (patrón StepTitulo), porque un veredicto a medias confunde más que ayuda.
6. Sin token `--ok`/`--warning` en tokens.css: usados `--accent-mint`/`--accent-gold`/`--accent-rust` (acentos existentes, opción contemplada en el encargo).

## Dudas
- Ninguna bloqueante.

## Para el reviewer
- Verificación en navegador pendiente (rol implementor: tests/tsc/build). Flujos a mirar: wizard etapa Título con IA configurada (Generar → sello verde/ámbar con puntos), etapa Grabación/Edición (el bloque NO aparece), sin clave IA (degradación de AiBlock), y que TipBanner/Checklist/wizard-nav siguen intactos.
