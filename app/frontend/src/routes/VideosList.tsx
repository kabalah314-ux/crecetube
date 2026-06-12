// /videos — listado con filtros (03 §3.2.2) y cards (06 §6.7.3).
// Con gestionMulticanal (T017): primero rejilla de canales ("Proyectos") y,
// dentro de un canal (?canalId=), la lista de vídeos filtrada. Sin multicanal todo queda como siempre.
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Video as VideoIcon, ImageOff, Clapperboard } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import { COLOR_ESTADO } from "../wizard/estados";
import { globalProgress, stepDeReanudacion } from "../wizard/config";
import type { Channel, VideoProject, VideoState } from "../types";

export function VideosList() {
  const profile = useStore((s) => s.profile);
  const [searchParams] = useSearchParams();
  const multicanal = Boolean(profile?.gestionMulticanal);
  const canalId = multicanal ? searchParams.get("canalId") : null;

  if (multicanal && !canalId) return <ProyectosGrid />;
  return <ListaVideos canalId={canalId} multicanal={multicanal} />;
}

// Rejilla de canales (vista "Proyectos") cuando gestionMulticanal está activo.
function ProyectosGrid() {
  const [canales, setCanales] = useState<Channel[] | null>(null);
  const [conteo, setConteo] = useState<Record<string, number>>({});
  // T025 — propuesta de estudio de viabilidad tras crear un canal nuevo
  const [modalViabilidad, setModalViabilidad] = useState<{ nombre: string; yaCompletado: boolean } | null>(null);
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);

  const cargar = useCallback(async () => {
    const [cs, vs] = await Promise.all([api.get<Channel[]>("/api/canales"), api.get<VideoProject[]>("/api/videos")]);
    const n: Record<string, number> = {};
    for (const v of vs) if (v.canalId) n[v.canalId] = (n[v.canalId] ?? 0) + 1;
    setCanales(cs);
    setConteo(n);
  }, []);

  useEffect(() => {
    void cargar().catch(() => setCanales([]));
  }, [cargar]);

  const anadirCanal = async () => {
    const nombre = window.prompt(es.proyectos.promptNombre)?.trim();
    if (!nombre) return;
    try {
      const c = await api.post<Channel>("/api/canales", { nombre });
      toast("success", es.proyectos.canalCreado(c.nombre));
      await cargar();
      // T025 — proponer el estudio de viabilidad para el canal nuevo. El estudio es
      // singleton por usuario: si ya hay uno completado, la propuesta ofrece revisarlo.
      let yaCompletado = false;
      try {
        const estudio = await api.get<{ completado?: boolean } | null>("/api/viabilidad");
        yaCompletado = Boolean(estudio?.completado);
      } catch {
        // sin estudio o error de red → propuesta estándar
      }
      setModalViabilidad({ nombre: c.nombre, yaCompletado });
    } catch (e) {
      toast("error", isApiError(e) ? e.message : es.proyectos.errorCrear);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>{es.nav.proyectos}</h1>
        <button className="btn btn-primary" data-testid="proyectos-add" onClick={() => void anadirCanal()}>
          <Plus size={18} /> {es.proyectos.anadirCanal}
        </button>
      </div>

      {canales === null ? (
        <div className="splash" style={{ height: "30vh" }}>
          <span className="spinner" />
        </div>
      ) : (
        <div className="videos-grid" data-testid="proyectos-grid">
          {canales.map((c) => (
            <button
              type="button"
              key={c.id}
              className="card proyecto-card"
              data-testid={`proyecto-card-${c.id}`}
              aria-label={es.proyectos.abrirCanal(c.nombre)}
              onClick={() => navigate(`/videos?canalId=${c.id}`)}
            >
              <Clapperboard size={24} />
              <strong>{c.nombre}</strong>
              <span className="meta">{es.proyectos.nVideos(conteo[c.id] ?? 0)}</span>
              {c.esPorDefecto && <span className="tag">{es.proyectos.porDefecto}</span>}
            </button>
          ))}
        </div>
      )}

      {/* T025 — propuesta de estudio de viabilidad para el canal recién creado */}
      <Modal
        open={modalViabilidad !== null}
        onClose={() => setModalViabilidad(null)}
        title={es.viabilidadPropuesta.modalTitulo(modalViabilidad?.nombre ?? "")}
        actions={
          <>
            <button
              className="btn btn-ghost"
              data-testid="modal-viabilidad-no"
              onClick={() => setModalViabilidad(null)}
            >
              {es.viabilidadPropuesta.ahoraNo}
            </button>
            <button
              className="btn btn-primary"
              data-testid="modal-viabilidad-si"
              onClick={() => navigate("/viabilidad")}
            >
              {modalViabilidad?.yaCompletado
                ? es.viabilidadPropuesta.modalRevisar
                : es.viabilidadPropuesta.modalHacer}
            </button>
          </>
        }
      >
        <p data-testid="modal-viabilidad-canal" style={{ color: "var(--text-secondary)" }}>
          {modalViabilidad?.yaCompletado
            ? es.viabilidadPropuesta.modalTextoRevisar
            : es.viabilidadPropuesta.modalTexto}
        </p>
      </Modal>
    </div>
  );
}

function ListaVideos({ canalId, multicanal }: { canalId: string | null; multicanal: boolean }) {
  const [videos, setVideos] = useState<VideoProject[] | null>(null);
  const [canal, setCanal] = useState<Channel | null>(null);
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const nuevoHref = canalId ? `/videos/nuevo?canalId=${canalId}` : "/videos/nuevo";

  useEffect(() => {
    const params = new URLSearchParams();
    if (canalId) params.set("canalId", canalId);
    if (estado) params.set("estado", estado);
    if (tipo) params.set("tipo", tipo);
    if (q) params.set("q", q);
    const t = window.setTimeout(() => {
      void api.get<VideoProject[]>(`/api/videos?${params}`).then(setVideos).catch(() => setVideos([]));
    }, q ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [canalId, estado, tipo, q]);

  // Nombre del canal abierto (solo en modo multicanal).
  useEffect(() => {
    if (!canalId) {
      setCanal(null);
      return;
    }
    void api
      .get<Channel[]>("/api/canales")
      .then((cs) => setCanal(cs.find((c) => c.id === canalId) ?? null))
      .catch(() => setCanal(null));
  }, [canalId]);

  return (
    <div className="page">
      {canalId && (
        <Link to="/videos" className="field-hint" data-testid="videos-volver-proyectos">
          {es.proyectos.volver}
        </Link>
      )}
      <div className="page-head">
        <h1>{canalId ? canal?.nombre ?? es.nav.videos : multicanal ? es.nav.proyectos : es.nav.videos}</h1>
        <Link to={nuevoHref} className="btn btn-primary" data-testid="videos-new">
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
              <Link to={nuevoHref} className="btn btn-primary">
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
