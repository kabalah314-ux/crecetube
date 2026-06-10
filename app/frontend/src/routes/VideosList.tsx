// /videos — listado con filtros (03 §3.2.2) y cards (06 §6.7.3).
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Video as VideoIcon, ImageOff } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { es } from "../i18n/es";
import { api } from "../services/api";
import { COLOR_ESTADO } from "../wizard/estados";
import { globalProgress, stepDeReanudacion } from "../wizard/config";
import type { VideoProject, VideoState } from "../types";

export function VideosList() {
  const [videos, setVideos] = useState<VideoProject[] | null>(null);
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams();
    if (estado) params.set("estado", estado);
    if (tipo) params.set("tipo", tipo);
    if (q) params.set("q", q);
    const t = window.setTimeout(() => {
      void api.get<VideoProject[]>(`/api/videos?${params}`).then(setVideos).catch(() => setVideos([]));
    }, q ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [estado, tipo, q]);

  return (
    <div className="page">
      <div className="page-head">
        <h1>{es.nav.videos}</h1>
        <Link to="/videos/nuevo" className="btn btn-primary" data-testid="videos-new">
          <Plus size={18} /> Nuevo vídeo
        </Link>
      </div>

      <div className="filtros">
        <input
          className="input"
          placeholder="Buscar por título…"
          value={q}
          data-testid="videos-filter-q"
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={estado} data-testid="videos-filter-estado" onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(es.estados).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select className="select" value={tipo} data-testid="videos-filter-tipo" onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="evergreen">Evergreen</option>
          <option value="sprint">Sprint</option>
          <option value="mixto">Mixto</option>
        </select>
      </div>

      {videos === null ? (
        <div className="splash" style={{ height: "30vh" }}>
          <span className="spinner" />
        </div>
      ) : videos.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={VideoIcon}
            title="Tu primer vídeo empieza con una idea"
            desc="Crea un proyecto y el wizard te guiará por las 10 etapas del método CRECETUBE."
            cta={
              <Link to="/videos/nuevo" className="btn btn-primary">
                <Plus size={16} /> Nuevo vídeo
              </Link>
            }
          />
        </div>
      ) : (
        <div className="videos-grid">
          {videos.map((v) => {
            const pct = globalProgress(v);
            const reanudar = stepDeReanudacion(v);
            return (
              <article key={v.id} className="video-card" data-testid={`video-card-${v.id}`}>
                <Link to={`/videos/${v.id}`} className="thumb" aria-label={`Abrir ${v.tituloIdea}`}>
                  {v.miniatura.urlPrincipal ? (
                    <img src={v.miniatura.urlPrincipal} alt="" />
                  ) : (
                    <ImageOff size={28} />
                  )}
                </Link>
                <div className="cuerpo">
                  <span
                    className="tag"
                    style={{ ["--tag-color" as never]: COLOR_ESTADO[v.estado as VideoState], alignSelf: "flex-start" }}
                  >
                    {es.estados[v.estado]}
                  </span>
                  <h3>{v.tituloFinal ?? v.tituloIdea}</h3>
                  <span className="meta">
                    {v.nicho || "—"} · {v.tipo}
                  </span>
                  <div className="progress-thin" style={{ marginTop: "auto" }}>
                    <div style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="meta mono">{pct}%</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      data-testid="video-card-continue"
                      onClick={() => navigate(`/videos/${v.id}/wizard/${reanudar.slug}`)}
                    >
                      {es.common.continuar} →
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
