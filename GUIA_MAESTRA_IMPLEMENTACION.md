# GUÍA MAESTRA DE IMPLEMENTACIÓN
## Capa de Consejos "Biblia Crecetube" — Metodología Romuald Fons

> **Proyecto**: CRECETUBE Assistant (`github.com/kabalah314-ux/crecetube`)
> **Versión**: 1.0 · Junio 2026
> **Alcance**: Integrar la "Biblia Crecetube" (consejos, banners, tooltips, glosario y tono de Romuald Fons) en el wizard de 10 etapas de la app, **sin tocar ninguna funcionalidad existente**.
> **Esfuerzo estimado**: 100% frontend (Fases 1–3) + 1 fase opcional de backend (tono de los prompts IA).
> **Compatible con**: el harness del repo (`CLAUDE.md`, `TASKS.json`, `progress/`). Al final encontrarás las tareas listas para pegar en `TASKS.json` y los prompts para Claude Code.

---

## ÍNDICE

| § | Sección | Para qué |
|---|---------|----------|
| 0 | Cómo usar esta guía | Orden de lectura y ejecución |
| 1 | Diagnóstico del código actual | Qué existe ya y qué falta |
| 2 | Arquitectura de la capa de consejos | Decisiones de diseño + nuevos archivos |
| 3 | Mapeo etapa por etapa (1–10) | Cada consejo → archivo, componente y mecanismo exacto |
| 4 | Conflictos de nomenclatura detectados | ⚠️ Leer antes de implementar |
| 5 | Glosario Romuald (Bloque L) | Integración en la UI |
| 6 | Guía de tono | Reglas de redacción + aplicación a la IA |
| 7 | Plan de implementación por fases | Sprints con dependencias |
| 8 | `data-testid` nuevos | Para los tests |
| 9 | Verificación y criterios de aceptación | Cómo saber que está bien |
| A | Apéndice A: `consejos.ts` completo | Todos los textos literales listos para pegar |
| B | Apéndice B: Tareas para `TASKS.json` | Formato del harness |
| C | Apéndice C: Prompts para Claude Code | Uno por fase |

---

## 0. CÓMO USAR ESTA GUÍA

1. Lee §1–§4 completos antes de escribir una línea de código (15 min).
2. Pega las tareas del Apéndice B en `TASKS.json`.
3. Ejecuta las fases en orden (§7). Cada fase es independiente, testeable y deja la app funcionando.
4. Los textos de los consejos **no se redactan**: se copian literalmente del Apéndice A. Ya están escritos con el tono Romuald validado (§6).
5. Tras cada fase: `npm test` (tests backend + typecheck + build frontend) + verificación manual de §9.

**Regla de oro**: esta capa es *aditiva*. Ningún cambio debe modificar lógica de guardado, checklists automáticos, navegación ni API. Si una tarea te obliga a tocar `useVideoProject.ts`, `db.js` o las rutas del backend, algo está mal planteado.

---

## 1. DIAGNÓSTICO DEL CÓDIGO ACTUAL

### 1.1 Lo que YA existe y se reutiliza

| Mecanismo | Dónde | Estado | Uso en esta capa |
|-----------|-------|--------|------------------|
| Tooltip CSS `[data-tip]` | `app/frontend/src/styles/components.css` (líneas ~471–496) | ✅ Funcional, `max-width: 280px` | Mecanismo principal de tooltips. **Necesita ampliarse a 360px** (los textos Romuald son largos) |
| Convención label + ⓘ | `StepGuion.tsx` (líneas 40–44 y 194–198) | ✅ Patrón establecido | Replicar en el resto de etapas con un helper `LabelConTip` |
| `field-hint` (texto visible bajo el campo) | `StepMiniatura.tsx` L59, `StepTitulo.tsx` L132 | ✅ | Para consejos que deben verse SIEMPRE (no solo en hover) |
| `banner-aviso` | `StepEvergreen.tsx` L36 + CSS | ✅ | Referencia visual para el nuevo `TipBanner` |
| Card con borde dorado | `StepGenerico.tsx` L32 ("Tu guion pide:") | ✅ | Patrón visual del `TipBanner` |
| `ContextPanel` | `app/frontend/src/wizard/ContextPanel.tsx` | ✅ Curso + plantillas + progreso | Se añade bloque "El consejo de Romuald" + Glosario |
| Checklist data-driven | `app/frontend/src/wizard/config.ts` (`STEPS[]`) | ✅ Única fuente de verdad | Se añaden 2 checks nuevos y tips por ítem |
| Tooltips en checks automáticos | `Checklist.tsx` L32 (`data-tip` genérico) | ✅ | Se sustituye por el tip Romuald específico de cada ítem |
| Catálogo de estrategias | `app/frontend/src/wizard/estrategias.ts` | ✅ 24 tags con familia/color | El Glosario Romuald lo complementa (no lo sustituye) |
| Tokens de color | `styles/tokens.css` (`--accent-gold #e5b454`, familias) | ✅ | El TipBanner usa `--accent-gold` (coherente con "Tu guion pide:") |

### 1.2 Lo que NO existe y hay que crear

| Pieza | Descripción | Fase |
|-------|-------------|------|
| `wizard/consejos.ts` | Catálogo data-driven con TODOS los textos (banner + tooltips de campos + tips de checklist + glosario) | 1 |
| `wizard/TipBanner.tsx` | Banner de etapa colapsable/descartable con persistencia en localStorage | 1 |
| `LabelConTip` en `wizard/fields.tsx` | Helper que unifica el patrón "label + ⓘ + data-tip" | 2 |
| 2 checks nuevos en `config.ts` | `energia-camara` (Etapa 6) y `sin-cambios-24h` (Etapa 9) | 2 |
| Bloque "Consejo Romuald" + "Glosario" en `ContextPanel` | Acceso permanente al consejo de etapa y a la terminología | 3 |
| Tono Romuald en generadores IA | `app/backend/src/prompts.js` (opcional) | 4 |

---

## 2. ARQUITECTURA DE LA CAPA DE CONSEJOS

### 2.1 Principios de diseño

1. **Data-driven, como `config.ts`**: todos los textos viven en UN archivo (`consejos.ts`), indexados por `StepId`. Cambiar un consejo = editar una string, jamás un componente.
2. **Tres niveles de intrusión** (de mayor a menor visibilidad):
   - **Nivel 1 — TipBanner**: 1 por etapa, visible al entrar, descartable. La "filosofía" de la etapa.
   - **Nivel 2 — field-hint**: texto corto siempre visible bajo campos críticos (máx. 1–2 por etapa, para no saturar).
   - **Nivel 3 — tooltip `data-tip` (hover sobre ⓘ)**: el grueso de los consejos. No molesta, está cuando se necesita.
3. **Cero backend** en fases 1–3. Los consejos son contenido estático del frontend.
4. **El tono manda** (§6): si al implementar necesitas acortar un texto para un tooltip, corta frases enteras del final, nunca "suavices" el lenguaje.

### 2.2 Nuevo archivo: `app/frontend/src/wizard/consejos.ts`

Modelo de datos (espejo del patrón de `config.ts`):

```ts
// consejos.ts — Biblia Crecetube (metodología Romuald Fons).
// ÚNICA fuente de verdad de los textos de la capa de consejos.
import type { StepId } from "../types";

export interface ConsejosEtapa {
  /** TipBanner: filosofía de la etapa. Siempre presente. */
  banner: string;
  /** Ampliación del banner, plegada tras "Leer más" (opcional). */
  bannerDetalle?: string;
  /** Tooltips de campos/controles. Clave = identificador semántico del campo. */
  campos: Record<string, string>;
  /** Tooltips de ítems del checklist. Clave = key del item en config.ts. */
  checks: Record<string, string>;
}

export const CONSEJOS: Record<StepId, ConsejosEtapa> = { /* Apéndice A */ };

export const GLOSARIO_ROMUALD: Array<{ termino: string; significado: string }> = [ /* §5 */ ];
```

**Decisiones clave**:
- `campos` usa claves semánticas (`tituloIdea`, `seoShock`, `estrategiaSeocara`…) y no `data-testid`, porque un mismo consejo puede aplicarse a varios controles (p. ej. `seoHora` cubre día + hora).
- `checks` usa **exactamente** las `key` de `config.ts` para poder hacer lookup directo en `Checklist.tsx`: `CONSEJOS[step.slug].checks[item.key]`.
- No se añaden los textos a `i18n/es.ts`: son *contenido* (como el curso), no *strings de UI*. Mantenerlos separados respeta la regla de oro #10 del kit (i18n preparado) sin inflar `es.ts` con ~60 párrafos.

### 2.3 Nuevo componente: `app/frontend/src/wizard/TipBanner.tsx`

Especificación (~45 líneas):

```
Props: { slug: StepId }
Comportamiento:
  - Lee CONSEJOS[slug].banner y bannerDetalle.
  - Botón "Leer más / Leer menos" si existe bannerDetalle.
  - Botón X (descartar): guarda `ct.tipbanner.{slug}` = "1" en localStorage.
    Al volver a la etapa, si está descartado, se muestra colapsado como una
    línea fina ("💡 Consejo Romuald — mostrar") que permite reabrirlo.
    NUNCA desaparece del todo: la filosofía debe poder recuperarse.
Estilo:
  - Reutiliza el patrón de StepGenerico L32: `card` con
    `border-left: 3px solid var(--accent-gold)` y fondo `--bg-overlay`.
  - Icono lucide `Zap` (NO emoji — regla de oro #7 del kit; los emojis
    de los banners de la Biblia se omiten, el icono los sustituye).
  - Texto: --text-secondary; el nombre "Romuald" o la cita entre comillas
    en --text-primary y peso 600.
data-testid:
  - Contenedor: `tip-banner-{slug}`
  - Botón descartar: `tip-banner-dismiss-{slug}`
  - Botón reabrir: `tip-banner-reopen-{slug}`
  - Botón leer más: `tip-banner-more-{slug}`
```

**Integración** en `app/frontend/src/routes/VideoWizard.tsx`: una sola línea, entre `.wizard-titlebar` (L146) y `<CuerpoEtapa>` (L148):

```tsx
<TipBanner slug={step.slug} />
```

Con esto las 10 etapas quedan cubiertas sin tocar ningún Step*.tsx.

### 2.4 Modificación CSS: tooltip apto para textos largos

En `app/frontend/src/styles/components.css` (bloque `[data-tip]`, líneas ~471–496):

```css
/* ANTES */  max-width: 280px;
/* DESPUÉS */ max-width: 360px;  /* los consejos Romuald tienen 2–4 frases */
```

Y añadir variante para tooltips anclados a la izquierda (los ítems de checklist están pegados al borde y el tooltip centrado se saldría de pantalla):

```css
[data-tip][data-tip-pos="left"]:hover::after,
[data-tip][data-tip-pos="left"]:focus-visible::after {
  left: 0;
  transform: none;
}
```

### 2.5 Nuevo helper: `LabelConTip` en `app/frontend/src/wizard/fields.tsx`

Generaliza el patrón ya existente en `StepGuion.tsx` L42–44:

```tsx
import { Info } from "lucide-react";

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

> Nota: `StepGuion.tsx` usa el carácter "ⓘ" como icono; al crear `LabelConTip` con `<Info/>` de lucide, **migrar también StepGuion** al helper para unificar (los textos de sus `data-tip` actuales se REEMPLAZAN por los de la Biblia, ver §3.5).

### 2.6 Modificación: `app/frontend/src/wizard/Checklist.tsx`

Hoy los ítems automáticos llevan un `data-tip` genérico ("Se marca solo cuando…", L32). Cambio:

```tsx
import { CONSEJOS } from "./consejos";
// dentro del map (L25):
const tipRomuald = CONSEJOS[step.slug]?.checks[item.key];
// en el <label> (L31-33):
<label
  className={esAuto ? "auto" : ""}
  data-tip={tipRomuald ?? (esAuto ? "Se marca solo cuando el dato correspondiente está completo" : undefined)}
  data-tip-pos="left"
>
```

Y añadir un `<Info size={12}/>` junto al texto cuando exista `tipRomuald`, para que el usuario sepa que hay consejo (descubribilidad). El candado `<Lock/>` de los autos se mantiene.

### 2.7 Modificación: `app/frontend/src/wizard/ContextPanel.tsx`

Dos bloques nuevos (ver §5 para el glosario):

```
1. Bloque "El consejo de Romuald" (PRIMERO, antes de "Del curso"):
   icono Zap + CONSEJOS[step.slug].banner + bannerDetalle completo.
   Razón: si el usuario descartó el TipBanner, el consejo sigue accesible
   desde el botón flotante de "Ayuda contextual" (LifeBuoy).
   data-testid: `context-consejo-romuald`

2. Bloque "Glosario Romuald" (ÚLTIMO, plegado por defecto con <details>):
   lista GLOSARIO_ROMUALD como <dl> término/definición.
   data-testid: `context-glosario-romuald`
```

### 2.8 Modificación: `app/frontend/src/wizard/config.ts` — 2 checks nuevos

```ts
// Etapa 6 · grabacion — insertar tras "iluminacion-verificada" (L137):
{ key: "energia-camara", texto: "Roturas de energía planificadas (cambios de intensidad)" },

// Etapa 9 · sprint — insertar como PRIMER ítem (antes de "email-enviado", L215):
{ key: "sin-cambios-24h", texto: "Día 1 · Sin tocar miniatura, título ni descripción durante 24h" },
```

Ambos son checks **manuales** (sin `auto`), así que no requieren cambios en `types.ts` ni en el backend (`checklistEstado` ya es `Record<string, Record<string, boolean>>` y el backend lo persiste tal cual). El progreso global se recalcula solo (`stepProgress`/`globalProgress`).

> ⚠️ Si hay tests E2E que cuenten ítems de checklist (revisar `app/backend/tests/videos.test.mjs` y smoke), actualizar los conteos: Etapa 6 pasa de 7 → 8 ítems; Etapa 9 de 10 → 11.

---

## 3. MAPEO ETAPA POR ETAPA

Convenciones de las tablas:
- **Destino** = archivo + elemento concreto donde se ancla el consejo.
- **Mecanismo** = `TipBanner` · `data-tip` (tooltip hover) · `field-hint` (visible) · `texto-existente` (se reemplaza un texto ya presente).
- **Clave** = ruta en `consejos.ts` (Apéndice A contiene el texto literal).

### 3.1 ETAPA 1 — IDEA (`wizard/steps/StepIdea.tsx`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner de etapa ("Si no hay competencia…") | `VideoWizard.tsx` vía TipBanner | TipBanner | `idea.banner` |
| Tooltip `tituloIdea` | Label "¿Sobre qué va tu próximo vídeo?" (L22) → `LabelConTip` | data-tip | `idea.campos.tituloIdea` |
| Tooltip `descripcionCorta` (Brief) | Label "Cuéntalo en 2–3 frases" (L38) → `LabelConTip` | data-tip | `idea.campos.descripcionCorta` |
| Tooltip tipo **evergreen** | Radio-card `field-tipo-evergreen` (array `TIPOS` L5–9) | data-tip en el botón | `idea.campos.tipoEvergreen` |
| Tooltip tipo **sprint** | Radio-card `field-tipo-sprint` | data-tip en el botón | `idea.campos.tipoSprint` |
| Tooltip tipo **mixto** | Radio-card `field-tipo-mixto` | data-tip en el botón | `idea.campos.tipoMixto` |
| Tooltip `nicho` | Label "Nicho" (L90) → `LabelConTip` | data-tip | `idea.campos.nicho` |
| Check `idea-validada-3-fuentes` (método triple) | `Checklist.tsx` lookup automático | data-tip | `idea.checks["idea-validada-3-fuentes"]` |

**Notas de implementación**:
- Los radio-cards ya tienen una descripción corta (`d` en `TIPOS`). NO sustituirla: la descripción corta queda como está y el consejo Romuald va en `data-tip` del botón (hover = profundidad).
- El `data-tip` actual del label "Tipo de vídeo" (L53, "Sprint vive de los 7 primeros días…") **se elimina**: queda redundante con los tooltips por tarjeta.

### 3.2 ETAPA 2 — INVESTIGACIÓN (`wizard/steps/StepInvestigacion.tsx`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner ("No busques lo que te gusta…") | TipBanner | TipBanner | `investigacion.banner` |
| Tooltip `palabrasClave` | Label "Palabras clave (máx 15)" (L10) → `LabelConTip` | data-tip | `investigacion.campos.palabrasClave` |
| Tooltip `seoPreguntas` | Label "Preguntas que responde el vídeo" (L21) → `LabelConTip` | data-tip | `investigacion.campos.seoPreguntas` |
| Tooltip `competenciaRefs` | Label "Vídeos de la competencia" (L55) → `LabelConTip` | data-tip | `investigacion.campos.competenciaRefs` |
| Check `angulo-diferencial-definido` | `Checklist.tsx` lookup | data-tip | `investigacion.checks["angulo-diferencial-definido"]` |
| Check `demanda-validada` | `Checklist.tsx` lookup | data-tip | `investigacion.checks["demanda-validada"]` (reutiliza el método triple de E1, ver Apéndice A) |

Los labels son `<span className="label">` (no `<label>`): `LabelConTip` debe aceptar renderizar `span` cuando no haya `htmlFor` (o usar un prop `as`).

### 3.3 ETAPA 3 — TÍTULO (`wizard/steps/StepTitulo.tsx`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner (Pescaseo: miniatura llama, título convence…) | TipBanner | TipBanner | `titulo.banner` |
| Tooltip `tituloFinal` | Label "Título final" (L22) → `LabelConTip` | data-tip | `titulo.campos.tituloFinal` |
| Tooltip "palabraClaveTitulo" ⚠️ | **El campo no existe como tal.** Se ancla en DOS sitios: (a) check `palabra-clave-incluida` del checklist; (b) el indicador verde `kw "…"` (L41–46) recibe `data-tip` | data-tip | `titulo.campos.palabraClave` |
| Tooltip `hashtags.titulo` | Label "Hashtag en el título (máx 1, opcional)" (L117) → `LabelConTip`. El `field-hint` actual (L132 "Si lo usas, irá al final…") se MANTIENE | data-tip | `titulo.campos.hashtagTitulo` |
| Tooltip botón "Generar 9 títulos con IA" | `AiBlock` etiqueta (L82). Envolver el área del botón con `data-tip` O añadir prop opcional `tip` a `AiBlock.tsx` (preferido: prop `tip`, así sirve para todas las etapas con IA) | data-tip | `titulo.campos.generarIA` |
| Check `longitud-optima` ⚠️ | `Checklist.tsx` lookup. **Ver §4.2**: la Biblia contradice el check actual (≤60 chars) | data-tip | `titulo.checks["longitud-optima"]` |
| Check `hashtag-titulo-decidido` | `Checklist.tsx` lookup | data-tip | `titulo.checks["hashtag-titulo-decidido"]` |

### 3.4 ETAPA 4 — MINIATURA (`wizard/steps/StepMiniatura.tsx`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner ("Alto contraste, pocas palabras, máxima intriga") | TipBanner | TipBanner | `miniatura.banner` |
| Tooltip estrategia **SEOmarco** | Chip `field-miniatura-estrategia-seomarco` (L47–57) | data-tip en el chip | `miniatura.campos.estrategiaSeomarco` |
| Tooltip estrategia **SEOcara** | Chip `field-miniatura-estrategia-seocara` | data-tip en el chip | `miniatura.campos.estrategiaSeocara` |
| Tooltip estrategia **SEOflecha** | Chip `field-miniatura-estrategia-seoflecha` | data-tip en el chip | `miniatura.campos.estrategiaSeoflecha` |
| Tooltip `palabrasMiniatura` | Label "Palabras impresas (3–5)" (L63) → `LabelConTip` | data-tip | `miniatura.campos.palabrasMiniatura` |
| Check `test-grilla-superado` | `Checklist.tsx` lookup. BONUS: añadir el mismo `data-tip` al botón `btn-simular-grilla` (L174), que es la herramienta que ejecuta este test | data-tip | `miniatura.checks["test-grilla-superado"]` |
| Consejo test A/B (SEO Swap) | Check `alternativa-ab-creada` | data-tip | `miniatura.checks["alternativa-ab-creada"]` |

**Nota**: el `field-hint` actual de estrategias (L59 "SEOmarco = borde llamativo · …") se MANTIENE como resumen visible; los tooltips por chip añaden la profundidad Romuald.

### 3.5 ETAPA 5 — GUION (`wizard/steps/StepGuion.tsx`)

Esta etapa **ya tiene** tooltips (`CAMPOS_SEO[].tip`, L10–16, y cliffhanger L211). La acción es **REEMPLAZAR** los textos cortos actuales por los textos Romuald, conservando las referencias al curso `(s9_aX)` al final de cada texto (son enlaces conceptuales valiosos para el usuario).

| Consejo Biblia | Destino | Acción | Clave |
|---|---|---|---|
| Banner (estructura obligatoria "Entrar a matar") | TipBanner | TipBanner | `guion.banner` |
| Tooltip `seoShock` | `CAMPOS_SEO[0].tip` (L11) | REEMPLAZAR texto, conservar "(s9_a3)" | `guion.campos.seoShock` |
| Tooltip `seoInicio` | `CAMPOS_SEO[1].tip` (L12) | REEMPLAZAR, conservar "(s9_a2)" | `guion.campos.seoInicio` |
| Tooltip `seoLoop` | `CAMPOS_SEO[2].tip` (L13) | REEMPLAZAR, conservar "(s9_a4)" | `guion.campos.seoLoop` |
| Tooltip `roturaPatron` | Chip "Rotura de patrón" de cada bloque (L156–172) | data-tip en el chip (también en chips SEOreset/SEOzoom usando los textos de E7, ver Apéndice A) | `guion.campos.roturaPatron` |
| Tooltip `seoResultado` | `CAMPOS_SEO[3].tip` (L14) | REEMPLAZAR, conservar "(s9_a8)" | `guion.campos.seoResultado` |
| Tooltip `psicoCta` | `CAMPOS_SEO[4].tip` (L15) | REEMPLAZAR, conservar "(s9_a9)" | `guion.campos.psicoCta` |
| Tooltip `cliffhanger` | data-tip del label (L211) | REEMPLAZAR, conservar "(s9_a10)" | `guion.campos.cliffhanger` |
| Tooltip contador `Σ M:SS` | El `<span>` del contador (L91–93) | data-tip + cursor help | `guion.campos.duracionEstimada` |

**Refactor recomendado**: en lugar de mantener los textos dentro de `CAMPOS_SEO`, importar `CONSEJOS.guion.campos` y construir `CAMPOS_SEO` con `tip: CONSEJOS.guion.campos[k]`. Así StepGuion deja de tener textos hardcodeados y respeta la fuente única.

### 3.6 ETAPA 6 — GRABACIÓN (`StepGenerico.tsx` con `labelNotas="Notas de producción"`)

Esta etapa no tiene campos propios: su cuerpo es el guion plegable + notas + checklist. Todo el peso recae en TipBanner y checklist.

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner ("El mejor equipo es el que tienes") | TipBanner | TipBanner | `grabacion.banner` |
| Consejo general de producción ("para empezar basta un móvil…") | TipBanner desplegable | `bannerDetalle` (botón "Leer más") | `grabacion.bannerDetalle` |
| Check `audio-verificado` | `Checklist.tsx` lookup | data-tip | `grabacion.checks["audio-verificado"]` |
| Check `broll-grabado` | `Checklist.tsx` lookup | data-tip | `grabacion.checks["broll-grabado"]` |
| Check `energia-camara` 🆕 | **Crear ítem en `config.ts`** (§2.8) + lookup | data-tip | `grabacion.checks["energia-camara"]` |

### 3.7 ETAPA 7 — EDICIÓN (`StepGenerico.tsx` con `recordatoriosEdicion`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner (SEOTE: recorta guiado por datos) | TipBanner | TipBanner | `edicion.banner` |
| Consejo principal de edición (curva de retención) | TipBanner desplegable | `bannerDetalle` | `edicion.bannerDetalle` |
| Check `roturas-patron-aplicadas` | `Checklist.tsx` lookup | data-tip | `edicion.checks["roturas-patron-aplicadas"]` |
| Check `seozoom-aplicado` | `Checklist.tsx` lookup | data-tip | `edicion.checks["seozoom-aplicado"]` |
| Check `seoreset-aplicado` | `Checklist.tsx` lookup | data-tip | `edicion.checks["seoreset-aplicado"]` |
| Check `subtitulos-revisados` | `Checklist.tsx` lookup | data-tip | `edicion.checks["subtitulos-revisados"]` |
| Check `ultimo-frame-reservado` | `Checklist.tsx` lookup | data-tip | `edicion.checks["ultimo-frame-reservado"]` |

**BONUS**: la card "Tu guion pide:" (`StepGenerico.tsx` L31–40) puede cerrar con una línea: *"Ejecuta cada rotura marcada: el cerebro necesita el cambio para seguir atento."* (clave `edicion.campos.tuGuionPide`, opcional).

### 3.8 ETAPA 8 — PUBLICACIÓN (`wizard/steps/StepPublicacion.tsx`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner ("La publicación no es el final — es el disparo de salida del sprint") | TipBanner | TipBanner | `publicacion.banner` |
| Tooltip `descripcion` | Label del textarea `field-descripcion-publicada` → `LabelConTip` | data-tip | `publicacion.campos.descripcion` |
| Tooltip hashtags descripción | Label del editor de hashtags (ChipsEditor) → `LabelConTip` | data-tip | `publicacion.campos.hashtagsDescripcion` |
| Tooltip `timestamps` | Label de la sección de capítulos (junto a `timestamps-add`) → `LabelConTip` | data-tip | `publicacion.campos.timestamps` |
| Tooltip pantallas finales + tarjetas | Labels de ambas secciones (`pantallas-add`, `tarjetas-add`) → `LabelConTip` (mismo texto en ambas: habla de las dos) | data-tip | `publicacion.campos.pantallasYTarjetas` |
| Tooltip horario (SEOhora) | Labels de `field-seohora-dia` / `field-seohora-hora` + check `seohora-elegida` | data-tip (ambos) | `publicacion.campos.seoHora` |
| Tooltip `comentarioFijado` | Label de `field-comentario-fijado` → `LabelConTip` | data-tip | `publicacion.campos.comentarioFijado` |

### 3.9 ETAPA 9 — SPRINT (`wizard/steps/StepSprint.tsx`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner ("El sprint no es pasivo. Día 1: publica → espera 24h…") | TipBanner | TipBanner | `sprint.banner` |
| Tooltip concepto sprint (boost de 7 días) | DOS destinos: (a) `bannerDetalle`; (b) el `EmptyState` previo a publicar (L26–28): AMPLIAR su `desc` con este texto | bannerDetalle + texto-existente | `sprint.bannerDetalle` |
| Check `sin-cambios-24h` 🆕 (acciones-dia1) | **Crear ítem en `config.ts`** (§2.8) + lookup | data-tip | `sprint.checks["sin-cambios-24h"]` |
| Tooltip `postComunidad` | Label del check-row `field-difusion-comunidad` (L76–86) | data-tip en el `<label class="check-row">` | `sprint.campos.postComunidad` |
| Tooltip `emailMarketing` | Label del check-row `field-difusion-email` (L67–75) | data-tip | `sprint.campos.emailMarketing` |
| Tooltip panel métricas sprint | Botón `sprint-add-snapshot` (L49) y/o cabecera `sprint-head` | data-tip | `sprint.campos.metricasSprint` |
| Tooltip SEO Swap (la Biblia lo llama "seorepesca" ⚠️ §4.1) | Check `ctr-evaluado` ("CTR evaluado — ¿cambio de miniatura?") | data-tip | `sprint.checks["ctr-evaluado"]` |
| Check `seorepesca-publicada` | `Checklist.tsx` lookup — texto del post de comunidad de rescate (significado de la APP, ver §4.1) | data-tip | `sprint.checks["seorepesca-publicada"]` |

### 3.10 ETAPA 10 — EVERGREEN (`wizard/steps/StepEvergreen.tsx`)

| Consejo Biblia | Destino | Mecanismo | Clave |
|---|---|---|---|
| Banner ("El evergreen es tu patrimonio") | TipBanner | TipBanner | `evergreen.banner` |
| Consejo general ("a partir del día 30, modo patrimonio…") | `bannerDetalle` + AMPLIAR el `banner-aviso` existente (L36–38) que hoy solo dice "Este módulo brilla a partir del día 30" | bannerDetalle | `evergreen.bannerDetalle` |
| Check análisis retención 30d | Checks `snapshot-dia30` y `analisis-retencion-hecho` (mismo texto en ambos) | data-tip | `evergreen.checks["analisis-retencion-hecho"]` |
| Check cambio miniatura/título | Checks `decision-miniatura` y `decision-titulo` (mismo texto) | data-tip | `evergreen.checks["decision-miniatura"]` |
| Tooltip tarjetas entrantes | Check `tarjetas-entrantes-anadidas` | data-tip | `evergreen.checks["tarjetas-entrantes-anadidas"]` |
| Consejo decisión de archivar | Botón `btn-archivar` (data-tip) + cuerpo del `Modal` de confirmación (`confirm-archivar`): añadir el texto como párrafo del modal | data-tip + texto en modal | `evergreen.campos.archivar` |

---

## 4. ⚠️ CONFLICTOS DE NOMENCLATURA DETECTADOS (resolver ANTES de implementar)

### 4.1 "SEOrepesca": dos significados distintos

- **En la app** (estrategias.ts L20, plantilla `tpl_comunidad_seorepesca`, check `seorepesca-publicada`): SEOrepesca = **post de comunidad** para repescar audiencia (familia "comunidad").
- **En la Biblia (mensaje 2, Etapa 9)**: "SEOrepesca = SEO Swap de emergencia" (cambiar miniatura+título tras 24h malas).

**Resolución adoptada en esta guía**: la app conserva su significado (post de comunidad). El concepto de "cambio de emergencia de miniatura/título" se denomina **SEO Swap** en todos los textos nuevos (coherente con el glosario del Bloque L, donde "SEO Swap" tiene entrada propia). El texto de la Biblia para "seorepesca (emergencia)" se asigna al check `ctr-evaluado` bajo el nombre SEO Swap. → Ya aplicado en el Apéndice A.

### 4.2 Check `longitud-optima` (≤60 caracteres) vs. Biblia

- El check automático actual (config.ts L73) valida `tituloFinal.length <= 60`.
- La Biblia (mensaje 1) decía "60 caracteres o menos", pero la versión refinada (mensaje 2) dice "**sin número mágico de caracteres**".

**Resolución**: NO tocar la lógica del check (el límite de 60 sigue siendo una buena guía operativa y es un check automático ya testeado). El tooltip usa el texto refinado, que matiza sin contradecir: el check sigue midiendo 60, el consejo explica el porqué real (escaneo en móvil). → Aplicado en Apéndice A.

### 4.3 Frecuencia de roturas de patrón: "cada 2 min" vs "cada 1.5–3 min"

El mensaje 1 decía "cada 2 min" en el banner de guion; el mensaje 2 dice "cada 1.5–3 min" de forma consistente. **Se adopta "cada 1.5–3 min"** en todos los textos.

### 4.4 Mención al "Big Beast" en el tooltip del botón de IA

La Biblia menciona "el Big Beast (GPT entrenado con sus transcripciones)", herramienta externa de Romuald. La app genera títulos con OpenRouter, no con el Big Beast. **Resolución**: el tooltip del botón omite la mención al Big Beast para no confundir (la frase sobre brainstorming múltiple se conserva íntegra). Si en el futuro se quiere enlazar al Big Beast, hacerlo como recurso del curso, no como tooltip del botón.

---

## 5. GLOSARIO ROMUALD (Bloque L)

### 5.1 Contenido (va en `GLOSARIO_ROMUALD` dentro de `consejos.ts`)

| Término | Significado |
|---|---|
| Furiosos y furiosas del marketing | Así llama Romuald a su audiencia |
| Entrar a matar | El gancho inicial de los primeros 10 segundos |
| SEO cerdo | Aprovechar todo el contenido al máximo, sin desperdiciar nada |
| Pescaseo | La combinación estratégica de miniatura + título para pescar clics |
| Cadenas de reproducción | Serie de vídeos conectados para maximizar tiempo de sesión |
| Ennicharse | Especializarse en un nicho muy específico |
| SEO Swap | Cambiar miniatura y título de emergencia cuando las métricas fallan |
| SEOTE | Recorte de un vídeo ya publicado desde YouTube Studio, sin re-subirlo |
| Patrimonio | Los vídeos evergreen que generan ingresos pasivos constantes |

### 5.2 Integración en la UI

1. **ContextPanel** (§2.7): bloque `<details>` "Glosario Romuald" al final del panel. Accesible desde cualquier etapa con el FAB "Ayuda contextual". Es la integración principal.
2. **NO mezclar** con `ESTRATEGIAS_CATALOGO` (estrategias.ts): ese catálogo son *tags operativos* del proyecto (se marcan como aplicados en Etapa 10); el glosario es *vocabulario*. Mantener separados evita romper los chips de StepEvergreen.
3. **Opcional (Fase 3)**: dentro de los textos de consejos, los términos del glosario que aparezcan (Pescaseo, SEO Swap, SEOTE…) ya van explicados en contexto, no requieren enlace.

---

## 6. GUÍA DE TONO (para CUALQUIER texto futuro de la app)

Reglas extraídas del Bloque L. Aplican a tooltips, banners, toasts, EmptyStates y prompts de IA:

1. **Frases cortas. Imperativo directo. Sin florituras.** ("Graba ya." / "No esperes más.")
2. Cada tooltip suena como **Romuald hablándote al oído**, no como un manual técnico.
3. **Datos concretos siempre que existan**: "CTR por encima del 5-7%", "cada 1.5-3 minutos", "el 80% de las visualizaciones vienen de móvil".
4. Tono de **mentor que ya lo hizo**, no de experto teórico. Primera persona implícita, cero condescendencia.
5. **Validar con consecuencias reales**: "Si no haces esto, pierdes el sprint." / "Si fallas aquí, nada de lo demás importa."
6. Analogías y casos reales cuando ayuden (Hollywood, MrBeast, "enseñar a pescar"), nunca teoría sin ejemplo.

**Checklist de revisión de un texto nuevo** (pasar antes de mergear):
- [ ] ¿Alguna frase supera las ~20 palabras? → córtala en dos.
- [ ] ¿Hay un verbo en imperativo en las 2 primeras frases?
- [ ] ¿Incluye un dato, un ejemplo o una consecuencia?
- [ ] ¿Suena a manual ("se recomienda", "es importante considerar")? → reescribir.

### 6.1 Fase 4 (opcional): tono Romuald en los generadores IA

Archivo: `app/backend/src/prompts.js`. Añadir a los system prompts de los generadores (`titulo`, `hook`, `seo_preguntas`, `miniatura_brief`, `descripcion`, `comunidad`, `analisis_retencion`) un preámbulo de tono:

```
Escribe siguiendo la metodología CRECETUBE de Romuald Fons: frases cortas,
imperativo directo, copywriting de curiosidad o miedo, loops abiertos.
Términos propios que puedes usar: Pescaseo (miniatura+título), SEO Swap,
SEOTE, cadena de reproducción, "entrar a matar". Nunca des teoría sin un
ejemplo concreto. Valida con consecuencias: qué se pierde si no se hace.
```

Y reglas específicas por generador:
- `titulo`: "Genera 9 opciones con ángulos distintos. Integra la palabra clave principal al inicio cuando sea posible. Mayúsculas selectivas en la palabra de la emoción clave. Nada de clickbait vacío: el título promete lo que el vídeo cumple."
- `hook`: "Estructura: SEOshock (promesa potente 0-10s), SEOinicio (confirmación), SEOloop (promesa diferida)."
- `descripcion`: "Las 2 primeras líneas: palabra clave + gancho emocional. Enlaces después del fold."
- `comunidad`: "Encuesta o post que envíe tráfico activo al vídeo el día 1."
- `analisis_retencion`: "Señala caídas bruscas y recomienda SEOTE o SEO Swap con umbrales (CTR <5% tras 24h = SEO Swap)."

⚠️ Esta fase SÍ toca backend: ejecutar `app/backend/tests/ia-metricas.test.mjs` tras el cambio. Los tests de IA suelen mockear la respuesta, pero verificar que ningún test asserta el contenido exacto del prompt.

---

## 7. PLAN DE IMPLEMENTACIÓN POR FASES

> Cada fase deja la app 100% funcional. No empezar una fase sin cerrar la anterior. Corresponden a las tareas T008–T011 del Apéndice B.

### FASE 1 — Núcleo de la capa de consejos (complejidad: media)
**Archivos**: `consejos.ts` (nuevo), `TipBanner.tsx` (nuevo), `VideoWizard.tsx` (+1 línea), `components.css` (tooltip 360px + variante left), `wizard.css` (estilos `.tip-banner`).
1. Crear `consejos.ts` pegando el Apéndice A completo.
2. Crear `TipBanner.tsx` según §2.3.
3. Integrar en `VideoWizard.tsx` (§2.3).
4. CSS (§2.4 + estilos del banner).
**Resultado visible**: las 10 etapas muestran su banner Romuald, descartable y persistente.
**Test**: `npm test` (typecheck+build) + abrir wizard, descartar banner en Idea, recargar, comprobar que sigue colapsado y reabrible.

### FASE 2 — Tooltips de campos y checklist (complejidad: alta — toca 10 archivos)
**Archivos**: `fields.tsx` (`LabelConTip`), `Checklist.tsx`, `config.ts` (2 checks nuevos), `AiBlock.tsx` (prop `tip` opcional), y los 9 Step*.tsx.
1. `LabelConTip` en `fields.tsx` (§2.5).
2. `Checklist.tsx`: lookup de tips por `item.key` (§2.6).
3. `config.ts`: checks `energia-camara` y `sin-cambios-24h` (§2.8). Revisar conteos en tests.
4. Etapa por etapa, aplicar las tablas §3.1–§3.10. Orden recomendado: Idea → Investigación → Título → Miniatura → Guion (refactor `CAMPOS_SEO`) → Publicación → Sprint → Evergreen. (Grabación/Edición no tocan Step propio: ya quedaron cubiertas en el paso 2-3.)
**Test**: `npm test` + pasada manual con hover en cada ⓘ de las 10 etapas.

### FASE 3 — ContextPanel: consejo permanente + glosario (complejidad: baja)
**Archivos**: `ContextPanel.tsx`, `wizard.css`.
1. Bloque "El consejo de Romuald" (primero) con banner + detalle (§2.7).
2. Bloque "Glosario Romuald" (`<details>` plegado) con `GLOSARIO_ROMUALD` (§5).
**Test**: abrir FAB de ayuda en 2–3 etapas distintas y verificar que el consejo cambia por etapa y el glosario lista los 9 términos.

### FASE 4 (OPCIONAL) — Tono Romuald en la IA (complejidad: media, toca backend)
**Archivos**: `app/backend/src/prompts.js`.
Según §6.1. **Test**: `npm test` completo + generar un título con IA real (requiere API key de OpenRouter) y validar el tono.

---

## 8. `data-testid` NUEVOS

| Elemento | data-testid |
|---|---|
| Banner de etapa | `tip-banner-{slug}` (ej. `tip-banner-idea`) |
| Botón descartar banner | `tip-banner-dismiss-{slug}` |
| Botón reabrir banner | `tip-banner-reopen-{slug}` |
| Botón "Leer más" del banner | `tip-banner-more-{slug}` |
| Bloque consejo en ContextPanel | `context-consejo-romuald` |
| Bloque glosario en ContextPanel | `context-glosario-romuald` |
| Check nuevo Etapa 6 | `checklist-grabacion-energia-camara` (lo genera Checklist.tsx automáticamente) |
| Check nuevo Etapa 9 | `checklist-sprint-sin-cambios-24h` (automático) |

Los tooltips `data-tip` no necesitan testid propio: se testean vía el atributo (`expect(locator).to_have_attribute("data-tip", ...)`).

---

## 9. VERIFICACIÓN Y CRITERIOS DE ACEPTACIÓN

### 9.1 Automáticos (tras CADA fase)
```bash
npm test                 # tests backend + tsc + build frontend
bash scripts/init.sh     # harness completo
node scripts/smoke.mjs   # smoke del backend
```

### 9.2 Manuales (al cerrar Fase 2)
- [ ] Las 10 etapas muestran TipBanner con el texto correcto (cotejar contra Apéndice A).
- [ ] Descartar un banner lo colapsa; recargar la página lo mantiene colapsado; se puede reabrir.
- [ ] Hover sobre cada ⓘ muestra el tooltip completo, legible, sin desbordar la pantalla (revisar especialmente los checks del checklist, pegados al borde → `data-tip-pos="left"`).
- [ ] Los 3 radio-cards de Idea y los 3 chips de estrategia de Miniatura tienen tooltip.
- [ ] El checklist de Grabación tiene 8 ítems y el de Sprint 11 (con los 2 nuevos manuales).
- [ ] Los checks nuevos se marcan/desmarcan y persisten tras recargar (autosave de `checklistEstado`).
- [ ] El progreso global no se rompe (sigue entre 0–100%).
- [ ] Ningún texto de la app usa emojis (los 🏷️🖼️📝… de la Biblia se sustituyen por el icono `Zap`/`Info` de lucide — regla de oro #7).
- [ ] StepGuion ya no tiene textos de tooltip hardcodeados (importa de `consejos.ts`).

### 9.3 Criterio de "hecho"
La capa está terminada cuando un usuario puede recorrer las 10 etapas y, sin salir del wizard, recibir TODA la metodología Romuald: filosofía (banner), táctica por campo (tooltips), método por tarea (tips de checklist) y vocabulario (glosario).

---

---

# APÉNDICE A — `consejos.ts` COMPLETO (textos literales)

> Pegar como `app/frontend/src/wizard/consejos.ts`. Los textos provienen de la Biblia Crecetube; donde había dos versiones se usó la refinada (ver §4). NO editar los textos sin pasar el checklist de tono (§6).

```ts
// consejos.ts — Biblia Crecetube (metodología Romuald Fons).
// ÚNICA fuente de verdad de la capa de consejos. NO editar textos sin revisar
// la guía de tono (GUIA_MAESTRA_IMPLEMENTACION.md §6).
import type { StepId } from "../types";

export interface ConsejosEtapa {
  banner: string;
  bannerDetalle?: string;
  campos: Record<string, string>;
  checks: Record<string, string>;
}

export const CONSEJOS: Record<StepId, ConsejosEtapa> = {
  idea: {
    banner:
      "Romuald dice: 'Si no hay competencia en tu tema, es una señal de peligro.' La competencia valida que hay mercado. Busca el hueco dentro del mercado, no un mercado sin nadie.",
    campos: {
      tituloIdea:
        "¿Hay gente buscando esto? Antes de escribir nada, comprueba el autocompletar de YouTube. Si aparece la búsqueda sola, hay demanda real.",
      descripcionCorta:
        "No grabes lo que tú quieres, graba lo que tu audiencia necesita. Este brief debe responder: ¿qué problema resuelve? ¿quién lo busca?",
      tipoEvergreen:
        "Evergreen es patrimonio. Un vídeo evergreen bien posicionado genera visitas y dinero constante aunque no subas nada en semanas.",
      tipoSprint:
        "Sprint = vídeo de tendencia. Vive en los primeros 7 días. Si solo haces sprints, te conviertes en esclavo de la actualidad.",
      tipoMixto:
        "Lo ideal: estructura de cadena donde evergreens generan base estable y sprints aprovechan picos de tráfico.",
      nicho:
        "Cuanto más específico el nicho, menor la competencia y mayor el RPM de anunciantes. 'Gaming' es demasiado amplio. 'Trucos para subir de rango en Valorant' es un nicho.",
    },
    checks: {
      "idea-validada-3-fuentes":
        "Método de validación triple de Romuald: 1) YouTube Autocomplete — ¿aparece sola la búsqueda? 2) Google Keyword Planner — ¿hay anunciantes pujando? 3) Analiza resultados actuales — ¿hay huecos que nadie cubre bien?",
    },
  },

  investigacion: {
    banner:
      "Romuald sobre la investigación: 'No busques lo que te gusta, busca lo que la gente ya está buscando y no encuentra bien respondido.' El hueco de mercado es tu oportunidad.",
    campos: {
      palabrasClave:
        "Prioriza keywords de cola larga al empezar. 'Cómo ganar dinero en YouTube siendo pequeño' posiciona más fácil que 'ganar dinero YouTube'.",
      seoPreguntas:
        "Estas preguntas son el esqueleto del guion. Si el vídeo responde exactamente lo que el usuario buscó, la retención sube automáticamente.",
      competenciaRefs:
        "Analiza la competencia con ViewStats u otras herramientas. Busca lo que hacen todos y ejecuta algo radicalmente distinto. Eso es el ángulo diferencial.",
    },
    checks: {
      "angulo-diferencial-definido":
        "Ángulo diferencial = rotura de patrón conceptual. Pregúntate: ¿qué hace el 90% de los canales de mi nicho en sus miniaturas, títulos y estructuras? Haz lo opuesto o mejóralo radicalmente.",
      "demanda-validada":
        "Validación triple: 1) YouTube Autocomplete — ¿aparece sola la búsqueda? 2) Google Keyword Planner — ¿hay anunciantes pujando? 3) ¿Hay huecos que nadie cubre bien en los resultados actuales?",
    },
  },

  titulo: {
    banner:
      "Método de título Romuald — Pescaseo: la miniatura llama la atención, el título convence de hacer clic. Juntos cuentan una historia, pero ninguno la completa. Usa copywriting de curiosidad o miedo. Genera múltiples opciones antes de elegir.",
    campos: {
      tituloFinal:
        "El título debe integrar la palabra clave principal Y generar un loop abierto de curiosidad. El usuario debe pensar: 'Tengo que ver esto.' Miniatura y título no se repiten — cuentan juntos una historia incompleta (Pescaseo).",
      palabraClave:
        "La palabra clave principal es el factor SEO más importante en YouTube. Ponla al principio si puedes. Luego añade variantes long tail: más específico = menos competencia = más fácil de posicionar.",
      hashtagTitulo:
        "Romuald advierte: los hashtags en el título son puntos de fuga. El usuario puede hacer clic en el hashtag y salir de tu vídeo antes de verlo. Úsalos solo si tienen un propósito SEO muy claro.",
      generarIA:
        "Romuald insiste en el brainstorming múltiple — igual que los grandes periódicos. El primer título raramente es el mejor. Genera al menos 3 opciones optimizadas y elige la que genere más curiosidad.",
    },
    checks: {
      "longitud-optima":
        "Sin número mágico de caracteres, pero cada palabra debe ganarse su sitio. En móvil los títulos largos se cortan. Usa mayúsculas selectivas en la palabra que dispara la emoción clave para facilitar el escaneo visual.",
      "palabra-clave-incluida":
        "La palabra clave principal es el factor SEO más importante en YouTube. Ponla al principio si puedes. Más específico = menos competencia = más fácil de posicionar.",
      "hashtag-titulo-decidido":
        "Pregúntate: ¿este hashtag ayuda al SEO o es un punto de fuga? Si no tienes una respuesta clara, no lo pongas.",
    },
  },

  miniatura: {
    banner:
      "Romuald sobre miniaturas: 'Alto contraste, pocas palabras, máxima intriga.' La función no es que sea bonita, sino que rompa el patrón visual del feed. El objetivo es hacer IMPOSIBLE no hacer clic.",
    campos: {
      estrategiaSeomarco:
        "Marco de color llamativo = destácate en el feed. El cerebro detecta contornos antes que contenido. Un borde brillante en un feed neutro llama la atención automáticamente. Alto contraste es la prioridad número uno.",
      estrategiaSeocara:
        "Rostro humano con expresión exagerada = conexión emocional instantánea. Los ojos deben mirar hacia el texto para dirigir la atención del espectador. El 40-60% de la miniatura debería ser cara. Expresiones de sorpresa, miedo o entusiasmo disparan el CTR.",
      estrategiaSeoflecha:
        "La flecha o dedo señalador guía la mirada exactamente donde tú quieres — hacia el texto clave o el elemento principal. Sin dirección visual, el ojo no sabe dónde ir y la miniatura pierde impacto.",
      palabrasMiniatura:
        "Pocas palabras que generen intriga, no que expliquen. Ejemplos de Romuald: 'Soy rico', 'La verdad'. Si la miniatura lo explica todo, el usuario no necesita ver el vídeo.",
    },
    checks: {
      "test-grilla-superado":
        "La prueba decisiva: ¿tu miniatura funciona a tamaño móvil? El 80% de las visualizaciones vienen de móvil, donde las miniaturas son pequeñas y el botón de suscribirse puede tapar parte de la imagen. Si no impacta en pequeño, falla donde más importa.",
      "alternativa-ab-creada":
        "SEO Swap: si tras 24h el vídeo tiene métricas malas (flechas rojas en YouTube Studio), cambia miniatura y título por versiones más agresivas. No esperes más. YouTube te da una segunda oportunidad en tiempo real — aprovéchala.",
    },
  },

  guion: {
    banner:
      "Estructura obligatoria Romuald — 'Entrar a matar': SEOshock (0-10s) → SEOinicio (confirmación) → SEOloop (promesa diferida) → Desarrollo con roturas de patrón cada 1.5-3 min → SEOresultado → CTA psicológica win-win → Cliffhanger. Sin esta estructura, la retención cae.",
    campos: {
      seoShock:
        "Entrar a matar. Los primeros 10 segundos son todo. Haz una promesa directa y potente de lo que el espectador va a aprender. Si fallas aquí, nada de lo demás importa. (s9_a3)",
      seoInicio:
        "Confirma al usuario que está en el lugar correcto: su tiempo será bien invertido. Reduce la ansiedad de 'me equivoqué de vídeo' que aparece en los primeros 30 segundos. (s9_a2)",
      seoLoop:
        "Loop abierto = no revelar la información más valiosa al principio, sino PROMETER que llegará. 'Al final del vídeo te cuento el truco que lo cambió todo' — el cerebro necesita cerrar ese bucle. (s9_a4)",
      roturaPatron:
        "Cada 1.5 a 3 minutos. Cambio brusco visual, sonoro o emocional para 'limpiar' la atención. Sin roturas de patrón el cerebro entra en modo pasivo y el usuario sale.",
      seoResultado:
        "Cumple la promesa inicial del vídeo — el espectador que llegó hasta aquí la merece. Y justo después, no te despidas: enlaza con el siguiente vídeo para continuar la cadena de sesión. El final no es un punto de fuga, es el inicio de una nueva visualización. (s9_a8)",
      psicoCta:
        "La CTA de Romuald es win-win. No pidas la suscripción vacía. Ofrece algo de valor: 'Si quieres saber X, suscríbete porque la semana que viene…' El usuario actúa cuando recibe algo a cambio. (s9_a9)",
      cliffhanger:
        "Enseña algo valioso pero incompleto. El usuario debe necesitar el siguiente vídeo para cerrar el bucle. Así se construyen cadenas de reproducción y sesiones largas. (s9_a10)",
      duracionEstimada:
        "No existe duración ideal. Un vídeo de 2 horas con buena retención genera más tiempo de sesión que uno de 10 minutos que aburre. Si puedes hacer una masterclass que mantenga al usuario enganchado, YouTube la promocionará agresivamente.",
    },
    checks: {},
  },

  grabacion: {
    banner:
      "Consejo Romuald: 'El mejor equipo es el que tienes.' La producción debe centrarse en lo que la audiencia necesita escuchar, no en lo que el creador quiere decir. Graba ya. Los datos te dirán si necesitas mejorar.",
    bannerDetalle:
      "Romuald es claro: para empezar basta un móvil. El error típico es perder meses buscando el setup perfecto antes de tener datos reales. El contenido y la intención de búsqueda valen más que cualquier cámara.",
    campos: {},
    checks: {
      "audio-verificado":
        "El audio malo destruye retención más que la imagen mala. El espectador perdona una imagen mediocre, pero no soporta audio con eco o ruido. Es la inversión técnica que más impacto tiene en retención.",
      "broll-grabado":
        "El broll es tu herramienta de rotura de patrón en edición. Evita que la imagen sea estática para que el cerebro del usuario no entre en modo pasivo. Si no lo grabas ahora, no podrás usarlo después. Graba más de lo que crees necesitar.",
      "energia-camara":
        "Las roturas de patrón también son de energía: cambios de intensidad emocional, bromas, movimientos de cámara. El cerebro necesita estos cambios cada 1.5-3 minutos para seguir atento. Planifícalos antes de grabar.",
    },
  },

  edicion: {
    banner:
      "SEOTE: si detectas una caída brusca en la curva de retención, puedes recortar ese trozo del vídeo ya publicado desde YouTube Studio sin re-subirlo. Edita guiado por datos, no por cariño al contenido grabado.",
    bannerDetalle:
      "La edición de Romuald se basa en la curva de retención de Analytics. Abre YouTube Analytics, mira dónde cae la curva y corta esos fragmentos. La edición perfecta no existe antes de ver los datos. Elimina todo lo que no aporte retención: si un bloque no engancha, córtalo sin piedad.",
    campos: {
      tuGuionPide:
        "Ejecuta cada rotura marcada en el guion: el cerebro necesita el cambio para seguir atento.",
    },
    checks: {
      "roturas-patron-aplicadas":
        "El guion marcó dónde van las roturas. En edición, ejecútalas: corte brusco, cambio de plano, zoom, efecto sonoro, gráfico. El cerebro necesita el cambio para seguir atento — como el cine de acción de Hollywood.",
      "seozoom-aplicado":
        "SEOzoom = acercamiento brusco de cámara para enfatizar un mensaje clave y romper la monotonía visual. Úsalo en los momentos de mayor información para que el usuario no entre en modo pasivo.",
      "seoreset-aplicado":
        "SEOreset = cualquier elemento visual o sonoro que 'limpie' la atención y prepare para el siguiente bloque. Puede ser un corte a negro, una transición, música, un gráfico en pantalla. El objetivo es resetear la concentración.",
      "subtitulos-revisados":
        "Los subtítulos amplían el alcance a audiencias de otros idiomas, especialmente en vídeos con mucha carga visual. Romuald los considera herramienta de expansión de alcance, no solo de accesibilidad.",
      "ultimo-frame-reservado":
        "El último frame es donde YouTube coloca las pantallas finales. Déjalo libre y limpio — es tu espacio de conversión hacia el siguiente eslabón de la cadena. Un cliffhanger verbal justo antes multiplica el porcentaje de clics.",
    },
  },

  publicacion: {
    banner:
      "La publicación no es el final — es el disparo de salida del sprint. Todo lo que configures aquí (descripción, timestamps, pantallas finales, comentario fijado) debe estar al servicio de una sola cosa: que el usuario no abandone tu ecosistema de contenido.",
    campos: {
      descripcion:
        "Las dos primeras líneas son críticas: YouTube las muestra en los resultados de búsqueda antes del 'mostrar más'. Deben incluir la palabra clave principal y un gancho emocional. Los enlaces externos van siempre después del fold — antes son puntos de fuga.",
      hashtagsDescripcion:
        "Cuidado con los hashtags — son puntos de fuga. Úsalos con criterio, no por cantidad. Pocos y relevantes al nicho. Si el usuario hace clic en un hashtag y sale de tu contenido, pierdes tiempo de sesión.",
      timestamps:
        "Los capítulos mejoran la indexación en Google (aparecen como secciones en los resultados de búsqueda) y la experiencia del usuario. Romuald los recomienda: son SEO externo gratuito.",
      pantallasYTarjetas:
        "Configuración óptima según Romuald: 3 elementos — vídeo sugerido por YouTube, vídeo siguiente de tu serie y botón de suscripción. Las tarjetas también pueden ser puntos de fuga — úsalas para conectar vídeos de la misma cadena, no para salir del ecosistema.",
      seoHora:
        "Publica una hora antes del pico máximo de visualización de tu canal — ese dato está en YouTube Analytics → Audiencia. No hay una hora universal; la tuya depende de dónde está tu audiencia.",
      comentarioFijado:
        "El comentario fijado es una herramienta potente de cadena de reproducción. Úsalo para enlazar al siguiente vídeo de la serie con un gancho: '¿Quieres saber qué pasó después? Aquí te lo cuento.' Fuerza la cadena desde el propio hilo de comentarios.",
    },
    checks: {
      "seohora-elegida":
        "Publica una hora antes del pico máximo de visualización de tu canal (YouTube Analytics → Audiencia). No hay una hora universal; la tuya depende de dónde está tu audiencia.",
    },
  },

  sprint: {
    banner:
      "El sprint no es pasivo. Día 1: publica → espera 24h sin tocar nada → mira métricas → si flechas rojas, ejecuta SEO Swap. Usa comunidad y email para inyectar tráfico de calidad. YouTube premia el impulso inicial — dáselo tú primero.",
    bannerDetalle:
      "Los primeros 7 días son críticos porque YouTube da una exposición aumentada (boost) para recabar datos de CTR y retención. Es la ventana donde el algoritmo decide si tu vídeo merece ser recomendado. Todo lo que hagas en estos 7 días multiplica su impacto.",
    campos: {
      postComunidad:
        "Usa la pestaña de comunidad para lanzar encuestas relacionadas con el tema del vídeo el mismo día de publicación. Genera conversación y envía tráfico activo al vídeo en su momento más crítico.",
      emailMarketing:
        "El email marketing es el arma secreta del sprint. Enviar tráfico externo de calidad (suscriptores que ya te conocen) en las primeras horas hace que YouTube detecte un interés inusualmente alto y amplifique la distribución del vídeo.",
      metricasSprint:
        "Las dos métricas clave durante el sprint: CTR (porcentaje de clics sobre impresiones) y velocidad de visualización. Un CTR por encima del 5-7% es buena señal. Flechas rojas tras 24h = ejecutar SEO Swap inmediatamente.",
    },
    checks: {
      "sin-cambios-24h":
        "Regla de Romuald: durante las primeras 24h NO cambies nada — miniatura, título ni descripción. El sistema de notificaciones necesita ese tiempo para distribuirse. Si cambias antes, desvirtúas los datos del boost inicial.",
      "ctr-evaluado":
        "SEO Swap de emergencia: si el vídeo falla en sus primeras 24h (métricas con flechas rojas), cambia completamente miniatura y título por versiones más agresivas hasta que el tráfico en tiempo real suba. No esperes más de 24h para actuar.",
      "seorepesca-publicada":
        "SEOrepesca: post de comunidad para repescar a la audiencia que aún no ha visto el vídeo. Lánzalo el día 3, cuando el empuje inicial afloja — reactiva la conversación y envía una segunda ola de tráfico.",
    },
  },

  evergreen: {
    banner:
      "El evergreen es tu patrimonio. Cada vídeo bien posicionado es un activo que trabaja por ti sin que publiques nada nuevo. La estrategia Romuald: construir una base sólida de evergreens que empujen el tráfico hacia los sprints más recientes.",
    bannerDetalle:
      "A partir del día 30, el vídeo entra en modo patrimonio. Si tiene el 'ingrediente analítico' adecuado (retención y CTR decentes), puedes reactivarlo modificando metadatos. Los vídeos evergreen bien posicionados generan ingresos y visitas constantes aunque no subas nada en semanas.",
    campos: {
      archivar:
        "Si un vídeo tiene retención muy baja, CTR pésimo Y el tema ya no es relevante, considera archivarlo. Pero antes prueba un SEO Swap. Un vídeo con pocas visitas pero buena retención tiene potencial — trabájalo antes de tirarlo.",
    },
    checks: {
      "snapshot-dia30":
        "Abre la curva de retención en YouTube Analytics. Busca las caídas bruscas — ahí está el problema. Si hay un bloque que pierde el 30% de la audiencia, puedes recortarlo con SEOTE (el editor de YouTube permite cortar fragmentos de vídeos ya publicados).",
      "analisis-retencion-hecho":
        "Abre la curva de retención en YouTube Analytics. Busca las caídas bruscas — ahí está el problema. Si hay un bloque que pierde el 30% de la audiencia, puedes recortarlo con SEOTE sin re-subir el vídeo.",
      "decision-miniatura":
        "Cambia miniatura o título de un vídeo antiguo solo si: a) el CTR ha bajado mucho y el vídeo sigue teniendo tráfico de búsqueda, o b) quieres reactivar un vídeo estancado. Haz una versión más agresiva y dale 48h para ver si el CTR sube.",
      "decision-titulo":
        "Cambia miniatura o título de un vídeo antiguo solo si: a) el CTR ha bajado mucho y el vídeo sigue teniendo tráfico de búsqueda, o b) quieres reactivar un vídeo estancado. Haz una versión más agresiva y dale 48h para ver si el CTR sube.",
      "tarjetas-entrantes-anadidas":
        "Estrategia clave de Romuald: usa tarjetas en tus vídeos evergreen con mucho tráfico para enviar usuarios hacia tus nuevos lanzamientos en fase de sprint. El patrimonio evergreen actúa como un 'empujador' de tráfico para el contenido nuevo.",
    },
  },
};

export const GLOSARIO_ROMUALD: Array<{ termino: string; significado: string }> = [
  { termino: "Furiosos y furiosas del marketing", significado: "Así llama Romuald a su audiencia." },
  { termino: "Entrar a matar", significado: "El gancho inicial de los primeros 10 segundos." },
  { termino: "SEO cerdo", significado: "Aprovechar todo el contenido al máximo, sin desperdiciar nada." },
  { termino: "Pescaseo", significado: "La combinación estratégica de miniatura + título para pescar clics." },
  { termino: "Cadenas de reproducción", significado: "Serie de vídeos conectados para maximizar tiempo de sesión." },
  { termino: "Ennicharse", significado: "Especializarse en un nicho muy específico." },
  { termino: "SEO Swap", significado: "Cambiar miniatura y título de emergencia cuando las métricas fallan." },
  { termino: "SEOTE", significado: "Recorte de un vídeo ya publicado desde YouTube Studio, sin re-subirlo." },
  { termino: "Patrimonio", significado: "Los vídeos evergreen que generan ingresos pasivos constantes." },
];
```

---

# APÉNDICE B — TAREAS PARA `TASKS.json`

> Añadir al array `tareas` y actualizar `resumen` (total +4, pendientes +4).

```json
[
  {
    "id": "T008",
    "titulo": "Capa Consejos Romuald — Fase 1: núcleo (consejos.ts + TipBanner)",
    "descripcion": "Crear app/frontend/src/wizard/consejos.ts (catálogo completo, Apéndice A de GUIA_MAESTRA_IMPLEMENTACION.md) y TipBanner.tsx (banner descartable con localStorage). Integrar en VideoWizard.tsx bajo la titlebar. CSS: max-width de [data-tip] a 360px + variante data-tip-pos=left + estilos .tip-banner con --accent-gold.",
    "fase": "desarrollo",
    "prioridad": "alta",
    "estado": "pendiente",
    "depende_de": null,
    "tokens_estimados": "medio",
    "complejidad": "media",
    "resultado": null
  },
  {
    "id": "T009",
    "titulo": "Capa Consejos Romuald — Fase 2: tooltips de campos y checklist",
    "descripcion": "LabelConTip en fields.tsx; Checklist.tsx con lookup CONSEJOS[slug].checks[key]; config.ts +2 checks (energia-camara en grabacion, sin-cambios-24h en sprint); prop tip opcional en AiBlock; aplicar mapeo §3.1-§3.10 de la guía en los 9 Step*.tsx (StepGuion: refactor CAMPOS_SEO para importar textos de consejos.ts). Revisar conteos de checklist en tests.",
    "fase": "desarrollo",
    "prioridad": "alta",
    "estado": "pendiente",
    "depende_de": "T008",
    "tokens_estimados": "alto",
    "complejidad": "alta",
    "resultado": null
  },
  {
    "id": "T010",
    "titulo": "Capa Consejos Romuald — Fase 3: ContextPanel (consejo permanente + glosario)",
    "descripcion": "ContextPanel.tsx: bloque 'El consejo de Romuald' (primero, banner+detalle de la etapa actual) y bloque <details> 'Glosario Romuald' (GLOSARIO_ROMUALD, 9 términos). data-testid: context-consejo-romuald, context-glosario-romuald.",
    "fase": "desarrollo",
    "prioridad": "media",
    "estado": "pendiente",
    "depende_de": "T009",
    "tokens_estimados": "bajo",
    "complejidad": "baja",
    "resultado": null
  },
  {
    "id": "T011",
    "titulo": "Capa Consejos Romuald — Fase 4 (opcional): tono en generadores IA",
    "descripcion": "app/backend/src/prompts.js: preámbulo de tono Romuald (frases cortas, imperativo, loops, términos propios) + reglas por generador según §6.1 de la guía. Verificar ia-metricas.test.mjs.",
    "fase": "desarrollo",
    "prioridad": "baja",
    "estado": "pendiente",
    "depende_de": "T010",
    "tokens_estimados": "medio",
    "complejidad": "media",
    "resultado": null
  }
]
```

---

# APÉNDICE C — PROMPTS PARA CLAUDE CODE (uno por fase)

### Prompt Fase 1 (T008)
```
Lee GUIA_MAESTRA_IMPLEMENTACION.md §2.2, §2.3, §2.4 y el Apéndice A.
Tarea T008: crea app/frontend/src/wizard/consejos.ts copiando EXACTAMENTE el
Apéndice A. Crea app/frontend/src/wizard/TipBanner.tsx según la spec §2.3
(descartable con localStorage clave ct.tipbanner.{slug}, reabrible, icono Zap
de lucide, borde izquierdo --accent-gold, data-testids tip-banner-*).
Intégralo en VideoWizard.tsx entre .wizard-titlebar y CuerpoEtapa.
En components.css: [data-tip] max-width 280px → 360px y añade la variante
[data-tip-pos="left"]. Añade estilos .tip-banner en wizard.css siguiendo los
tokens existentes. NO toques ninguna otra lógica. Verifica con npm test.
```

### Prompt Fase 2 (T009)
```
Lee GUIA_MAESTRA_IMPLEMENTACION.md §2.5-§2.8 y §3 completo (tablas de mapeo).
Tarea T009: (1) añade LabelConTip a fields.tsx; (2) modifica Checklist.tsx
para que cada ítem muestre el tooltip CONSEJOS[step.slug].checks[item.key]
con data-tip-pos="left" e icono Info cuando exista; (3) añade en config.ts
los checks manuales 'energia-camara' (grabacion, tras iluminacion-verificada)
y 'sin-cambios-24h' (sprint, primer ítem); (4) añade prop opcional tip a
AiBlock.tsx; (5) aplica las tablas §3.1-§3.10 etapa por etapa: tooltips en
labels/chips/radio-cards usando los textos de consejos.ts. En StepGuion.tsx
refactoriza CAMPOS_SEO para que los tips se importen de consejos.ts.
REGLAS: no cambies lógica de guardado ni checks automáticos; conserva todos
los data-testid existentes; revisa que ningún test cuente ítems de checklist
(grabacion 7→8, sprint 10→11). Verifica con npm test y bash scripts/init.sh.
```

### Prompt Fase 3 (T010)
```
Lee GUIA_MAESTRA_IMPLEMENTACION.md §2.7 y §5.
Tarea T010: en ContextPanel.tsx añade como PRIMER bloque "El consejo de
Romuald" (icono Zap, CONSEJOS[step.slug].banner + bannerDetalle,
data-testid context-consejo-romuald) y como ÚLTIMO bloque un <details>
plegado "Glosario Romuald" con GLOSARIO_ROMUALD en un <dl>
(data-testid context-glosario-romuald). Estilos coherentes con .context-block.
Verifica con npm test.
```

### Prompt Fase 4 (T011, opcional)
```
Lee GUIA_MAESTRA_IMPLEMENTACION.md §6 y §6.1.
Tarea T011: en app/backend/src/prompts.js añade el preámbulo de tono Romuald
a todos los generadores y las reglas específicas por generador (§6.1).
No cambies el formato JSON de salida esperado por el frontend ni las firmas
de funciones. Ejecuta los tests de app/backend/tests/ (especialmente
ia-metricas.test.mjs) y npm test completo.
```

---

*Fin de la guía. Cualquier texto nuevo que se añada a la app debe pasar el checklist de tono de §6 antes de mergear.*
