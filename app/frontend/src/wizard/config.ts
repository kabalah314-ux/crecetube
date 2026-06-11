// config.ts — definición data-driven de las 10 etapas (02 §2.4). ÚNICA fuente de verdad
// del frontend para checklists, mapeo etapa↔estado, curso y plantillas relacionadas.
import type { StepId, VideoProject, VideoState } from "../types";

export interface ChecklistItemDef {
  key: string;
  texto: string;
  /** si existe, el item es "auto": derivado del estado del proyecto, no clicable */
  auto?: (v: VideoProject) => boolean;
}

export interface StepDef {
  slug: StepId;
  titulo: string;
  /** estado al que avanza el proyecto al ENTRAR en la etapa (02 §2.3.4); null = sin cambio */
  estadoAlEntrar: VideoState | null;
  curso: Array<{ id: string; titulo: string }>;
  plantillas: string[];
  ia: string | null;
  checklist: ChecklistItemDef[];
}

const noVacio = (s: string | null | undefined) => Boolean(s && s.trim().length > 0);

export const STEPS: StepDef[] = [
  {
    slug: "idea",
    titulo: "Idea",
    estadoAlEntrar: "idea",
    curso: [
      { id: "s3", titulo: "Estrategia de contenido" },
      { id: "s4", titulo: "Nichos y posicionamiento" },
    ],
    plantillas: [],
    ia: null,
    checklist: [
      { key: "titulo-trabajo-definido", texto: "Título de trabajo escrito", auto: (v) => noVacio(v.tituloIdea) },
      { key: "tipo-video-elegido", texto: "Tipo sprint/evergreen decidido", auto: (v) => Boolean(v.tipo) },
      { key: "formato-elegido", texto: "Formato del vídeo elegido", auto: (v) => Boolean(v.formato) },
      { key: "brief-redactado", texto: "Brief de 2–3 frases redactado", auto: (v) => v.descripcionCorta.length >= 30 },
      { key: "idea-validada-3-fuentes", texto: "Idea validada con el método de las 3 fuentes (s3_a3)" },
    ],
  },
  {
    slug: "investigacion",
    titulo: "Investigación",
    estadoAlEntrar: "investigacion",
    curso: [
      { id: "s4", titulo: "Nichos y posicionamiento" },
      { id: "s6", titulo: "Títulos irresistibles" },
      { id: "s19", titulo: "Analítica y métricas" },
    ],
    plantillas: [],
    ia: "seo_preguntas",
    checklist: [
      { key: "palabras-clave-anadidas", texto: "Al menos 3 palabras clave", auto: (v) => v.palabrasClave.length >= 3 },
      { key: "preguntas-seo-anadidas", texto: "Al menos 3 preguntas que responde el vídeo", auto: (v) => v.seoPreguntas.length >= 3 },
      { key: "competencia-analizada", texto: "2+ vídeos de la competencia anotados", auto: (v) => v.competenciaRefs.length >= 2 },
      { key: "demanda-validada", texto: "Demanda comprobada con herramienta externa" },
      { key: "angulo-diferencial-definido", texto: "Mi ángulo diferencial está claro" },
    ],
  },
  {
    slug: "titulo",
    titulo: "Título",
    estadoAlEntrar: "guion",
    curso: [{ id: "s6", titulo: "Títulos irresistibles" }],
    plantillas: [],
    ia: "titulo",
    checklist: [
      { key: "alternativas-generadas", texto: "3+ títulos alternativos sobre la mesa", auto: (v) => v.titulosAlternativos.length >= 3 },
      { key: "titulo-final-elegido", texto: "Título final elegido", auto: (v) => noVacio(v.tituloFinal) },
      { key: "longitud-optima", texto: "≤ 60 caracteres", auto: (v) => noVacio(v.tituloFinal) && v.tituloFinal!.length <= 60 },
      {
        key: "palabra-clave-incluida",
        texto: "Incluye una palabra clave de la etapa 2",
        auto: (v) =>
          noVacio(v.tituloFinal) &&
          v.palabrasClave.some((k) => v.tituloFinal!.toLowerCase().includes(k.toLowerCase())),
      },
      { key: "hashtag-titulo-decidido", texto: "Hashtag en título decidido (ponerlo o no)" },
    ],
  },
  {
    slug: "miniatura",
    titulo: "Miniatura",
    estadoAlEntrar: "guion",
    curso: [{ id: "s5", titulo: "Miniaturas que generan clics" }],
    plantillas: ["tpl_brief_miniatura_seomarco", "tpl_brief_miniatura_seocara", "tpl_brief_miniatura_seoflecha"],
    ia: "miniatura_brief",
    checklist: [
      { key: "estrategia-elegida", texto: "Estrategia visual elegida", auto: (v) => Boolean(v.miniatura.estrategia) },
      {
        key: "palabras-miniatura-definidas",
        texto: "3–5 palabras impresas definidas",
        auto: (v) => {
          const n = v.miniatura.palabrasMiniatura.trim().split(/\s+/).filter(Boolean).length;
          return n >= 1 && n <= 5;
        },
      },
      { key: "brief-creado", texto: "Brief para diseñar la miniatura listo", auto: (v) => noVacio(v.miniatura.briefIA) },
      { key: "miniatura-subida", texto: "Miniatura principal subida", auto: (v) => Boolean(v.miniatura.urlPrincipal) },
      { key: "alternativa-ab-creada", texto: "Variante para test A/B subida" },
      { key: "test-grilla-superado", texto: "Legible en grilla a 100px (test visual)" },
    ],
  },
  {
    slug: "guion",
    titulo: "Guion",
    estadoAlEntrar: "guion",
    curso: [{ id: "s9", titulo: "Guiones y estructura" }],
    plantillas: ["tpl_guion_completo"],
    ia: "hook",
    checklist: [
      { key: "seoinicio-escrito", texto: "SEOinicio (primeros 15–20s) escrito", auto: (v) => noVacio(v.guion.seoInicio) },
      { key: "seoshock-escrito", texto: "SEOshock (gancho fuerte) escrito", auto: (v) => noVacio(v.guion.seoShock) },
      { key: "seoloop-escrito", texto: "SEOloop (promesa diferida) escrito", auto: (v) => noVacio(v.guion.seoLoop) },
      { key: "desarrollo-estructurado", texto: "2+ bloques de desarrollo", auto: (v) => v.guion.desarrollo.length >= 2 },
      { key: "roturas-patron-colocadas", texto: "Al menos 1 rotura de patrón colocada", auto: (v) => v.guion.desarrollo.some((b) => b.roturaPatron) },
      { key: "seoresultado-escrito", texto: "SEOresultado (desenlace) escrito", auto: (v) => noVacio(v.guion.seoResultado) },
      { key: "psicocta-escrito", texto: "PsicoCTA escrito", auto: (v) => noVacio(v.guion.psicoCta) },
      { key: "cliffhanger-decidido", texto: "Cliffhanger decidido (ponerlo o no)" },
    ],
  },
  {
    slug: "grabacion",
    titulo: "Grabación",
    estadoAlEntrar: "grabacion",
    curso: [{ id: "s9", titulo: "Guiones — notas de producción" }],
    plantillas: [],
    ia: null,
    checklist: [
      { key: "lugar-preparado", texto: "Lugar/set preparado" },
      { key: "vestuario-decidido", texto: "Vestuario decidido" },
      { key: "broll-listado", texto: "Lista de b-roll necesaria escrita" },
      { key: "audio-verificado", texto: "Prueba de audio hecha (niveles OK)" },
      { key: "iluminacion-verificada", texto: "Iluminación montada y probada" },
      { key: "energia-camara", texto: "Roturas de energía planificadas (cambios de intensidad)" },
      { key: "material-grabado", texto: "Contenido principal grabado" },
      { key: "broll-grabado", texto: "B-roll grabado" },
    ],
  },
  {
    slug: "edicion",
    titulo: "Edición",
    estadoAlEntrar: "edicion",
    curso: [
      { id: "s12", titulo: "Shorts y reutilización" },
      { id: "s9", titulo: "Roturas de patrón" },
    ],
    plantillas: [],
    ia: null,
    checklist: [
      { key: "corte-general-hecho", texto: "Primer corte completo" },
      { key: "roturas-patron-aplicadas", texto: "Roturas de patrón del guion aplicadas" },
      { key: "seozoom-aplicado", texto: "SEOzoom en los conceptos clave" },
      { key: "seoreset-aplicado", texto: "SEOreset (mini-resúmenes) montados" },
      { key: "audio-normalizado", texto: "Audio normalizado (≈ -14 LUFS)" },
      { key: "subtitulos-revisados", texto: "Subtítulos generados y revisados" },
      { key: "ultimo-frame-reservado", texto: "Últimos 20s con espacio para pantallas finales" },
      { key: "render-exportado", texto: "Render final exportado en máxima calidad" },
    ],
  },
  {
    slug: "publicacion",
    titulo: "Publicación",
    estadoAlEntrar: null,
    curso: [
      { id: "s10", titulo: "Descripciones y metadatos" },
      { id: "s11", titulo: "Listas de reproducción" },
      { id: "s13", titulo: "Pantallas finales" },
      { id: "s14", titulo: "Tarjetas interactivas" },
    ],
    plantillas: [
      "tpl_descripcion_video",
      "tpl_comentario_fijado",
      "tpl_pantallas_finales",
      "tpl_tarjetas",
      "tpl_checklist_pre_publicacion",
      "tpl_seolista",
    ],
    ia: "descripcion",
    checklist: [
      { key: "descripcion-redactada", texto: "Descripción ≥100 chars con SEOextracto", auto: (v) => v.descripcionPublicada.length >= 100 },
      { key: "hashtags-completos", texto: "3 hashtags en descripción", auto: (v) => v.hashtags.descripcion.length >= 3 },
      { key: "timestamps-creados", texto: "Capítulos con 00:00 inicial", auto: (v) => v.timestamps.length > 0 && v.timestamps[0].tiempo === "00:00" },
      { key: "lista-asignada", texto: "Lista de reproducción asignada", auto: (v) => noVacio(v.listaReproduccionNombre) },
      { key: "comentario-fijado-redactado", texto: "Comentario fijado redactado", auto: (v) => noVacio(v.comentarioFijado) },
      { key: "pantallas-finales-configuradas", texto: "Pantallas finales planificadas", auto: (v) => v.pantallasFinales.elementos.length >= 1 },
      { key: "tarjetas-planificadas", texto: "Tarjetas planificadas", auto: (v) => v.tarjetas.length >= 1 },
      { key: "seohora-elegida", texto: "Día y hora de publicación elegidos", auto: (v) => v.seoHora.diaSemana !== null && noVacio(v.seoHora.horaPublicacion) },
      { key: "checklist-prepublicacion-repasada", texto: "Checklist pre-publicación repasada" },
      { key: "video-subido-youtube", texto: "Vídeo subido y programado en YouTube" },
    ],
  },
  {
    slug: "sprint",
    titulo: "Sprint",
    estadoAlEntrar: null,
    curso: [
      { id: "s15", titulo: "Comunidad y engagement" },
      { id: "s16", titulo: "Crossplatform" },
      { id: "s18", titulo: "Email marketing" },
    ],
    plantillas: [
      "tpl_email_nuevo_video",
      "tpl_comunidad_giftcalipsis",
      "tpl_comunidad_seoencuesta",
      "tpl_comunidad_seolaunch",
      "tpl_comunidad_seorepesca",
      "tpl_checklist_post_publicacion",
      "tpl_campana_ads",
    ],
    ia: "comunidad",
    checklist: [
      { key: "sin-cambios-24h", texto: "Día 1 · Sin tocar miniatura, título ni descripción durante 24h" },
      { key: "email-enviado", texto: "Día 1 · Email a la lista enviado", auto: (v) => v.difusion.emailEnviado },
      { key: "post-comunidad-publicado", texto: "Día 1 · Post de comunidad publicado", auto: (v) => v.difusion.postComunidad.enviado },
      {
        key: "redes-compartido",
        texto: "Día 1 · Compartido en redes",
        auto: (v) =>
          v.difusion.redesCompartido.instagram ||
          v.difusion.redesCompartido.twitter ||
          v.difusion.redesCompartido.tiktok ||
          v.difusion.redesCompartido.otros.length > 0,
      },
      { key: "comentarios-dia1-respondidos", texto: "Día 1 · Primeros 20 comentarios respondidos" },
      { key: "snapshot-dia2", texto: "Día 2 · Snapshot de métricas" },
      { key: "seorepesca-publicada", texto: "Día 3 · Post SEOrepesca publicado" },
      { key: "snapshot-dia4", texto: "Día 4–5 · Snapshot de métricas" },
      { key: "ctr-evaluado", texto: "Día 4–5 · CTR evaluado (¿cambio de miniatura?)" },
      { key: "snapshot-dia7", texto: "Día 6–7 · Snapshot final del sprint" },
      { key: "aprendizajes-anotados", texto: "Día 7 · Aprendizajes anotados en notas" },
    ],
  },
  {
    slug: "evergreen",
    titulo: "Evergreen",
    estadoAlEntrar: null,
    curso: [
      { id: "s3", titulo: "Optimización evergreen" },
      { id: "s19", titulo: "Analítica y métricas" },
      { id: "s17", titulo: "Monetización" },
    ],
    plantillas: ["tpl_panel_marca"],
    ia: "analisis_retencion",
    checklist: [
      { key: "snapshot-dia30", texto: "Snapshot del día 30 registrado" },
      { key: "analisis-retencion-hecho", texto: "Gráfica de retención analizada" },
      { key: "comparativa-canal-revisada", texto: "Comparado con la media del canal" },
      { key: "decision-miniatura", texto: "Decisión sobre cambiar miniatura tomada" },
      { key: "decision-titulo", texto: "Decisión sobre retocar título tomada" },
      { key: "listas-revisadas", texto: "Presencia en listas revisada" },
      { key: "tarjetas-entrantes-anadidas", texto: "Tarjetas hacia este vídeo desde otros" },
      { key: "seorepesca-evergreen", texto: "SEOrepesca de rescate valorada" },
      { key: "aprendizajes-evergreen", texto: "Conclusiones anotadas" },
    ],
  },
];

export const stepBySlug = (slug: string) => STEPS.find((s) => s.slug === slug);
export const stepIndex = (slug: string) => STEPS.findIndex((s) => s.slug === slug);

export function isItemDone(v: VideoProject, step: StepDef, item: ChecklistItemDef): boolean {
  if (item.auto) return item.auto(v);
  return v.checklistEstado[step.slug]?.[item.key] ?? false;
}

export function stepProgress(v: VideoProject, step: StepDef): { done: number; total: number } {
  const done = step.checklist.filter((i) => isItemDone(v, step, i)).length;
  return { done, total: step.checklist.length };
}

export function globalProgress(v: VideoProject): number {
  const ratios = STEPS.map((s) => {
    const { done, total } = stepProgress(v, s);
    return total ? done / total : 0;
  });
  return Math.round((ratios.reduce((a, b) => a + b, 0) / STEPS.length) * 100);
}

// Rango de etapas por estado (02 §2.3.5)
const RANGO: Record<string, [number, number]> = {
  idea: [0, 0],
  investigacion: [1, 1],
  guion: [2, 4],
  grabacion: [5, 5],
  edicion: [6, 6],
  publicado: [7, 8],
  optimizacion: [9, 9],
  archivado: [9, 9],
};

export function stepDeReanudacion(v: VideoProject): StepDef {
  const [ini, fin] = RANGO[v.estado] ?? [0, 9];
  for (let i = ini; i <= fin; i++) {
    const { done, total } = stepProgress(v, STEPS[i]);
    if (done < total) return STEPS[i];
  }
  return STEPS[fin];
}
