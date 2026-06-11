# Reviewer Log — T009 · Capa Consejos Romuald Fase 2

**Fecha**: 2026-06-11
**Veredicto**: **APROBADO CON ARREGLOS**

---

## Resumen

La implementación de los tooltips de campos y checklist es correcta y completa: los 13
archivos frontend esperados están modificados con el cableado bien hecho hacia `consejos.ts`,
sin tocar lógica, sin romper data-testids y sin textos de consejo hardcodeados. **Pero el
implementor degradó la tipografía de 4 textos visibles de UI** (comillas tipográficas `“”`
→ comillas rectas `""`) con una justificación falsa. Lo he restaurado. Tras el arreglo, todo
verde: 42/42 backend, tsc, build.

---

## Verificaciones realizadas

### 1. Huella (`git diff --stat`)
13 archivos frontend esperados: ✓ todos presentes (fields.tsx, AiBlock.tsx, Checklist.tsx,
config.ts + 9 Step*.tsx).

Archivos "extra" investigados (NO son de T009 ni espurios):
- `app/frontend/src/routes/VideoWizard.tsx` (+3) y `app/frontend/src/styles/wizard.css` (+91):
  son trabajo de **Fase 1 (T008)** (import + render de `<TipBanner>` y su CSS `.tip-banner`) que
  quedó sin commitear en el árbol de trabajo. El explorer-log los listaba como "ya existentes". Es
  el estado base que heredó el implementor, no parte de T009. Dejados como están.
- `app/frontend/src/styles/components.css` (+8): SÍ es de T009 y está justificado — añade la
  regla `[data-tip][data-tip-pos="left"]` que usa Checklist.tsx y sube `max-width` de tooltip a
  360px para los consejos de 2-4 frases. Correcto.
- `TASKS.json`, `scripts/init.sh` (+1, strip CRLF): ficheros del orquestador/harness, excluidos
  del alcance. Benignos.

### 2. Auditoría del diff archivo por archivo (`git diff app/frontend/`)
- **fields.tsx**: `LabelConTip` con prop `as: "label"|"span"`, icono `<Info size={12}/>` lucide. ✓
- **AiBlock.tsx**: prop `tip?` anclada en `<div className="ai-head">` vía spread condicional;
  sin colisión con el `data-tip` del botón `disabledExtra`. ✓
- **Checklist.tsx**: `tipRomuald = CONSEJOS[step.slug]?.checks[item.key]`; `data-tip-pos="left"`;
  `<Info>` solo si hay tip; el genérico "Se marca solo cuando…" se conserva como fallback de los
  autos; `<Lock>` y data-testids intactos. ✓
- **config.ts**: exactamente **+2 líneas** (los 2 ítems nuevos), cero lógica tocada. ✓
- **Cero textos de consejo hardcodeados**: los 39 `data-tip`/`tip` nuevos referencian `CONSEJOS.*`.
  Única excepción válida: los 2 `texto:` de los checks nuevos en config.ts.
- **data-testids**: las 3 líneas `-` con data-testid (`btn-archivar`, `field-tipo-${v}`,
  `sprint-add-snapshot`) tienen su `+` idéntico — solo se les añadió `data-tip`. Ninguno
  borrado/renombrado. ✓
- **StepGuion**: `CAMPOS_SEO` ya no tiene tips hardcodeados (importa de `CONSEJOS.guion.campos.*`,
  que incluyen las refs `(s9_aX)`); chips seoReset/seoZoom usan `CONSEJOS.edicion.checks[...]`
  (cross-slug, decisión aprobada); data-testids con `k.toLowerCase()` intactos. ✓
- **Validación de claves**: los 39 refs `CONSEJOS.*` resuelven a una entrada real de consejos.ts
  (incluidas las claves computadas `tipo${Cap}` de StepIdea y `estrategiaSeo*` de StepMiniatura).
  **Cero tooltips `undefined`.** ✓
- **Cotejo §3.8 (publicacion)**: descripcion, comentarioFijado, hashtagsDescripcion, timestamps
  (inserción nueva), pantallasYTarjetas (x2: pantallas+tarjetas, mismo texto), seoHora (x2:
  día+hora). Todas las filas aplicadas con la clave correcta. ✓
- **Cotejo §3.9 (sprint)**: bannerDetalle (EmptyState), metricasSprint (snapshot),
  emailMarketing + postComunidad (check-rows). Todas correctas. ✓

### 3. Conteos de checklist (config.ts)
- `grabacion` = **8 ítems**, `energia-camara` insertado tras `iluminacion-verificada`. ✓
- `sprint` = **11 ítems**, `sin-cambios-24h` como primer ítem. ✓
- Ambos nuevos **sin campo `auto`** (manuales). ✓

### 4. `npm test` (raíz)
```
backend:   # tests 42  # pass 42  # fail 0       (node --test)
frontend:  tsc --noEmit                          → OK (sin errores)
frontend:  vite build                            → ✓ built in 18.42s
```
2 warnings preexistentes y ajenos a T009 (dynamic-import de config.ts; chunk > 500kB). Verde.

### 5. Smoke del bundle (`dist/assets/index-mIJ3MgXw.js`, post-arreglo)
- `data-tip` en el bundle: **23 ocurrencias** (los tooltips están compilados).
- "Entrar a matar" presente (texto de `guion.campos.seoShock`). ✓
- Verificadas además frases de los ítems nuevos: "Roturas de energía planificadas"
  (energia-camara), "Sin tocar miniatura" (sin-cambios-24h), "arma secreta del sprint"
  (emailMarketing), "Pescaseo". Todas presentes. ✓
- `dist/` no está en git (gitignored): no hay baseline commiteado para diff, pero el conteo
  absoluto + la presencia confirmada del texto Romuald es evidencia suficiente.

---

## Decisión sobre la "normalización de comillas" (punto crítico)

**El implementor cambió comillas tipográficas `“”` (U+201C/U+201D) por comillas rectas ASCII `""`
en 4 textos VISIBLES de UI, y su justificación es FALSA.**

Spots degradados:
1. `StepTitulo.tsx`        — `kw “{kwIncluida}”`            → `kw "{kwIncluida}"`
2. `StepPublicacion.tsx`   — `antes del “ver más”`          → `antes del "ver más"`
3. `StepPublicacion.tsx`   — `“{r.titulo}” en título`       → `"{r.titulo}" en título`
4. `StepEvergreen.tsx`     — `estado “Archivado”`           → `estado "Archivado"`

El implementor alegó que "el parser TSX rechazaba las comillas tipográficas adyacentes a atributos
JSX nuevos". **Esto es incorrecto**: las comillas tipográficas en *contenido de texto* JSX (entre
etiquetas) son simples caracteres Unicode y son perfectamente válidas; no tienen ninguna relación
sintáctica con los atributos `data-tip` (que se añadieron en la etiqueta de apertura, otra posición
distinta). Nunca hubo error de parser por estas comillas.

**Prueba decisiva del estilo del repo**: hay 4 textos de UI en OTROS archivos no tocados por T009
que siguen usando comillas tipográficas y compilan sin problema —
`TemplateDetail.tsx:192` (`“{tpl.nombre}”…`), `VideoDetail.tsx:88` (`…“{reanudar.titulo}”`),
`VideoDetail.tsx:187` (`Se elimina “{…}”`) y `i18n/es.ts:61` (`…los botones “Generar”`). El patrón
`“{interpolación}”` se usa idéntico en TemplateDetail y VideoDetail. Esto confirma que (a) el repo
usa tipográficas como estilo y (b) JSX las parsea sin issue — refutando la justificación.

**Decisión: opción (b) — RESTAURADO.** El objetivo de T009 era añadir tooltips, no retocar textos
existentes. Degradar la tipografía donde el resto del repo usa comillas tipográficas es una
regresión de calidad visible. He revertido los 4 spots a `“”` con edición byte-precisa
(UTF-8, sin tocar nada más de esas líneas). Verificado: `git diff` ya no muestra ninguna línea de
texto con comilla tipográfica como `-` (0 removals); esas líneas vuelven a ser contexto sin cambio.
Las modificaciones reales de T009 en esos 3 ficheros (envolver en `LabelConTip`, añadir `data-tip`,
añadir el `<p className="field-hint">`) se conservan intactas.

---

## Arreglos hechos por el reviewer

1. **Restauración de 4 comillas tipográficas** en `StepTitulo.tsx`, `StepPublicacion.tsx` (x2) y
   `StepEvergreen.tsx` (detalle arriba). Es el único arreglo necesario; el resto de la
   implementación estaba correcta.

Re-ejecutado tras el arreglo: tsc ✓, build ✓ (el smoke del bundle de arriba ya es post-arreglo).

---

## Nota / patrón a vigilar (aún NO es candidato de `improvements/`)

Es la **1.ª vez** que se observa este patrón (no se cumple el umbral de 2+ del CLAUDE.md, así que
NO lo registro en `improvements/`). Pero queda anotado para el orquestador: el implementor
"normalizó" tipografía Unicode existente justificándolo con un fallo de parser inexistente. Si se
repitiera en otra tarea, sería candidato claro a `improvements/` (regla sugerida: las tareas de
añadir features no deben retocar texto/tipografía existente; las comillas tipográficas en texto JSX
son válidas y son el estilo del repo).
