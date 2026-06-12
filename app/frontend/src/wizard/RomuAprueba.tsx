// RomuAprueba (T020) — sello de evaluación IA por etapa del wizard.
// Un único punto de integración (como TipBanner): VideoWizard lo monta bajo la checklist.
// La IA contrasta los datos introducidos en la etapa con las reglas del método (CONSEJOS).
import { BadgeCheck, AlertTriangle, Check, X } from "lucide-react";
import { AiBlock } from "./AiBlock";
import { CONSEJOS } from "./consejos";
import { isItemDone, stepBySlug } from "./config";
import { es } from "../i18n/es";
import type { StepId, VideoProject } from "../types";

interface PuntoRomu {
  aspecto: string;
  ok: boolean;
  comentario: string | null;
}

interface ResultadoRomu {
  veredicto: "aprobado" | "ajustar";
  puntuacion: number;
  puntos: PuntoRomu[];
  resumen: string | null;
}

const corta = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : null);

/** Estado de la checklist de la etapa (manuales + automáticos) en formato evaluable. */
function resumenChecklist(v: VideoProject, slug: StepId): Array<{ tarea: string; hecha: boolean }> {
  const step = stepBySlug(slug);
  if (!step) return [];
  return step.checklist.map((i) => ({ tarea: i.texto, hecha: isItemDone(v, step, i) }));
}

/** Mapa etapa→campos evaluables del VideoProject. null = etapa sin datos evaluables (no se monta). */
function datosDeEtapa(slug: StepId, v: VideoProject): Record<string, unknown> | null {
  switch (slug) {
    case "idea":
      return {
        tituloIdea: v.tituloIdea,
        tipo: v.tipo,
        formato: v.formato,
        brief: corta(v.descripcionCorta, 600),
        nicho: v.nicho,
      };
    case "investigacion":
      return {
        palabrasClave: v.palabrasClave,
        seoPreguntas: v.seoPreguntas,
        competencia: v.competenciaRefs.map((c) => ({ url: c.url, notas: corta(c.notas, 200) })),
      };
    case "titulo":
      return {
        tituloFinal: v.tituloFinal,
        longitudTituloFinal: v.tituloFinal?.length ?? 0,
        titulosAlternativos: v.titulosAlternativos,
        palabrasClave: v.palabrasClave,
        hashtagsEnTitulo: v.hashtags.titulo,
      };
    case "miniatura":
      return {
        estrategia: v.miniatura.estrategia,
        palabrasMiniatura: v.miniatura.palabrasMiniatura,
        brief: corta(v.miniatura.briefIA, 800),
        miniaturaSubida: Boolean(v.miniatura.urlPrincipal),
        variantesAB: v.miniatura.urlsAlternativas.length,
      };
    case "guion":
      return {
        seoShock: corta(v.guion.seoShock, 500),
        seoInicio: corta(v.guion.seoInicio, 500),
        seoLoop: corta(v.guion.seoLoop, 500),
        bloquesDesarrollo: v.guion.desarrollo.map((b) => ({
          titulo: b.titulo,
          duracionSegundos: b.duracionSegundos,
          roturaPatron: b.roturaPatron,
          seoReset: b.seoReset,
          seoZoom: b.seoZoom,
        })),
        seoResultado: corta(v.guion.seoResultado, 500),
        psicoCta: corta(v.guion.psicoCta, 500),
        cliffhanger: corta(v.guion.cliffhanger, 300),
        duracionTotalEstimadaSeg: v.guion.duracionTotalEstimadaSeg,
      };
    case "publicacion":
      return {
        descripcion: corta(v.descripcionPublicada, 1200),
        hashtagsDescripcion: v.hashtags.descripcion,
        timestamps: v.timestamps,
        listaReproduccion: v.listaReproduccionNombre,
        comentarioFijado: corta(v.comentarioFijado, 400),
        pantallasFinales: v.pantallasFinales.elementos.map((e) => e.tipo),
        numTarjetas: v.tarjetas.length,
        seoHora: v.seoHora,
      };
    case "sprint":
      return {
        emailEnviado: v.difusion.emailEnviado,
        postComunidad: { enviado: v.difusion.postComunidad.enviado, tipo: v.difusion.postComunidad.tipo },
        redesCompartido: v.difusion.redesCompartido,
      };
    case "evergreen":
      return {
        snapshotsRegistrados: v.metricasIds.length,
      };
    default:
      // grabacion y edicion (StepGenerico): sin datos evaluables más allá de la checklist manual
      return null;
  }
}

/** Reglas del método para la etapa: textos de la capa de consejos (banner + campos + checks). */
function reglasDeEtapa(slug: StepId): string[] {
  const c = CONSEJOS[slug];
  const reglas = [c.banner];
  if (c.bannerDetalle) reglas.push(c.bannerDetalle);
  reglas.push(...Object.values(c.campos), ...Object.values(c.checks));
  return reglas;
}

export function RomuAprueba({ slug, video }: { slug: StepId; video: VideoProject }) {
  const datos = datosDeEtapa(slug, video);
  if (!datos) return null;

  return (
    <div className="romu-aprueba" data-testid="romu-aprueba-block">
      <AiBlock
        tipo="romu_aprueba"
        videoProjectId={video.id}
        etiqueta={es.romu.etiqueta}
        tip={es.romu.tip}
        opciones={{
          etapaNombre: es.wizard.etapas[slug] ?? slug,
          etapaProposito: es.romu.proposito[slug] ?? null,
          datosEtapa: { ...datos, checklist: resumenChecklist(video, slug) },
          reglas: reglasDeEtapa(slug),
        }}
        render={(resultados, parseFallido) => {
          if (parseFallido || !resultados.length) {
            return (
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{es.romu.parseFallido}</p>
            );
          }
          const r = resultados[0] as ResultadoRomu;
          const aprobado = r.veredicto === "aprobado";
          return (
            <div
              className={`romu-sello ${aprobado ? "romu-sello-ok" : "romu-sello-ajustar"}`}
              data-testid="romu-aprueba-veredicto"
              data-veredicto={r.veredicto}
            >
              <div className="romu-sello-head">
                {aprobado ? <BadgeCheck size={20} /> : <AlertTriangle size={20} />}
                <strong className="romu-sello-titulo">{aprobado ? es.romu.aprobado : es.romu.ajustar}</strong>
                <span className="romu-sello-nota">{r.puntuacion}/10</span>
              </div>
              {r.puntos.length > 0 && (
                <ul className="romu-puntos">
                  {r.puntos.map((p, i) => (
                    <li key={i} className={p.ok ? "ok" : "ko"} data-testid={`romu-punto-${i}`}>
                      {p.ok ? <Check size={14} /> : <X size={14} />}
                      <span>
                        <strong>{p.aspecto}</strong>
                        {p.comentario ? ` — ${p.comentario}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {r.resumen && <p className="romu-resumen">{r.resumen}</p>}
            </div>
          );
        }}
      />
    </div>
  );
}
