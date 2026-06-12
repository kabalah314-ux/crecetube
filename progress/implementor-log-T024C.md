# Implementor log — T024 Lote C (integración del wizard)

- **Fecha:** 2026-06-12
- **Alcance:** inserciones de FieldIA/generadores en 5 Step*.tsx + claves i18n. NO se tocó FieldIA.tsx, camposIA.ts, AiBlock.tsx, backend, Viabilidad.tsx, Onboarding.tsx, VideosList.tsx ni Dashboard.tsx.

## Archivos modificados

### `app/frontend/src/i18n/es.ts`
- 7 claves nuevas al final de la sección `fieldIA` (lote B): `sugerirIdeas`, `usarEsta`, `esqueletoBloques`, `sugerirHashtag`, `derivarCapitulos`, `derivarSinBloques`, `confirmarPisarCapitulos`.

### `app/frontend/src/wizard/steps/StepIdea.tsx` (2 cambios)
1. **FieldIA en `descripcionCorta`** (brief), modo texto, en la fila del label (div flex label+botón). `valoresActuales={[video.descripcionCorta]}` para el confirm anti-pisado; `onUsar` recorta a 500 chars (límite de validarVideo).
2. **Bloque "Sugerir ideas"** colapsable (`details.acordeon`, testid `sugerir-ideas`) bajo el campo `tituloIdea`: AiBlock `tipo="temas_canal"` con el render de tarjetas copiado del Dashboard (interfaz local `TemaSugerido`, mismas claves i18n `es.ideas.*`) + botón "Usar esta" (testid `idea-usar-${i}`) que hace `patch({ tituloIdea, descripcionCorta solo si está vacío (angulo + porQueFunciona, recortado a 500), formato: tema.formato === "short" ? "short" : "long" })`. Gating apiKey y REQUISITO_FALTANTE los resuelve AiBlock (sin tocarlo; es un uso nuevo, no se modificó ninguno existente).

### `app/frontend/src/wizard/steps/StepInvestigacion.tsx` (1 cambio)
- **FieldIA en `palabrasClave`**, modo lista, `valoresActuales={video.palabrasClave}`, `max={15}`, en la fila del label. `onUsar` = `anadirPalabraClave`: dedupe + tope 15 acumulando sobre un **ref** (`kwRef`) re-sincronizado en cada render — "Añadir todas" llama varias veces en el mismo tick y `patch` de useVideoProject no acepta updates funcionales (aviso del lote B).

### `app/frontend/src/wizard/steps/StepTitulo.tsx` (1 cambio)
- **Botón ✨ junto al label de `hashtags.titulo[0]`** (testid `field-ia-hashtag-titulo`, clases `.field-ia-wrap/.field-ia-btn` del lote B): mini-handler local `sugerirHashtagTitulo` que llama a `/api/ia/generar { tipo: "hashtags", videoProjectId }` (generador existente, NO rellenar_campo) y pone `resultados[0].titulo` en el campo con `window.confirm` si ya hay valor. Gating apiKey idéntico a AiBlock (`profile?.iaConfig.apiKey === "***"` + data-tip `es.wizard.iaNoConfigurada`). 422 REQUISITO_FALTANTE → caja `.ai-bloqueado` bajo el campo (testid `field-ia-hashtag-titulo-bloqueado`), **sin Link al paso**: el requisito (tituloFinal) está en este mismo paso. Otros errores → toast.

### `app/frontend/src/wizard/steps/StepGuion.tsx` (2 cambios)
1. **FieldIA modo texto** en los 2 campos SEO del registro que renderiza el map `CAMPOS_SEO.slice(3)` (`guion.seoResultado`, `guion.psicoCta`) y en el campo aparte `guion.cliffhanger`. Los del `slice(0,3)` (seoShock/seoInicio/seoLoop, cubiertos por AiBlock `hook`) NO se tocaron.
2. **Esqueleto de bloques**: FieldIA `campoId="guion.desarrollo"`, modo bloques, `etiqueta={es.fieldIA.esqueletoBloques}`, junto al label "Desarrollo". `onUsarBloque` = `anadirBloqueIA`: añade el bloque AL FINAL con `roturaPatron/seoReset/seoZoom: false` (forma exacta del botón "Añadir bloque" existente) vía `setBloques` (que ya recalcula `duracionTotalEstimadaSeg`), acumulando sobre ref `desarrolloRef`.

### `app/frontend/src/wizard/steps/StepPublicacion.tsx` (3 cambios)
1. **FieldIA en `comentarioFijado`**, modo texto, fila del label (acordeón A). `onUsar` → `patch({ comentarioFijado: texto || null })`.
2. **FieldIA en `listaReproduccionNombre`**, modo texto, fila del label (acordeón C).
3. **Botón "Derivar capítulos del guion"** (testid `derivar-capitulos`, sin IA, icono ListOrdered) junto a "Añadir capítulo": deriva determinista `[{tiempo:"00:00", titulo:"Introducción"}, ...bloques]` acumulando `duracionSegundos` con la `aMmss` ya existente; **la intro cuenta 60s** (misma convención que `duracionTotalEstimadaSeg = Σ bloques + 60` en StepGuion). Bloques sin título → `Bloque N`. Confirm si ya hay timestamps (`confirmarPisarCapitulos`); sin bloques de desarrollo → `toast("info", derivarSinBloques)`. Pasa por `setTimestamps` (borrador local que solo persiste sets válidos), y el resultado cumple "primer capítulo 00:00" + regex MM:SS por construcción.

## Decisiones menores
- **Fila del label**: como `.label` es `display:block`, cada inserción envuelve label+FieldIA en un `div` flex (`alignItems:center`, gap space-2), siguiendo el precedente del header "Desarrollo" de StepGuion. El popover (z-index 60) queda anclado al botón también dentro de los acordeones.
- **`onUsar={() => {}}` en el FieldIA de bloques**: la prop `onUsar` es obligatoria en el contrato del lote B aunque en modo bloques no se invoque; noop deliberado.
- **`tema.formato`**: verificado contra `types.ts` (`formato: "long"|"short"|"live"|"podcast"`) y el map `es.ideas.formato` (`video`/`short`): todo lo que no sea `"short"` se mapea a `"long"`, como fijó el orquestador.
- **Hashtag sin normalizar**: se aplica `resultados[0].titulo` tal cual, espejo exacto del botón "en título" ya existente en StepPublicacion (consistencia con el uso previo del generador).
- **Recortes preventivos** a límites de `validarVideo` solo donde la IA escribe campos con tope duro (tituloIdea 200, descripcionCorta 500) para evitar 422 del autosave.
- testids duplicados entre páginas (`ai-generate-temas_canal`, `idea-tema-${i}` en Dashboard y StepIdea): rutas distintas, sin colisión; no se renombró nada existente.

## Verificación
- `npm run build` (vite): **OK** (solo avisos preexistentes: chunk >500 kB e import dinámico de `wizard/config.ts`).
- `npm run typecheck` (tsc --noEmit): **0 errores en los archivos de este lote**. Falla globalmente con 8 errores, TODOS en `src/routes/Viabilidad.tsx` (`viabilidadPropuesta` ausente en es.ts + imports sin usar): es el **lote D en curso** (archivo en `git status` como modificado por el otro implementor; prohibido para este lote). El reviewer debe repetir el typecheck cuando el lote D cierre.
- No se hizo smoke manual del popover (opcional según el encargo; el reviewer hará la verificación funcional con el backend del lote A ya presente en el working tree).

## Desviaciones
- Ninguna respecto al encargo. Sin DUDAs bloqueantes.
