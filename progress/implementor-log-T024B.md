# Implementor log — T024 Lote B (frontend núcleo)

- **Fecha:** 2026-06-12
- **Alcance:** FieldIA.tsx + camposIA.ts + CSS + i18n. NO se tocó ningún Step*.tsx, Viabilidad.tsx, AiBlock.tsx, Onboarding.tsx ni VideosList.tsx.

## Archivos creados
- `app/frontend/src/wizard/FieldIA.tsx` — botón ✨ compacto (Sparkles 14px) + popover con 4 estados: cargando (spinner), bloqueado (REQUISITO_FALTANTE → `.ai-bloqueado` reutilizado + `enlacePaso` copiado de AiBlock, sin importarlo), error genérico (toast como AiBlock + texto `.field-ia-error` en el popover) y sugerencias por modo:
  - `texto`: lista con botón "Usar" + `window.confirm` si `valoresActuales[0]` tiene texto (patrón StepPublicacion); cierra el popover al usar.
  - `lista`: chips con `+` (disabled si duplicado contra `valoresActuales` o tope `max`) + "Añadir todas" con dedupe+tope (`Set`); llama `onUsar` una vez por elemento.
  - `bloques`: tarjetas titulo/contenido/duración con "Añadir bloque" → `onUsarBloque`; cada tarjeta se deshabilita tras añadirse ("Añadido ✓").
  - Gating sin API key: `profile?.iaConfig.apiKey === "***"` (idéntico a AiBlock); botón disabled con `data-tip` = `es.wizard.iaNoConfigurada`.
  - Cierre por click-fuera (mousedown + contains) y Escape; reabrir con bloqueo previo relanza la petición (comprobar requisitos no consume tokens).
  - testids: `field-ia-${campoId}`, `field-ia-popover`, `field-ia-sugerencia-${i}`, `field-ia-bloqueado`, `field-ia-bloqueado-ir`, `field-ia-anadir-todas`.
  - Request/response EXACTOS al contrato congelado (`tipo: "rellenar_campo"`, `opciones: { campoId, reglaCampo, ...getContexto?.() }`; `{ interactionId, resultados, parseFallido }`).
- `app/frontend/src/wizard/camposIA.ts` — registro `campoId → { regla, modo }`. 8 campos wizard + 8 `viabilidad.*`.

## Archivos modificados
- `app/frontend/src/styles/wizard.css` — clases `.field-ia-wrap/.field-ia-btn/.field-ia-popover/.field-ia-head/.field-ia-icono/.field-ia-estado/.field-ia-error/.field-ia-lista/.field-ia-sugerencia/.field-ia-bloque/.field-ia-bloque-pie/.field-ia-duracion/.field-ia-chips`, añadidas al final de la sección "Bloque IA".
- `app/frontend/src/i18n/es.ts` — bloque nuevo `fieldIA` (rellenarConIA, usarSugerencia, anadirTodas, anadirBloque, anadido, regenerar, pensando, confirmarPisar, parseFallido, sinSugerencias) tras la sección `wizard`.

## Decisiones (con motivo)
1. **CSS en `wizard.css`, NO en `components.css`** (el explorer-log decía components.css): las clases `.ai-bloqueado*` que FieldIA reutiliza están en `styles/wizard.css` (sección "Bloque IA"). Todos los CSS se importan globalmente en `main.tsx`, así que Viabilidad también las recibe. Popover con `z-index: 60` (> stepper sticky 10, > acordeón) y `box-shadow: var(--shadow-modal)` — solo tokens existentes.
2. **Origen de cada regla en camposIA.ts:**
   - `descripcionCorta` → `CONSEJOS.idea.campos.descripcionCorta`; `palabrasClave` → `investigacion.campos.palabrasClave`; `guion.seoResultado/psicoCta/cliffhanger` → `guion.campos.*`; `comentarioFijado` → `publicacion.campos.comentarioFijado` (importados, sin duplicar texto).
   - `guion.desarrollo` → `guion.banner + guion.campos.roturaPatron` concatenados (estructura "entrar a matar" + roturas), según §2 del explorer-log.
   - `listaReproduccionNombre` → `CONSEJOS.publicacion.banner`: no existe entrada `campos` propia, y la instrucción del orquestador manda usar el banner del paso en ese caso (el explorer sugería `campos.timestamps`, pero ese texto habla de capítulos, no de listas).
   - Los 8 `viabilidad.*` → reglas breves escritas a mano como espejo de los textos `TipViabilidad` de `Viabilidad.tsx` (son literales JSX no importables sin tocar ese archivo, prohibido en este lote). Comentario `// regla espejo de Viabilidad.tsx — T025 las unificará` incluido. En `busquedasEncontradas`/`canalesReferencia` la regla ordena a la IA sugerir búsquedas/consultas A COMPROBAR y no inventar resultados ni nombres de canales (anti-alucinación, §1 del explorer-log).
3. **Modo de los 8 campos de viabilidad: `"texto"`** — son textareas/inputs, no chips; el modo lista no les aplica. El lote D puede cambiar el registro si decide otra UX.
4. **`modo` viaja como prop además de estar en el registro** (así lo fija el contrato de props del orquestador); FieldIA solo lee del registro la `regla` para `opciones.reglaCampo`.
5. **Doble uso de `valoresActuales`** documentado en el JSDoc de la prop: en modo `lista` = dedupe/tope; en modo `texto` = `[valorActual]` para el confirm antes de pisar.
6. **Error genérico**: consistente con AiBlock (`toast("error", e.message)`) y además texto persistente en el popover con el botón Regenerar disponible.
7. **Tooltip**: `data-tip` en un span envolvente (los botones disabled no disparan hover, mismo truco que AiBlock); se suprime mientras el popover está abierto para que no se solape.

## Avisos para el lote C (integración)
- "Añadir todas" llama `onUsar(texto)` secuencialmente, una vez por chip: el `onUsar` del integrador debe tolerar llamadas consecutivas síncronas (usar updates funcionales o acumular sobre el valor más reciente, no sobre un closure viejo de `video`).
- En modo `texto` hay que pasar `valoresActuales={[valorActualDelCampo]}` para que funcione el confirm anti-pisado.
- `campoId` con puntos (p. ej. `guion.seoResultado`) genera testid `field-ia-guion.seoResultado` — así lo fija el contrato `field-ia-${campoId}`.

## Verificación
- `npm run typecheck` (tsc --noEmit) en `app/frontend`: **0 errores**.
- `npm run build` (vite build): **OK** (avisos preexistentes de chunk >500 kB y de import dinámico de `wizard/config.ts`, no relacionados con este lote).
- FieldIA/camposIA quedan sin consumir hasta el lote C: no hay nada observable en el preview todavía (esperado).

## Desviaciones del plan
- Ubicación del CSS (wizard.css en vez de components.css) — justificada en Decisiones #1.
- Regla de `listaReproduccionNombre` (banner en vez de campos.timestamps) — justificada en Decisiones #2.
- Sin más desviaciones. Ninguna DUDA bloqueante.
