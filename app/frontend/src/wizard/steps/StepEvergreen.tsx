// Etapa 10 · evergreen (02 §2.4.10) — visitable siempre, brilla a partir del día 30.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Archive, Info } from "lucide-react";
import { AiBlock } from "../AiBlock";
import { Modal } from "../../components/ui/Modal";
import { ESTRATEGIAS_CATALOGO, colorFamilia } from "../estrategias";
import { CONSEJOS } from "../consejos";
import { useStore } from "../../store/useStore";
import type { StepProps } from "./types";
import type { VideoState } from "../../types";

export function StepEvergreen({
  video,
  patch,
  cambiarEstado,
}: StepProps & { cambiarEstado: (e: VideoState) => Promise<unknown> }) {
  const [datosPegados, setDatosPegados] = useState("");
  const [modalArchivar, setModalArchivar] = useState(false);
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);

  const dia = video.publishedAt ? Math.floor((Date.now() - new Date(video.publishedAt).getTime()) / 86400000) + 1 : null;

  const toggleEstrategia = (tag: string) => {
    const tiene = video.estrategiasAplicadas.includes(tag);
    patch({
      estrategiasAplicadas: tiene
        ? video.estrategiasAplicadas.filter((t) => t !== tag)
        : [...video.estrategiasAplicadas, tag],
    });
  };

  return (
    <>
      {dia !== null && dia < 30 && (
        <p className="banner-aviso" data-testid="evergreen-banner">
          <Info size={14} /> Este módulo brilla a partir del día 30. Hoy: día {dia}. {CONSEJOS.evergreen.bannerDetalle}
        </p>
      )}

      <div className="field">
        <span className="label">Estrategias aplicadas en este vídeo (glosario CRECETUBE)</span>
        <div className="chips">
          {ESTRATEGIAS_CATALOGO.map(({ tag, familia }) => {
            const activa = video.estrategiasAplicadas.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className="tag"
                style={{
                  ["--tag-color" as never]: colorFamilia(familia),
                  cursor: "pointer",
                  opacity: activa ? 1 : 0.45,
                  border: activa ? undefined : "1px dashed var(--border-strong)",
                }}
                aria-pressed={activa}
                data-testid={`estrategia-${tag.toLowerCase()}`}
                onClick={() => toggleEstrategia(tag)}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="f-datos-analytics">
          Pega aquí datos de YouTube Analytics para el análisis IA
        </label>
        <textarea
          id="f-datos-analytics"
          className="textarea"
          data-testid="field-datos-analytics"
          value={datosPegados}
          placeholder={"Ej:\nVistas 30 días: 12.400 · CTR: 4,2% · Retención media: 38% (3:12)\nPico de abandono: 0:45 · Fuente principal: Browse 61%"}
          onChange={(e) => setDatosPegados(e.target.value)}
        />
      </div>

      <AiBlock
        tipo="analisis_retencion"
        videoProjectId={video.id}
        etiqueta="Analizar métricas con IA"
        opciones={{ datosPegados }}
        disabledExtra={!datosPegados.trim() ? "Pega antes algunos datos" : null}
        render={(resultados) => {
          const r = resultados[0] as {
            resumen?: string;
            insights?: Array<{ hallazgo: string; accion: string; prioridad: "alta" | "media" | "baja" }>;
          };
          const color = { alta: "var(--accent-rust)", media: "var(--accent-gold)", baja: "var(--accent-mint)" };
          const orden = { alta: 0, media: 1, baja: 2 };
          const insights = [...(r?.insights ?? [])].sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
          const texto = `[Análisis IA · ${new Date().toLocaleDateString("es-ES")}]\n${r?.resumen ?? ""}\n${insights
            .map((i) => `- (${i.prioridad}) ${i.hallazgo} → ${i.accion}`)
            .join("\n")}`;
          return (
            <div className="ai-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
              {r?.resumen && <p>{r.resumen}</p>}
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {insights.map((ins, i) => (
                  <li key={i}>
                    <span className="tag" style={{ ["--tag-color" as never]: color[ins.prioridad] }}>
                      {ins.prioridad}
                    </span>{" "}
                    <strong>{ins.hallazgo}</strong> — {ins.accion}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: "flex-start" }}
                onClick={() => patch({ notas: video.notas ? `${video.notas}\n\n${texto}` : texto })}
              >
                <Sparkles size={14} /> Guardar en notas
              </button>
            </div>
          );
        }}
      />

      <div className="field" style={{ marginTop: "var(--space-5)" }}>
        <label className="label" htmlFor="f-notas-ev">
          Notas y aprendizajes
        </label>
        <textarea
          id="f-notas-ev"
          className="textarea"
          data-testid="field-notas"
          value={video.notas}
          onChange={(e) => patch({ notas: e.target.value })}
        />
      </div>

      {video.estado !== "archivado" && (
        <button type="button" className="btn btn-secondary" data-testid="btn-archivar" data-tip={CONSEJOS.evergreen.campos.archivar} onClick={() => setModalArchivar(true)}>
          <Archive size={16} /> Archivar proyecto
        </button>
      )}

      <Modal
        open={modalArchivar}
        onClose={() => setModalArchivar(false)}
        title="¿Archivar este proyecto?"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalArchivar(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              data-testid="confirm-archivar"
              onClick={async () => {
                await cambiarEstado("archivado");
                setModalArchivar(false);
                toast("success", "Proyecto archivado");
                navigate("/videos");
              }}
            >
              Archivar
            </button>
          </>
        }
      >
        <p>El vídeo pasa a estado “Archivado”. Podrás recuperarlo cambiando su estado en el detalle.</p>
        <p className="field-hint">{CONSEJOS.evergreen.campos.archivar}</p>
      </Modal>
    </>
  );
}
