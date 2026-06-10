// /videos/:id — detalle: estado manual, duplicar, eliminar con Deshacer (02 §2.5).
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Copy, ImageOff, Trash2 } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import { COLOR_ESTADO } from "../wizard/estados";
import { STEPS, globalProgress, stepDeReanudacion, stepProgress } from "../wizard/config";
import type { VideoProject, VideoState } from "../types";

export function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);
  const [video, setVideo] = useState<VideoProject | null>(null);
  const [modalEliminar, setModalEliminar] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<VideoProject>(`/api/videos/${id}`)
      .then(setVideo)
      .catch(() => {
        toast("error", "Ese vídeo no existe");
        navigate("/videos", { replace: true });
      });
  }, [id, navigate, toast]);

  if (!video) {
    return (
      <div className="splash" style={{ height: "40vh" }}>
        <span className="spinner" />
      </div>
    );
  }

  const cambiarEstado = async (estado: VideoState) => {
    try {
      const v = await api.patch<VideoProject>(`/api/videos/${video.id}/estado`, { estado });
      setVideo(v);
      toast("success", `Estado: ${es.estados[estado]}`);
    } catch (e) {
      toast("error", isApiError(e) ? e.message : "Transición no permitida");
    }
  };

  const duplicar = async () => {
    const copia = await api.post<VideoProject>(`/api/videos/${video.id}/duplicar`);
    toast("success", "Proyecto duplicado");
    navigate(`/videos/${copia.id}`);
  };

  const eliminar = async () => {
    await api.del(`/api/videos/${video.id}`);
    setModalEliminar(false);
    navigate("/videos");
    toast("info", `"${video.tituloFinal ?? video.tituloIdea}" eliminado`, {
      label: es.common.deshacer,
      fn: () => {
        void api.post(`/api/videos/${video.id}/restaurar`).then(() => toast("success", "Restaurado"));
      },
    });
  };

  const pct = globalProgress(video);
  const reanudar = stepDeReanudacion(video);

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className="page-head">
        <div>
          <span className="tag" style={{ ["--tag-color" as never]: COLOR_ESTADO[video.estado] }}>
            {es.estados[video.estado]}
          </span>
          <h1 style={{ marginTop: "var(--space-2)" }}>{video.tituloFinal ?? video.tituloIdea}</h1>
          <p>
            {video.nicho || "—"} · {video.tipo} · {video.formato}
            {video.publishedAt && ` · publicado el ${new Date(video.publishedAt).toLocaleDateString("es-ES")}`}
          </p>
        </div>
        <button
          className="btn btn-primary"
          data-testid="video-card-continue"
          onClick={() => navigate(`/videos/${video.id}/wizard/${reanudar.slug}`)}
        >
          {es.common.continuar} en “{reanudar.titulo}” <ArrowRight size={16} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,3fr)", gap: "var(--space-5)" }} className="detalle-grid">
        <div className="card">
          <div className="thumb" style={{ aspectRatio: "16/9", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--bg-overlay)", display: "grid", placeItems: "center", color: "var(--text-disabled)" }}>
            {video.miniatura.urlPrincipal ? (
              <img src={video.miniatura.urlPrincipal} alt="Miniatura" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <ImageOff size={28} />
            )}
          </div>
          <div style={{ marginTop: "var(--space-4)" }}>
            <div className="progress-thin">
              <div style={{ width: `${pct}%` }} />
            </div>
            <span className="meta mono" style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>
              {pct}% del método completado
            </span>
          </div>

          <div className="field" style={{ marginTop: "var(--space-4)" }}>
            <label className="label" htmlFor="estado-select">
              Cambiar estado manualmente
            </label>
            <select
              id="estado-select"
              className="select"
              value={video.estado}
              data-testid="estado-select"
              onChange={(e) => void cambiarEstado(e.target.value as VideoState)}
            >
              {Object.entries(es.estados).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <button className="btn btn-secondary btn-sm" onClick={duplicar} data-testid="btn-duplicar">
              <Copy size={14} /> {es.common.duplicar}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setModalEliminar(true)} data-testid="btn-eliminar">
              <Trash2 size={14} /> {es.common.eliminar}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>Progreso por etapa</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {STEPS.map((s) => {
              const { done, total } = stepProgress(video, s);
              return (
                <Link
                  key={s.slug}
                  to={`/videos/${video.id}/wizard/${s.slug}`}
                  style={{ display: "grid", gridTemplateColumns: "110px 1fr 48px", gap: "var(--space-3)", alignItems: "center", color: "var(--text-secondary)" }}
                  data-testid={`detalle-etapa-${s.slug}`}
                >
                  <span style={{ fontSize: "var(--text-sm)" }}>{s.titulo}</span>
                  <div className="progress-thin">
                    <div style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
                  </div>
                  <span className="mono" style={{ fontSize: "var(--text-xs)", textAlign: "right" }}>
                    {done}/{total}
                  </span>
                </Link>
              );
            })}
          </div>
          {video.notas && (
            <>
              <h3 style={{ margin: "var(--space-5) 0 var(--space-2)" }}>Notas</h3>
              <p style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{video.notas}</p>
            </>
          )}
        </div>
      </div>

      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="¿Eliminar este proyecto?"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalEliminar(false)}>
              {es.common.cancelar}
            </button>
            <button className="btn btn-danger" onClick={eliminar} data-testid="confirm-eliminar">
              {es.common.eliminar}
            </button>
          </>
        }
      >
        <p>
          Se elimina “{video.tituloFinal ?? video.tituloIdea}”. Tendrás 5 segundos para deshacer; después quedará en la papelera 30 días
          (03 §3.3.4).
        </p>
      </Modal>
    </div>
  );
}
