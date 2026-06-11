# Implementor Log — T009 · Capa Consejos Romuald Fase 2

**Fecha**: 2026-06-11
**Resultado typecheck**: PASS (0 errores, 0 warnings)

---

## Archivos modificados

### `app/frontend/src/wizard/fields.tsx`
- Imports ampliados: `ReactNode` (type) e `Info` de lucide-react.
- Exportado nuevo componente `LabelConTip` al final del archivo. Props: `htmlFor?`, `tip`, `as?: "label"|"span"` (default "label"), `children`. Renderiza `<label>` o `<span>` con `data-tip={tip}` e `<Info size={12}/>` al final del contenido.

### `app/frontend/src/wizard/AiBlock.tsx`
- Prop opcional `tip?: string` añadida a la interfaz `Props` y al desestructurado.
- `data-tip={tip}` anclado en `<div className="ai-head">` mediante spread condicional, sin colisionar con el `data-tip` del boton `disabledExtra`.

### `app/frontend/src/wizard/Checklist.tsx`
- Imports: `Info` de lucide-react, `CONSEJOS` de `./consejos`.
- En el map: `tipRomuald = CONSEJOS[step.slug]?.checks[item.key]`.
- `data-tip` del `<label>` usa `tipRomuald ?? (esAuto ? "Se marca solo..." : undefined)`.
- `data-tip-pos="left"` en el `<label>`.
- `<Info size={12}/>` dentro de `<span className="check-text">` cuando existe `tipRomuald`.
- data-testids y logica de marcado intactos.

### `app/frontend/src/wizard/config.ts`
- `{ key: "energia-camara", texto: "Roturas de energia planificadas (cambios de intensidad)" }` insertado tras `iluminacion-verificada` en grabacion (8 items).
- `{ key: "sin-cambios-24h", texto: "Dia 1 · Sin tocar miniatura, titulo ni descripcion durante 24h" }` insertado como PRIMER item en sprint (11 items).

### `app/frontend/src/wizard/steps/StepIdea.tsx`
- Import `LabelConTip` y `CONSEJOS`.
- Labels tituloIdea, descripcionCorta y nicho → `LabelConTip` con claves `CONSEJOS.idea.campos.*`.
- Eliminado `data-tip` del `<span>` "Tipo de video".
- `data-tip` en cada radio-card TIPOS via lookup inline con clave calculada (`tipo${v.charAt(0).toUpperCase()+v.slice(1)}`).

### `app/frontend/src/wizard/steps/StepInvestigacion.tsx`
- Import `LabelConTip` y `CONSEJOS`.
- Los 3 `<span className="label">` (palabrasClave, seoPreguntas, competenciaRefs) → `LabelConTip as="span"` con claves `CONSEJOS.investigacion.campos.*`.

### `app/frontend/src/wizard/steps/StepTitulo.tsx`
- Import `LabelConTip` y `CONSEJOS`.
- Labels "Titulo final" y "Hashtag en el titulo" → `LabelConTip`.
- `data-tip={CONSEJOS.titulo.campos.palabraClave}` en el indicador verde kw.
- `tip={CONSEJOS.titulo.campos.generarIA}` en `<AiBlock tipo="titulo">`.

### `app/frontend/src/wizard/steps/StepMiniatura.tsx`
- Import `LabelConTip` y `CONSEJOS`.
- `TIP_ESTRATEGIA` (Partial Record) para los 3 chips con consejo (SEOmarco, SEOcara, SEOflecha; "otra" sin tip).
- Chips de estrategia con `data-tip` via spread condicional.
- Label "Palabras impresas" → `LabelConTip`.
- `data-tip={CONSEJOS.miniatura.checks["test-grilla-superado"]}` en `btn-simular-grilla`.

### `app/frontend/src/wizard/steps/StepGuion.tsx`
- Import `CONSEJOS`.
- Los 5 `tip:` de `CAMPOS_SEO` reemplazados por `CONSEJOS.guion.campos.*` (seoShock, seoInicio, seoLoop, seoResultado, psicoCta).
- `data-tip` del cliffhanger → `CONSEJOS.guion.campos.cliffhanger`.
- Chips de bloques (roturaPatron/seoReset/seoZoom): array extendido a 3 elementos por entrada con tipChip; seoReset/seoZoom usan `CONSEJOS.edicion.checks[...]` (decision aprobada).
- Contador Sigma: `data-tip={CONSEJOS.guion.campos.duracionEstimada}` y `cursor: "help"`.

### `app/frontend/src/wizard/steps/StepGenerico.tsx`
- Import `CONSEJOS`.
- `<p className="field-hint">{CONSEJOS.edicion.campos.tuGuionPide}</p>` tras el `<ul>` en card "Tu guion pide:".

### `app/frontend/src/wizard/steps/StepPublicacion.tsx`
- Import `LabelConTip` y `CONSEJOS`.
- Label descripcion (`f-desc`) → `LabelConTip` (con el `<span>` SEOextracto como children).
- Label comentario fijado (`f-fijado`) → `LabelConTip`.
- `<span>` hashtags descripcion → `LabelConTip as="span"`.
- Insertado `<LabelConTip as="span" tip={...timestamps}>Capitulos (timestamps)</LabelConTip>` antes de la lista de timestamps (insercion nueva — no habia label previo).
- `<span>` pantallas finales y tarjetas → `LabelConTip as="span"` con `pantallasYTarjetas` (mismo texto en ambas).
- Labels SEOhora dia (`f-dia`) y hora (`f-hora`) → `LabelConTip` con `CONSEJOS.publicacion.campos.seoHora`.

### `app/frontend/src/wizard/steps/StepSprint.tsx`
- Import `CONSEJOS`.
- `desc` del EmptyState ampliado concatenando `CONSEJOS.sprint.bannerDetalle`.
- `data-tip={CONSEJOS.sprint.campos.metricasSprint}` en `sprint-add-snapshot`.
- `data-tip={CONSEJOS.sprint.campos.emailMarketing}` en `<label className="check-row">` del email.
- `data-tip={CONSEJOS.sprint.campos.postComunidad}` en `<label className="check-row">` de comunidad.

### `app/frontend/src/wizard/steps/StepEvergreen.tsx`
- Import `CONSEJOS`.
- Banner-aviso dia 30 ampliado con `CONSEJOS.evergreen.bannerDetalle` (concatenado al texto existente).
- `data-tip={CONSEJOS.evergreen.campos.archivar}` en `btn-archivar`.
- `<p className="field-hint">{CONSEJOS.evergreen.campos.archivar}</p>` como segundo parrafo en Modal confirm-archivar.

---

## Desviaciones del plan

1. **Curly quotes en archivos fuente**: Varios archivos ya tenian comillas tipograficas Unicode (U+201C/U+201D) en contenido JSX (ej. `kw "{kwIncluida}"`). Tras los edits, estas comillas quedaron en posiciones que el parser TSX rechazaba. Se aplico script de normalizacion para reemplazarlas por comillas ASCII en todos los archivos modificados. Esto solo afecta al texto visible, no a la logica.

2. **Chips de bloques en StepGuion**: El array `as const` de pares `[clave, label]` se extendio a tripletas `[clave, label, tipChip]`. TypeScript lo infiere correctamente. data-testids usando `k.toLowerCase()` intactos.

3. **seoReset/seoZoom usan `CONSEJOS.edicion.checks[...]`**: Contraintuitivo pero correcto segun decision aprobada del orquestador. Los tooltips de estos chips de guion vienen del slug `edicion`, no de `guion`.

4. **Timestamps label es insercion nueva**: El acordeon C de StepPublicacion no tenia ninguna etiqueta antes de las filas de timestamps. Se inserto un `<LabelConTip as="span">` nuevo antes del `<div>` de filas, tal como documentaba el explorer-log.

---

## Resultado typecheck

```
npm run typecheck
> tsc --noEmit
(sin salida — 0 errores, 0 warnings)
```
