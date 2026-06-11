// Etapa 9 · sprint (02 §2.4.9) — solo tiene sentido tras publicar.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, LineChart, Plus } from "lucide-react";
import { AiBlock } from "../AiBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { SnapshotModal } from "../../components/SnapshotModal";
import { CONSEJOS } from "../consejos";
import type { StepProps } from "./types";

const REDES = [
  ["instagram", "Instagram"],
  ["twitter", "Twitter/X"],
  ["tiktok", "TikTok"],
] as const;

const TIPOS_POST = ["Giftcalipsis", "SEOencuesta", "SEOlaunch", "SEOrepesca"] as const;

export function StepSprint({ video, patch }: StepProps) {
  const [modalSnap, setModalSnap] = useState(false);
  const publicado = video.estado === "publicado" || video.estado === "optimizacion" || video.estado === "archivado";

  if (!publicado || !video.publishedAt) {
    return (
      <div className="card">
        <EmptyState
          icon={Rocket}
          title="Publica el vídeo para arrancar el sprint"
          desc={`Los 7 días posteriores a la publicación deciden el alcance inicial. Esta etapa se activa al marcar el vídeo como publicado. ${CONSEJOS.sprint.bannerDetalle ?? ""}`}
          cta={
            <Link to={`/videos/${video.id}/wizard/publicacion`} className="btn btn-primary" data-testid="ir-a-publicacion">
              Ir a Publicación
            </Link>
          }
        />
      </div>
    );
  }

  const dia = Math.floor((Date.now() - new Date(video.publishedAt).getTime()) / 86400000) + 1;

  return (
    <>
      <div className="sprint-head card" style={{ marginBottom: "var(--space-5)" }}>
        <Rocket size={20} style={{ color: "var(--accent-primary)" }} />
        <strong data-testid="sprint-dia">{dia <= 7 ? `Día ${dia} del sprint` : "Sprint completado"}</strong>
        <span style={{ color: "var(--text-tertiary)", flex: 1 }}>
          Publicado el {new Date(video.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={() => setModalSnap(true)} data-testid="sprint-add-snapshot" data-tip={CONSEJOS.sprint.campos.metricasSprint}>
          <Plus size={14} /> Snapshot de métricas
        </button>
        <Link to="/metricas" className="btn btn-ghost btn-sm">
          <LineChart size={14} /> Ver métricas
        </Link>
      </div>

      <SnapshotModal
        open={modalSnap}
        onClose={() => setModalSnap(false)}
        videoProjectId={video.id}
        onGuardado={() => undefined}
      />

      <div className="field">
        <span className="label">Difusión del día 1</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <label className="check-row" data-tip={CONSEJOS.sprint.campos.emailMarketing}>
            <input
              type="checkbox"
              checked={video.difusion.emailEnviado}
              data-testid="field-difusion-email"
              onChange={(e) => patch({ difusion: { ...video.difusion, emailEnviado: e.target.checked } })}
            />
            Email a la lista enviado
          </label>
          <label className="check-row" data-tip={CONSEJOS.sprint.campos.postComunidad}>
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
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", paddingLeft: 28 }}>
            {TIPOS_POST.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip${video.difusion.postComunidad.tipo === t ? " active" : ""}`}
                data-testid={`field-post-tipo-${t.toLowerCase()}`}
                onClick={() =>
                  patch({ difusion: { ...video.difusion, postComunidad: { ...video.difusion.postComunidad, tipo: t } } })
                }
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            {REDES.map(([k, label]) => (
              <label key={k} className="check-row">
                <input
                  type="checkbox"
                  checked={video.difusion.redesCompartido[k]}
                  data-testid={`field-difusion-${k}`}
                  onChange={(e) =>
                    patch({
                      difusion: {
                        ...video.difusion,
                        redesCompartido: { ...video.difusion.redesCompartido, [k]: e.target.checked },
                      },
                    })
                  }
                />
                {label}
              </label>
            ))}
            <label className="check-row">
              <input
                type="checkbox"
                checked={video.difusion.adsActivados}
                data-testid="field-difusion-ads"
                onChange={(e) => patch({ difusion: { ...video.difusion, adsActivados: e.target.checked } })}
              />
              Ads activados (opcional)
            </label>
          </div>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="f-post-contenido">
          Contenido del post de comunidad
        </label>
        <textarea
          id="f-post-contenido"
          className="textarea"
          data-testid="field-post-contenido"
          value={video.difusion.postComunidad.contenido}
          placeholder="Redáctalo aquí o genera uno con IA según el tipo elegido"
          onChange={(e) =>
            patch({ difusion: { ...video.difusion, postComunidad: { ...video.difusion.postComunidad, contenido: e.target.value } } })
          }
        />
      </div>

      <AiBlock
        tipo="comunidad"
        videoProjectId={video.id}
        etiqueta="Generar post de comunidad con IA"
        opciones={{ tipoPost: video.difusion.postComunidad.tipo ?? "SEOlaunch" }}
        disabledExtra={!video.difusion.postComunidad.tipo ? "Elige antes el tipo de post" : null}
        render={(resultados) => {
          const r = resultados[0] as { contenido?: string; horaSugerida?: string };
          return (
            <div className="ai-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <pre className="ai-raw">{r?.contenido}</pre>
              {r?.horaSugerida && <p className="field-hint">Hora sugerida: {r.horaSugerida}</p>}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ alignSelf: "flex-start" }}
                onClick={() =>
                  patch({
                    difusion: {
                      ...video.difusion,
                      postComunidad: { ...video.difusion.postComunidad, contenido: r?.contenido ?? "" },
                    },
                  })
                }
              >
                Usar este post
              </button>
            </div>
          );
        }}
      />

      <div style={{ marginTop: "var(--space-4)" }}>
        <AiBlock
          tipo="email"
          videoProjectId={video.id}
          etiqueta="Generar email de nuevo vídeo con IA"
          render={(resultados) => {
            const r = resultados[0] as { asunto?: string; preheader?: string; cuerpo?: string };
            const completo = `Asunto: ${r?.asunto}\nPre-header: ${r?.preheader}\n\n${r?.cuerpo}`;
            return (
              <div className="ai-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <pre className="ai-raw">{completo}</pre>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => {
                    void navigator.clipboard.writeText(completo);
                  }}
                >
                  Copiar email
                </button>
              </div>
            );
          }}
        />
      </div>
    </>
  );
}
