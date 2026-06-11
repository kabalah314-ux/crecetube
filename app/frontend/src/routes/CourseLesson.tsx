// /curso/:seccionId/:asignaturaId — clase con placeholder (regla de oro #1), nota y vínculos.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, ExternalLink, FileText, Youtube } from "lucide-react";
import { api } from "../services/api";
import type { CourseAsignatura, CourseProgress, CourseSeccion, CourseStructure } from "../types";

export function CourseLesson() {
  const { seccionId, asignaturaId } = useParams();
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState<CourseSeccion | null>(null);
  const [asig, setAsig] = useState<CourseAsignatura | null>(null);
  const [prog, setProg] = useState<CourseProgress | null>(null);
  const [nota, setNota] = useState("");
  const notaTimer = useRef<number>();

  useEffect(() => {
    void Promise.all([
      api.get<CourseStructure>("/api/curso/estructura"),
      api.get<CourseProgress[]>("/api/curso/progreso"),
    ]).then(([c, p]) => {
      const s = c.secciones.find((x) => x.id === seccionId);
      const a = s?.asignaturas.find((x) => x.id === asignaturaId);
      if (!s || !a) {
        navigate("/curso", { replace: true });
        return;
      }
      setSeccion(s);
      setAsig(a);
      const pr = p.find((x) => x.asignaturaId === a.id) ?? null;
      setProg(pr);
      setNota(pr?.notaPersonal ?? "");
    });
  }, [seccionId, asignaturaId, navigate]);

  if (!seccion || !asig) {
    return (
      <div className="splash" style={{ height: "40vh" }}>
        <span className="spinner" />
      </div>
    );
  }

  const idx = seccion.asignaturas.findIndex((a) => a.id === asig.id);
  const prev = seccion.asignaturas[idx - 1];
  const next = seccion.asignaturas[idx + 1];
  const completado = prog?.completado ?? false;

  const toggle = async () => {
    const r = await api.patch<CourseProgress>(`/api/curso/progreso/${asig.id}`, { completado: !completado });
    setProg(r);
  };

  const guardarNota = (valor: string) => {
    setNota(valor);
    window.clearTimeout(notaTimer.current);
    notaTimer.current = window.setTimeout(() => {
      void api.patch<CourseProgress>(`/api/curso/progreso/${asig.id}`, { notaPersonal: valor }).then(setProg);
    }, 800);
  };

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <Link to={`/curso/${seccion.id}`} className="field-hint" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <ArrowLeft size={14} /> {seccion.id} · {seccion.titulo}
      </Link>
      <div className="page-head" style={{ marginTop: "var(--space-3)" }}>
        <div>
          <span className="mono" style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            {asig.id} · {asig.duracionEstimadaMin} min
          </span>
          <h1 style={{ marginTop: 4 }}>{asig.titulo}</h1>
        </div>
        <button
          className={`btn ${completado ? "btn-secondary" : "btn-primary"}`}
          onClick={toggle}
          data-testid="lesson-toggle-completado"
        >
          <Check size={16} /> {completado ? "Completada ✓" : "Marcar completada"}
        </button>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-5)" }}>
        {asig.contenido ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{asig.contenido}</div>
        ) : (
          <div className="empty" style={{ padding: "var(--space-7) var(--space-4)" }} data-testid="lesson-placeholder">
            <BookOpen size={48} strokeWidth={1.5} />
            <h3>Esta clase aún no tiene contenido cargado.</h3>
            <p>Volveremos pronto.</p>
          </div>
        )}
      </div>

      {(asig.plantillaRelacionadaId || asig.videoReferencia || asig.recursoExtra) && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-5)" }}>
          {asig.plantillaRelacionadaId && (
            <Link to={`/plantillas/${asig.plantillaRelacionadaId}`} className="btn btn-secondary btn-sm">
              <FileText size={14} /> Plantilla relacionada
            </Link>
          )}
          {asig.videoReferencia && (
            <a
              href={asig.videoReferencia}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              data-testid="lesson-video-referencia"
            >
              <Youtube size={14} /> Ver vídeo de referencia
            </a>
          )}
          {asig.recursoExtra && (
            <a
              href={asig.recursoExtra}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              data-testid="lesson-recurso-extra"
            >
              <ExternalLink size={14} /> Recurso extra
            </a>
          )}
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="f-nota">
          Tu nota personal (autoguardado)
        </label>
        <textarea
          id="f-nota"
          className="textarea"
          maxLength={1000}
          value={nota}
          data-testid="lesson-nota"
          onChange={(e) => guardarNota(e.target.value)}
        />
      </div>

      <div className="wizard-nav">
        {prev ? (
          <Link className="btn btn-ghost" to={`/curso/${seccion.id}/${prev.id}`}>
            <ArrowLeft size={16} /> {prev.titulo.slice(0, 32)}…
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link className="btn btn-ghost" to={`/curso/${seccion.id}/${next.id}`}>
            {next.titulo.slice(0, 32)}… <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
