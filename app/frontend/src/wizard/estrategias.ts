// estrategias.ts — glosario de estrategias CRECETUBE con su familia (color 06 §6.2.3).
export const ESTRATEGIAS_CATALOGO: Array<{ tag: string; familia: string }> = [
  { tag: "SEOmarco", familia: "miniaturas" },
  { tag: "SEOcara", familia: "miniaturas" },
  { tag: "SEOflecha", familia: "miniaturas" },
  { tag: "SEOshock", familia: "video" },
  { tag: "SEOloop", familia: "video" },
  { tag: "SEOreset", familia: "video" },
  { tag: "SEOzoom", familia: "video" },
  { tag: "Cliffhanger", familia: "video" },
  { tag: "PsicoCTA", familia: "video" },
  { tag: "SEOextracto", familia: "descripcion" },
  { tag: "SEOhora", familia: "tematicas" },
  { tag: "SEOlista", familia: "listas" },
  { tag: "SEOTrailer", familia: "canal" },
  { tag: "SEOdestacado", familia: "canal" },
  { tag: "Giftcalipsis", familia: "comunidad" },
  { tag: "SEOencuesta", familia: "comunidad" },
  { tag: "SEOlaunch", familia: "comunidad" },
  { tag: "SEOrepesca", familia: "comunidad" },
  { tag: "SEOrteo", familia: "comunidad" },
  { tag: "Subjeta", familia: "tarjetas" },
  { tag: "Indujetas", familia: "tarjetas" },
  { tag: "Psicojetas", familia: "tarjetas" },
  { tag: "SEOjeta", familia: "tarjetas" },
  { tag: "SEOrescate", familia: "tarjetas" },
];

export const colorFamilia = (familia: string) => `var(--family-${familia})`;
