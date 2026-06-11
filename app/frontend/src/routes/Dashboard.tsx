// Dashboard — resumen real (08 §8.5): KPIs + continuar donde lo dejaste + accesos.
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, BookOpen, FileText, Video as VideoIcon } from "lucide-react";
import { useStore } from "../store/useStore";
import { api } from "../services/api";
import { es } from "../i18n/es";
import { COLOR_ESTADO } from "../wizard/estados";
import { globalProgress, stepDeReanudacion } from "../wizard/config";
import { OpenRouterTutorial } from "../wizard/OpenRouterTutorial";
import type { VideoProject } from "../types";

const TUTORIAL_KEY = "ct.tutorial.openrouter";

const DIAS_30 = 30 * 24 * 60 * 60 * 1000;

export function Dashboard() {
  const profile = useStore((s) => s.profile);
  const [videos, setVideos] = useState<VideoProject[] | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    void api.get<VideoProject[]>("/api/videos").then(setVideos).catch(() => setVideos([]));
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (profile.iaConfig.apiKey === "" && localStorage.getItem(TUTORIAL_KEY) !== "1") {
      setShowTutorial(true);
    }
  }, [profile]);

  function closeTutorial() {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setShowTutorial(false);
  }

  const activos = videos?.filter((v) => v.estado !== "archivado") ?? [];
  const enMarcha = activos.filter((v) => v.estado !== "publicado" && v.estado !== "optimizacion");
  const publicados30 = (videos ?? []).filter(
    (v) => v.publishedAt && Date.now() - new Date(v.publishedAt).getTime() < DIAS_30
  );
  const progresoMedio = activos.length
    ? Math.round(activos.reduce((a, v) => a + globalProgress(v), 0) / activos.length)
    : 0;
  const continuar = [...activos].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hola, {profile?.canalNombre ?? "creador"}</h1>
          <p>
            {profile?.nicho} · objetivo: {profile ? es.objetivos[profile.objetivoPrincipal] : ""}
          </p>
        </div>
        <Link to="/videos/nuevo" className="btn btn-primary" data-testid="dashboard-new-video">
          <Plus size={18} /> Nuevo vídeo
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card kpi">
          <span className="kpi-num">{enMarcha.length}</span>
          <span className="kpi-label">proyectos en marcha</span>
        </div>
        <div className="card kpi">
          <span className="kpi-num">{publicados30.length}</span>
          <span className="kpi-label">publicados últimos 30 días</span>
        </div>
        <div className="card kpi">
          <span className="kpi-num">{progresoMedio}%</span>
          <span className="kpi-label">método aplicado de media</span>
        </div>
      </div>

      {continuar.length > 0 && (
        <section style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>Continuar donde lo dejaste</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {continuar.map((v) => {
              const pct = globalProgress(v);
              const paso = stepDeReanudacion(v);
              return (
                <div key={v.id} className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  <span className="tag" style={{ ["--tag-color" as never]: COLOR_ESTADO[v.estado] }}>
                    {es.estados[v.estado]}
                  </span>
                  <Link to={`/videos/${v.id}`} style={{ color: "var(--text-primary)", fontWeight: 600, flex: 1, minWidth: 180 }}>
                    {v.tituloFinal ?? v.tituloIdea}
                  </Link>
                  <div className="progress-thin" style={{ width: 140 }}>
                    <div style={{ width: `${pct}%` }} />
                  </div>
                  <span className="mono" style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                    {pct}%
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    data-testid="video-card-continue"
                    onClick={() => navigate(`/videos/${v.id}/wizard/${paso.slug}`)}
                  >
                    {es.common.continuar} → {paso.titulo}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {videos !== null && videos.length === 0 && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="empty" style={{ padding: "var(--space-6)" }}>
            <VideoIcon size={48} strokeWidth={1.5} />
            <h3>Tu primer vídeo empieza con una idea</h3>
            <Link to="/videos/nuevo" className="btn btn-primary">
              <Plus size={16} /> Empezar ahora
            </Link>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-5)" }}>
        <div className="card">
          <h3 style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <BookOpen size={20} /> El curso
          </h3>
          <p style={{ color: "var(--text-secondary)", margin: "var(--space-3) 0 var(--space-4)" }}>
            20 secciones y 169 clases del método, integradas en cada etapa del wizard.
          </p>
          <Link to="/curso" className="btn btn-secondary btn-sm">
            Ir al curso
          </Link>
        </div>
        <div className="card">
          <h3 style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <FileText size={20} /> Plantillas
          </h3>
          <p style={{ color: "var(--text-secondary)", margin: "var(--space-3) 0 var(--space-4)" }}>
            25 plantillas listas: descripciones, emails, miniaturas, checklists…
          </p>
          <Link to="/plantillas" className="btn btn-secondary btn-sm">
            Abrir biblioteca
          </Link>
        </div>
      </div>

      <OpenRouterTutorial open={showTutorial} onClose={closeTutorial} />
    </div>
  );
}
