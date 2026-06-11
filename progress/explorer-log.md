# Explorer Log — T009 · Capa Consejos Romuald Fase 2: tooltips de campos y checklist

---

## 1. `fields.tsx` — estado actual y punto de inserción de `LabelConTip`

**Ruta**: `app/frontend/src/wizard/fields.tsx`

**Exportaciones actuales** (líneas reales):
- L5 `CharCount` — span con clases over/warn
- L15 `ChipsEditor` — chips con add/remove
- L92 `ListEditor` — lista editable
- L155 `RefsEditor` — filas URL+notas

**Imports actuales** (L2): `useState`, `KeyboardEvent` de react; `Plus`, `Trash2`, `Video as VideoIcon` de lucide-react. Faltan `Info` (lucide) y `ReactNode` (react).

**LabelConTip no existe todavía**. Hay que añadirla al final del archivo (L205, tras la última `}`).

**Patrón de labels en los steps** — ejemplos reales:

StepIdea.tsx L22–24 (`<label>` con `htmlFor`):
```tsx
<label className="label" htmlFor="f-idea">
  ¿Sobre qué va tu próximo vídeo?
</label>
```

StepIdea.tsx L52–55 (`<span>` sin `htmlFor`, con `data-tip` existente):
```tsx
<span className="label" data-tip="Sprint vive de los 7 primeros días; evergreen acumula durante meses (s3_a1)">
  Tipo de vídeo
</span>
```

StepInvestigacion.tsx L9–10 (`<span>` sin `htmlFor`, sin `data-tip`):
```tsx
<span className="label">Palabras clave (máx 15)</span>
```

StepGuion.tsx L42–44 (patrón ya establecido con data-tip + ⓘ en carácter unicode):
```tsx
<label className="label" htmlFor={`f-${k}`} data-tip={tip}>
  {label} <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>ⓘ</span>
</label>
```

**Conclusión para LabelConTip**: la guía propone usar `<label>` con `htmlFor` opcional y el icono `<Info size={12}/>` de lucide. Sin embargo, StepInvestigacion usa `<span className="label">` (no `<label>`) porque sus campos son `ChipsEditor`/`ListEditor`/`RefsEditor` sin `id`. El implementor debe diseñar `LabelConTip` para funcionar como ambos — o bien aceptar un prop `as?: "label" | "span"` (defaulting to `"label"`). La guía (§3.2, nota al pie) ya advierte esto explícitamente: "Los labels son `<span className="label">` (no `<label>`)".

**Firma propuesta por la guía** (§2.5):
```tsx
export function LabelConTip({ htmlFor, tip, children }: {
  htmlFor?: string; tip: string; children: ReactNode;
}) {
  return (
    <label className="label" htmlFor={htmlFor} data-tip={tip}>
      {children} <Info size={12} style={{ color: "var(--text-tertiary)", verticalAlign: "-1px" }} />
    </label>
  );
}
```
El implementor debe añadir también el caso `as="span"` para StepInvestigacion y StepMiniatura (estrategias).

---

## 2. `Checklist.tsx` — archivo completo analizado

**Ruta**: `app/frontend/src/wizard/Checklist.tsx` (50 líneas)

**Estructura**:
- Props: `{ video: VideoProject; step: StepDef; onToggle: (itemKey: string, valor: boolean) => void }`
- Iteración: `step.checklist.map((item) => ...)` (L25)
- `data-tip` genérico actual (L32–33): solo aplicado cuando `esAuto`:
  ```tsx
  data-tip={esAuto ? "Se marca solo cuando el dato correspondiente está completo" : undefined}
  ```
- `<Lock size={12}/>` en L42 cuando `esAuto`
- `data-testid` de cada ítem (L38): `checklist-${step.slug}-${item.key}` — NO tocar
- Variable `step` viene como prop `step: StepDef`
- NO hay import de `CONSEJOS` actualmente (hay que añadirlo)

**Cambio que necesita la guía** (§2.6): importar `CONSEJOS`, computar `tipRomuald` en el map, usarlo en el `data-tip` del `<label>`. También añadir `<Info size={12}/>` cuando exista `tipRomuald`. El `data-tip` genérico de los autos se conserva como fallback.

Fragmento actual del `<label>` (L30–43):
```tsx
<label
  className={esAuto ? "auto" : ""}
  data-tip={esAuto ? "Se marca solo cuando el dato correspondiente está completo" : undefined}
>
  <input
    type="checkbox"
    checked={hecho}
    disabled={esAuto}
    data-testid={`checklist-${step.slug}-${item.key}`}
    onChange={(e) => onToggle(item.key, e.target.checked)}
  />
  <span className="check-text">{item.texto}</span>
  {esAuto && <Lock size={12} className="check-lock" aria-label="Item automático" />}
</label>
```

---

## 3. `config.ts` — checklists de `grabacion` y `sprint`

**Ruta**: `app/frontend/src/wizard/config.ts`

**Tipo `ChecklistItemDef`** (L4–10):
```ts
export interface ChecklistItemDef {
  key: string;
  texto: string;
  /** si existe, el item es "auto": derivado del estado del proyecto, no clicable */
  auto?: (v: VideoProject) => boolean;
}
```
Los 2 checks nuevos son **manuales** (sin `auto`) — solo `{ key, texto }`.

**Checklist de `grabacion`** (L132–141, actualmente 7 ítems):
```ts
checklist: [
  { key: "lugar-preparado", texto: "Lugar/set preparado" },           // L133
  { key: "vestuario-decidido", texto: "Vestuario decidido" },          // L134
  { key: "broll-listado", texto: "Lista de b-roll necesaria escrita" },// L135
  { key: "audio-verificado", texto: "Prueba de audio hecha (niveles OK)" }, // L136
  { key: "iluminacion-verificada", texto: "Iluminación montada y probada" }, // L137
  { key: "material-grabado", texto: "Contenido principal grabado" },   // L138
  { key: "broll-grabado", texto: "B-roll grabado" },                   // L139
],
```
**Insertar `energia-camara` tras `iluminacion-verificada` (L137)**, entre L137 y L138. Resultado: 8 ítems.

**Checklist de `sprint`** (L214–233, actualmente 10 ítems):
```ts
checklist: [
  { key: "email-enviado", texto: "Día 1 · Email a la lista enviado", auto: (v) => v.difusion.emailEnviado }, // L215
  { key: "post-comunidad-publicado", ... },  // L216
  { key: "redes-compartido", ... },          // L217–224
  { key: "comentarios-dia1-respondidos", ... }, // L226
  { key: "snapshot-dia2", ... },             // L227
  { key: "seorepesca-publicada", ... },      // L228
  { key: "snapshot-dia4", ... },             // L229
  { key: "ctr-evaluado", ... },              // L230
  { key: "snapshot-dia7", ... },             // L231
  { key: "aprendizajes-anotados", ... },     // L232
],
```
**Insertar `sin-cambios-24h` como PRIMER ítem** (antes de `email-enviado`, L215). Resultado: 11 ítems.

**Confirmación**: `energia-camara` y `sin-cambios-24h` ya están en `consejos.ts` con sus textos de tooltip (L135–137 y L200–202 respectivamente).

---

## 4. `AiBlock.tsx` — estado actual y punto de anclaje del tooltip

**Ruta**: `app/frontend/src/wizard/AiBlock.tsx` (92 líneas)

**Props actuales** (L10–17):
```ts
interface Props {
  tipo: string;
  videoProjectId: string;
  etiqueta: string;
  opciones?: Record<string, unknown>;
  render: (resultados: unknown[], parseFallido: boolean) => ReactNode;
  disabledExtra?: string | null;
}
```
No hay prop `tip` todavía.

**Dónde anclar el tooltip** (L50–54): el `<section>` del bloque tiene un `<div className="ai-head">` con icono `<Sparkles>` y `<strong>{etiqueta}</strong>`. La guía (§3.3) propone añadir prop `tip?: string` y colocar `data-tip={tip}` en el `<div className="ai-head">` o en la `<strong>`. El elemento `<strong>` es el más limpio como ancla hover.

**Usos actuales de `<AiBlock`** (grep confirmado):
- `StepInvestigacion.tsx` L31: `tipo="seo_preguntas"`, `etiqueta="Generar preguntas SEO con IA"`
- `StepTitulo.tsx` L79: `tipo="titulo"`, `etiqueta="Generar 9 títulos con IA"`
- `StepMiniatura.tsx` L92: `tipo="miniatura_brief"`, `etiqueta="Generar brief con IA"`
- `StepGuion.tsx` L56: `tipo="hook"`, `etiqueta="Generar ganchos con IA"`
- `StepPublicacion.tsx` L130: `tipo="descripcion"`, `etiqueta="Generar descripción con IA"`
- `StepPublicacion.tsx` L189: `tipo="hashtags"`, `etiqueta="Proponer hashtags con IA"`
- `StepSprint.tsx` L150: `tipo="comunidad"`, `etiqueta="Generar post de comunidad con IA"`
- `StepSprint.tsx` L183: `tipo="email"`, `etiqueta="Generar email de nuevo vídeo con IA"`
- `StepEvergreen.tsx` L82: `tipo="analisis_retencion"`, `etiqueta="Analizar métricas con IA"`

La guía (§3.3) solo especifica tooltip para el `AiBlock` de **StepTitulo** (`etiqueta="Generar 9 títulos con IA"`, clave `titulo.campos.generarIA`). El resto no lleva `tip`.

---

## 5. Los 9 Steps — referencias reales de líneas y fragmentos JSX

### 5.1 StepIdea.tsx (`app/frontend/src/wizard/steps/StepIdea.tsx`)

**Label "¿Sobre qué va tu próximo vídeo?"** (L21–24):
```tsx
<label className="label" htmlFor="f-idea">
  ¿Sobre qué va tu próximo vídeo?
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-idea" tip={CONSEJOS.idea.campos.tituloIdea}>¿Sobre qué va tu próximo vídeo?</LabelConTip>`

**Label "Cuéntalo en 2–3 frases" (Brief)** (L38–40):
```tsx
<label className="label" htmlFor="f-brief">
  Cuéntalo en 2–3 frases
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-brief" tip={CONSEJOS.idea.campos.descripcionCorta}>Cuéntalo en 2–3 frases</LabelConTip>`

**Array TIPOS y render de radio-cards** (L5–9 y L56–69):
```ts
const TIPOS = [
  { v: "evergreen", t: "Evergreen", d: "Vídeo atemporal que acumula vistas meses" },
  { v: "sprint", t: "Sprint", d: "Vive de los primeros 7 días (tendencia, noticia)" },
  { v: "mixto", t: "Mixto", d: "Arranque fuerte + cola larga" },
] as const;
```
```tsx
{TIPOS.map(({ v, t, d }) => (
  <button
    key={v}
    type="button"
    className={`radio-card${video.tipo === v ? " selected" : ""}`}
    data-testid={`field-tipo-${v}`}
    onClick={() => patch({ tipo: v })}
  >
    <strong>{t}</strong>
    <span>{d}</span>
  </button>
))}
```
Añadir `data-tip` al `<button>` de cada tipo. El array TIPOS debe extenderse con `tip` o usar `CONSEJOS.idea.campos[...]` directamente en el render. La guía dice: la descripción `d` se conserva; el `data-tip` va en el botón. El implementor puede añadir un campo `tip` al array TIPOS o hacer lookup `CONSEJOS.idea.campos[\`tipo${v.charAt(0).toUpperCase()+v.slice(1)}\`]`.

**Label "Nicho"** (L90–92):
```tsx
<label className="label" htmlFor="f-nicho">
  Nicho
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-nicho" tip={CONSEJOS.idea.campos.nicho}>Nicho</LabelConTip>`

**data-tip a ELIMINAR** — label "Tipo de vídeo" (L52–55):
```tsx
<span className="label" data-tip="Sprint vive de los 7 primeros días; evergreen acumula durante meses (s3_a1)">
  Tipo de vídeo
</span>
```
Eliminar el atributo `data-tip` completo, dejar solo `<span className="label">Tipo de vídeo</span>`.

### 5.2 StepInvestigacion.tsx (`app/frontend/src/wizard/steps/StepInvestigacion.tsx`)

**Label "Palabras clave"** (L10):
```tsx
<span className="label">Palabras clave (máx 15)</span>
```
Reemplazar por `<LabelConTip as="span" tip={CONSEJOS.investigacion.campos.palabrasClave}>Palabras clave (máx 15)</LabelConTip>`

**Label "Preguntas"** (L21):
```tsx
<span className="label">Preguntas que responde el vídeo (máx 10)</span>
```
Reemplazar por `<LabelConTip as="span" tip={CONSEJOS.investigacion.campos.seoPreguntas}>Preguntas que responde el vídeo (máx 10)</LabelConTip>`

**Label "Vídeos de la competencia"** (L55):
```tsx
<span className="label">Vídeos de la competencia</span>
```
Reemplazar por `<LabelConTip as="span" tip={CONSEJOS.investigacion.campos.competenciaRefs}>Vídeos de la competencia</LabelConTip>`

Confirmado: los 3 son `<span className="label">` (sin `htmlFor`).

### 5.3 StepTitulo.tsx (`app/frontend/src/wizard/steps/StepTitulo.tsx`)

**Label "Título final"** (L22–24):
```tsx
<label className="label" htmlFor="f-titulo-final">
  Título final
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-titulo-final" tip={CONSEJOS.titulo.campos.tituloFinal}>Título final</LabelConTip>`

**Indicador kw verde** (L41–45):
```tsx
{kwIncluida && (
  <span className="field-hint" style={{ margin: 0, color: "var(--accent-mint)" }}>
    <Check size={12} style={{ display: "inline" }} /> kw "{kwIncluida}"
  </span>
)}
```
Añadir `data-tip={CONSEJOS.titulo.campos.palabraClave}` al `<span>`. El fragmento completo es el `{kwIncluida && (...)}` del bloque de indicadores (L36–46).

**`<AiBlock>` de títulos** (L79–114):
```tsx
<AiBlock
  tipo="titulo"
  videoProjectId={video.id}
  etiqueta="Generar 9 títulos con IA"
  render={...}
/>
```
Añadir prop `tip={CONSEJOS.titulo.campos.generarIA}`. Requiere añadir `tip?: string` a `AiBlock.tsx` Props y anclar en el `<div className="ai-head">` o en `<strong>`.

**Label hashtag título** (L117–119):
```tsx
<label className="label" htmlFor="f-hashtag-titulo">
  Hashtag en el título (máx 1, opcional)
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-hashtag-titulo" tip={CONSEJOS.titulo.campos.hashtagTitulo}>Hashtag en el título (máx 1, opcional)</LabelConTip>`

El `field-hint` de L132 (`"Si lo usas, irá al final del título..."`) se MANTIENE.

### 5.4 StepMiniatura.tsx (`app/frontend/src/wizard/steps/StepMiniatura.tsx`)

**Estrategias (chips) — render actual** (L46–57):
```tsx
<div className="chips">
  {ESTRATEGIAS.map((e) => (
    <button
      key={e}
      type="button"
      className={`chip${video.miniatura.estrategia === e ? " active" : ""}`}
      data-testid={`field-miniatura-estrategia-${e.toLowerCase()}`}
      onClick={() => patch({ miniatura: { ...video.miniatura, estrategia: e } })}
    >
      {e}
    </button>
  ))}
</div>
```
El array `ESTRATEGIAS` (L9) es `["SEOmarco", "SEOcara", "SEOflecha", "otra"] as const`. Los chips `field-miniatura-estrategia-seomarco/seocara/seoflecha` necesitan `data-tip`. El valor `"otra"` no tiene consejo en `consejos.ts`. El implementor puede añadir un objeto de tips indexado por estrategia y accederlo en el render.

**Label "Palabras impresas"** (L63–65):
```tsx
<label className="label" htmlFor="f-palabras-mini">
  Palabras impresas (3–5)
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-palabras-mini" tip={CONSEJOS.miniatura.campos.palabrasMiniatura}>Palabras impresas (3–5)</LabelConTip>`

**Botón `btn-simular-grilla`** (L170–178): aparece condicionalmente, solo cuando hay `urlPrincipal`:
```tsx
{video.miniatura.urlPrincipal && (
  <button
    type="button"
    className="btn btn-ghost btn-sm"
    data-testid="btn-simular-grilla"
    onClick={() => setSimulaGrilla(!simulaGrilla)}
  >
    <Eye size={14} /> {simulaGrilla ? "Vista normal" : "Ver a tamaño búsqueda"}
  </button>
)}
```
Añadir `data-tip={CONSEJOS.miniatura.checks["test-grilla-superado"]}` al botón.

El `field-hint` de L59 (`"SEOmarco = borde llamativo · SEOcara = rostro..."`) se MANTIENE.

### 5.5 StepGuion.tsx (`app/frontend/src/wizard/steps/StepGuion.tsx`)

**Array `CAMPOS_SEO`** (L10–16) — textos actuales que se REEMPLAZAN:
```ts
const CAMPOS_SEO = [
  { k: "seoShock",     label: "SEOshock",     tip: "Gancho fuerte: dato, conflicto o demostración (s9_a3)" },
  { k: "seoInicio",    label: "SEOinicio",    tip: "Apertura 0:00-0:20 que promete el resultado (s9_a2)" },
  { k: "seoLoop",      label: "SEOloop",      tip: "Promesa diferida que se resuelve al final (s9_a4)" },
  { k: "seoResultado", label: "SEOresultado", tip: "El desenlace que cumple la promesa (s9_a8)" },
  { k: "psicoCta",     label: "PsicoCTA",     tip: "Llamada a la acción conectada al beneficio (s9_a9)" },
];
```
Reemplazar los 5 valores `tip:` por los de `CONSEJOS.guion.campos.*` (que ya incluyen las referencias `(s9_aX)` al final). Los nuevos textos están en `consejos.ts` L104–116.

**Label cliffhanger** (L211–213):
```tsx
<label className="label" htmlFor="f-cliffhanger" data-tip="Anticipa el próximo vídeo justo antes del PsicoCTA (s9_a10)">
  Cliffhanger (opcional) <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>ⓘ</span>
</label>
```
Reemplazar el valor del atributo `data-tip` con `CONSEJOS.guion.campos.cliffhanger`.

**Chips de rotura/SEOreset/SEOzoom en bloques** (L155–173):
```tsx
<div className="chips">
  {(
    [
      ["roturaPatron", "Rotura de patrón"],
      ["seoReset", "SEOreset"],
      ["seoZoom", "SEOzoom"],
    ] as const
  ).map(([k, label]) => (
    <button
      key={k}
      type="button"
      className={`chip${b[k] ? " active" : ""}`}
      data-testid={`guion-bloque-${i}-${k.toLowerCase()}`}
      onClick={() => setBloque(i, { [k]: !b[k] } as Partial<BloqueGuion>)}
    >
      {label}
    </button>
  ))}
</div>
```
Añadir `data-tip` a cada botón: `roturaPatron` usa `CONSEJOS.guion.campos.roturaPatron`; `seoReset` usa `CONSEJOS.edicion.checks["seoreset-aplicado"]`; `seoZoom` usa `CONSEJOS.edicion.checks["seozoom-aplicado"]`. Los data-testids usan `k.toLowerCase()` — NO tocar.

**Contador Σ M:SS** (L91–93):
```tsx
<span className="mono" style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
  Σ {fmt(video.guion.duracionTotalEstimadaSeg)} estimado
</span>
```
Añadir `data-tip={CONSEJOS.guion.campos.duracionEstimada}` y `style={{ cursor: "help", ... }}`.

### 5.6 StepGenerico.tsx (`app/frontend/src/wizard/steps/StepGenerico.tsx`)

**Card "Tu guion pide:"** (L31–40):
```tsx
{recordatoriosEdicion && pendientes.length > 0 && (
  <div className="card" style={{ marginBottom: "var(--space-5)", borderColor: "var(--accent-gold)" }}>
    <strong>Tu guion pide:</strong>
    <ul style={{ margin: "var(--space-2) 0 0 var(--space-5)", color: "var(--text-secondary)" }}>
      {pendientes.map((p, i) => (
        <li key={i}>{p}</li>
      ))}
    </ul>
  </div>
)}
```
BONUS según guía §3.7: añadir una línea bajo la lista con texto de `CONSEJOS.edicion.campos.tuGuionPide`. Ya está en `consejos.ts` L147. El implementor puede añadirla como `<p className="field-hint">` al final del `<div>` (tras `</ul>`).

### 5.7 StepPublicacion.tsx (`app/frontend/src/wizard/steps/StepPublicacion.tsx`)

**Label descripción** (L112–117):
```tsx
<label className="label" htmlFor="f-desc">
  Descripción publicada{" "}
  <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>
    (las 2 primeras líneas son el SEOextracto: lo único visible antes del "ver más")
  </span>
</label>
```
Envolver en `LabelConTip htmlFor="f-desc" tip={CONSEJOS.publicacion.campos.descripcion}`. El `<span>` de SEOextracto se mantiene como children.

**Label hashtags descripción** (L176–177, `<span className="label">`):
```tsx
<span className="label">En descripción (regla del 3: amplio + medio + específico, máx 15)</span>
```
Reemplazar por `<LabelConTip as="span" tip={CONSEJOS.publicacion.campos.hashtagsDescripcion}>En descripción (regla del 3: amplio + medio + específico, máx 15)</LabelConTip>`

**Sección timestamps** — no hay `<label>` ni `<span className="label">` antes de las filas de timestamps. Las filas están dentro del acordeón C (L244–310). El botón `timestamps-add` está en L288–295. No existe label actualmente — el implementor debe CREAR un `<LabelConTip as="span">` (o `<span className="label">`) antes de las filas de timestamps (antes del `<div>` de L253). Este es el único campo donde es una inserción, no un reemplazo.

**Pantallas finales** (L317–318, `<span className="label">`):
```tsx
<span className="label">Configuración de pantallas finales (últimos 20s)</span>
```
Reemplazar por `<LabelConTip as="span" tip={CONSEJOS.publicacion.campos.pantallasYTarjetas}>Configuración de pantallas finales (últimos 20s)</LabelConTip>`

**Tarjetas** (L429, `<span className="label">`):
```tsx
<span className="label">Tarjetas (máx 5 · nunca en el primer minuto · 2 min de distancia)</span>
```
El mismo tooltip `pantallasYTarjetas` (la guía indica mismo texto para ambas secciones).

**SEOhora — Día de la semana** (L516–519):
```tsx
<label className="label" htmlFor="f-dia">
  Día de la semana
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-dia" tip={CONSEJOS.publicacion.campos.seoHora}>Día de la semana</LabelConTip>`

**SEOhora — Hora** (L535–537):
```tsx
<label className="label" htmlFor="f-hora">
  Hora
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-hora" tip={CONSEJOS.publicacion.campos.seoHora}>Hora</LabelConTip>` (mismo texto que día).

**Comentario fijado** (L156–158):
```tsx
<label className="label" htmlFor="f-fijado">
  Comentario fijado
</label>
```
Reemplazar por `<LabelConTip htmlFor="f-fijado" tip={CONSEJOS.publicacion.campos.comentarioFijado}>Comentario fijado</LabelConTip>`

### 5.8 StepSprint.tsx (`app/frontend/src/wizard/steps/StepSprint.tsx`)

**EmptyState previo a publicar** (L24–37):
```tsx
<EmptyState
  icon={Rocket}
  title="Publica el vídeo para arrancar el sprint"
  desc="Los 7 días posteriores a la publicación deciden el alcance inicial. Esta etapa se activa al marcar el vídeo como publicado."
  cta={...}
/>
```
La guía (§3.9) dice AMPLIAR `desc` con el texto de `CONSEJOS.sprint.bannerDetalle`. El texto actual es la prop `desc`; concatenar o reemplazar con el contenido del bannerDetalle.

**check-row email** (L67–75):
```tsx
<label className="check-row">
  <input
    type="checkbox"
    checked={video.difusion.emailEnviado}
    data-testid="field-difusion-email"
    onChange={(e) => patch({ difusion: { ...video.difusion, emailEnviado: e.target.checked } })}
  />
  Email a la lista enviado
</label>
```
Añadir `data-tip={CONSEJOS.sprint.campos.emailMarketing}` al `<label className="check-row">`.

**check-row comunidad** (L76–85):
```tsx
<label className="check-row">
  <input
    type="checkbox"
    checked={video.difusion.postComunidad.enviado}
    data-testid="field-difusion-comunidad"
    onChange={(e) =>
      patch({ difusion: { ...video.difusion, postComunidad: { ...video.difusion.postComunidad, enviado: e.target.checked } } })
    }
  />
  Post de comunidad publicado
</label>
```
Añadir `data-tip={CONSEJOS.sprint.campos.postComunidad}` al `<label className="check-row">`.

**Botón `sprint-add-snapshot`** (L49):
```tsx
<button className="btn btn-secondary btn-sm" onClick={() => setModalSnap(true)} data-testid="sprint-add-snapshot">
  <Plus size={14} /> Snapshot de métricas
</button>
```
Añadir `data-tip={CONSEJOS.sprint.campos.metricasSprint}`.

### 5.9 StepEvergreen.tsx (`app/frontend/src/wizard/steps/StepEvergreen.tsx`)

**Banner-aviso del día 30** (L35–38):
```tsx
{dia !== null && dia < 30 && (
  <p className="banner-aviso" data-testid="evergreen-banner">
    <Info size={14} /> Este módulo brilla a partir del día 30. Hoy: día {dia}.
  </p>
)}
```
La guía (§3.10) dice AMPLIAR el texto del banner-aviso con `CONSEJOS.evergreen.bannerDetalle`. El implementor puede añadir el contenido del bannerDetalle como texto adicional en la `<p>` o como segundo elemento.

**Botón `btn-archivar`** (L139):
```tsx
<button type="button" className="btn btn-secondary" data-testid="btn-archivar" onClick={() => setModalArchivar(true)}>
  <Archive size={16} /> Archivar proyecto
</button>
```
Añadir `data-tip={CONSEJOS.evergreen.campos.archivar}`.

**Modal `confirm-archivar`** — cuerpo actual (L167–169):
```tsx
<p>El vídeo pasa a estado "Archivado". Podrás recuperarlo cambiando su estado en el detalle.</p>
```
Añadir un segundo `<p>` con el texto de `CONSEJOS.evergreen.campos.archivar` tras esta `<p>`.

---

## 6. Tests con conteos de checklist

Resultado del análisis — ningún test cuenta ítems de checklist por etapa ni valida keys concretas de `grabacion` o `sprint`. El único test de checklist (`videos.test.mjs` L70–77) usa la key `"idea-validada-3-fuentes"` de la etapa `"idea"` — no afectada por los nuevos ítems.

Los tests de `export-import.test.mjs` y `curso-plantillas.test.mjs` no tocan conteos de checklist de etapas específicas. No existe ningún `assert.equal(grabacion.checklist.length, 7)` ni `assert.equal(sprint.checklist.length, 10)` en ningún test.

**Conclusión**: los 2 checks nuevos (`energia-camara` en grabacion, `sin-cambios-24h` en sprint) no rompen ningún test existente. No hay que actualizar ningún test.

---

## 7. types.ts — tipos relevantes

**`StepId`** (`app/frontend/src/types.ts` L40–50): union type de 10 strings literales. El `slug: StepId` de `StepDef` (config.ts L13) y el prop del `TipBanner` ya usan este tipo. `LabelConTip` no necesita `StepId` directamente.

**`ChecklistItemDef`** (`config.ts` L4–10): `{ key: string; texto: string; auto?: fn }`. No hay campo `tip` en el tipo — los tooltips de checklist se resuelven en runtime desde `Checklist.tsx` via `CONSEJOS[step.slug].checks[item.key]`. No hay que modificar el tipo.

---

## 8. Estado de la Fase 1 (ya completada — no recrear)

Los siguientes archivos existen y están listos para ser importados:
- `app/frontend/src/wizard/consejos.ts` — 244 líneas, `CONSEJOS` con los 10 slugs y `GLOSARIO_ROMUALD`
- `app/frontend/src/wizard/TipBanner.tsx` — 102 líneas, integrado en `VideoWizard.tsx` L149
- CSS `.tip-banner` / `.tip-banner-collapsed` en `wizard.css` L603+

---

## Riesgos / Atención

**1. Ambigüedad de old_string en StepPublicacion.tsx**
El archivo tiene 603 líneas y múltiples `<label className="label">`. Los fragmentos para Edit deben incluir el atributo `htmlFor` como clave de unicidad: `f-desc`, `f-fijado`, `f-dia`, `f-hora` son únicos. Para los `<span className="label">` usar la cadena de texto completa como ancla.

**2. Timestamps — no existe label previo: es inserción, no reemplazo**
En la sección de capítulos (acordeón C de StepPublicacion) no hay ningún `<span className="label">` antes de las filas de timestamps. El implementor debe CREAR ese elemento antes de la lista (L253). No es un Edit de old_string a new_string sino una inserción de bloque nuevo.

**3. `LabelConTip` necesita soporte `as="span"` desde el principio**
La guía §2.5 define solo `<label>`. Pero StepInvestigacion (3 campos), StepMiniatura (estrategias), y StepPublicacion (hashtags, pantallas, tarjetas) usan `<span className="label">`. Si se implementa solo con `<label>` habrá que refactorizar en la misma tarea. Diseñar con `as` prop desde el inicio.

**4. TIPOS array en StepIdea — opción de diseño pendiente de decisión**
Para añadir `data-tip` a los radio-cards hay dos opciones: (A) añadir campo `tip` al array `TIPOS as const`; (B) lookup directo en render con key calculada. La opción B es más limpia dado que el array es pequeño y tiene tipo `as const`. El orquestador debe decidir antes de delegar.

**5. Chips de estrategia en StepMiniatura — "otra" no tiene consejo**
El chip `field-miniatura-estrategia-otra` no tiene entrada en `consejos.ts`. No añadir `data-tip` al chip "otra"; los 3 estrategias nombradas sí lo llevan.

**6. Chips de guion (seoReset/seoZoom) — claves en `edicion`, no en `guion`**
Los tips de los chips SEOreset/SEOzoom del bloque de desarrollo (StepGuion L155–173) deben venir de `CONSEJOS.edicion.checks["seoreset-aplicado"]` y `CONSEJOS.edicion.checks["seozoom-aplicado"]`, NO de `CONSEJOS.guion`. La guía §3.5 lo especifica. Es contraintuitivo — documentarlo en el implementor-log.

**7. data-testids existentes — NO tocar bajo ningún concepto**
`checklist-${step.slug}-${item.key}`, `field-tipo-*`, `field-miniatura-estrategia-*`, `guion-bloque-${i}-${k.toLowerCase()}`, `btn-simular-grilla`, `sprint-add-snapshot`, `btn-archivar`, `confirm-archivar`, `field-difusion-email`, `field-difusion-comunidad`.

**8. AiBlock — colisión entre `disabledExtra` y nuevo `tip`**
`AiBlock` ya usa `data-tip` en el botón de generar para `disabledExtra` (L63). El nuevo prop `tip` debe anclarse en el `<div className="ai-head">` o en el `<strong>`, no en el `<button>`, para no colisionar.

**9. Refactor ⓘ unicode en StepGuion — opcional pero recomendado**
La guía recomienda migrar el carácter `ⓘ` unicode a `<Info size={12}/>` de lucide al crear `LabelConTip`. `Info` ya está importado en StepEvergreen.tsx — está disponible en el bundle. Si se hace, verificar que los CAMPOS_SEO de StepGuion migran correctamente al helper.

**10. Orden de implementación recomendado**
1. Añadir `LabelConTip` (con prop `as`) a `fields.tsx` — bloque fundacional del que dependen todos los steps.
2. Modificar `AiBlock.tsx` prop `tip` — solo afecta a StepTitulo.
3. Modificar `Checklist.tsx` para lookup Romuald — afecta a todos los steps con checklist.
4. Añadir 2 checks en `config.ts`.
5. Modificar los 9 steps en orden de complejidad creciente (StepIdea → StepInvestigacion → StepTitulo → StepMiniatura → StepGuion → StepGenerico → StepPublicacion → StepSprint → StepEvergreen).
