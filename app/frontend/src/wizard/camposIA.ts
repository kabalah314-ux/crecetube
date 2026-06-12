// camposIA — T024: registro frontend campoId → regla Romuald + modo del popover FieldIA.
// Las reglas del wizard salen de CONSEJOS (consejos.ts, ÚNICA fuente de verdad de la Biblia);
// viajan al backend en opciones.reglaCampo (mismo patrón que romu_aprueba con opciones.reglas).
import { REGLAS_CAMPO_VIABILIDAD } from "../routes/viabilidadReglas";
import { CONSEJOS } from "./consejos";

export type ModoFieldIA = "texto" | "lista" | "bloques";

export interface RegistroCampoIA {
  /** Regla Romuald que viaja al backend en opciones.reglaCampo */
  regla: string;
  /** Cómo pinta el popover las sugerencias */
  modo: ModoFieldIA;
}

export const CAMPOS_IA: Record<string, RegistroCampoIA> = {
  // ---------- Wizard ----------
  descripcionCorta: { regla: CONSEJOS.idea.campos.descripcionCorta, modo: "texto" },
  palabrasClave: { regla: CONSEJOS.investigacion.campos.palabrasClave, modo: "lista" },
  "guion.desarrollo": {
    // Estructura "entrar a matar" + roturas de patrón. El esqueleto se AÑADE al desarrollo, nunca lo reemplaza.
    regla: `${CONSEJOS.guion.banner} ${CONSEJOS.guion.campos.roturaPatron}`,
    modo: "bloques",
  },
  "guion.seoResultado": { regla: CONSEJOS.guion.campos.seoResultado, modo: "texto" },
  "guion.psicoCta": { regla: CONSEJOS.guion.campos.psicoCta, modo: "texto" },
  "guion.cliffhanger": { regla: CONSEJOS.guion.campos.cliffhanger, modo: "texto" },
  comentarioFijado: { regla: CONSEJOS.publicacion.campos.comentarioFijado, modo: "texto" },
  // Sin entrada propia en CONSEJOS.publicacion.campos → banner de la etapa (la SEOlista sirve a la cadena).
  listaReproduccionNombre: { regla: CONSEJOS.publicacion.banner, modo: "texto" },

  // ---------- Viabilidad (T025) ----------
  // Reglas unificadas con los TipViabilidad de la pantalla: viabilidadReglas.ts es la
  // única fuente de verdad (Viabilidad.tsx pinta los mismos textos; sin reglas espejo).
  "viabilidad.ideaCanal": { regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.ideaCanal"], modo: "texto" },
  "viabilidad.aQuienAyuda": { regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.aQuienAyuda"], modo: "texto" },
  "viabilidad.formatoPrevisto": { regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.formatoPrevisto"], modo: "texto" },
  "viabilidad.busquedasEncontradas": {
    regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.busquedasEncontradas"],
    modo: "texto",
  },
  "viabilidad.canalesReferencia": { regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.canalesReferencia"], modo: "texto" },
  "viabilidad.anguloReferencia": { regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.anguloReferencia"], modo: "texto" },
  "viabilidad.subNicho": { regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.subNicho"], modo: "texto" },
  "viabilidad.pvu": { regla: REGLAS_CAMPO_VIABILIDAD["viabilidad.pvu"], modo: "texto" },
};
