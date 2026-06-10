// /curso/:seccionId — asignaturas de una sección con check de completado.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, FileText } from "lucide-react";
import { api } from "../services/api";
import type { CourseProgress, CourseSeccion, CourseStructure } from "../types";

export function CourseSection() {
  const { seccionId } = useParams();
  const navigate = useNavigate();
  const [seccion, setSeccion] = useState<CourseSeccion | null>(null);
  const [progreso, setProgreso] = useState<Map<string, CourseProgress>>(new Map());

  useEffect(() => {
    void Promise.all([
      api.get<CourseStructure>("/api/curso/estructura"),
      api.get<CourseProgress[]>("/api/curso/progreso"),
    ]).then(([c, p]) => {
      const s = c.secciones.find((x) => x.id === seccionId);
      if (!s) {
        navigate("/curso", { replace: true });
        return;
      }
      setSeccion(s);
      setProgreso(new Map(p.map((x) => [x.asignaturaId, x])));
    });
  }, [seccionId, navigate]);

  if (!seccion) {
    return (
      <div className="splash" style={{ height: "40vh" }}>
        <span className="spinner" />
      </div>
    );
  }

  const toggle = async (asignaturaId: string, completado: boolean) => {
    const r = await api.patch<CourseProgress>(`/api/curso/progreso/${asignaturaId}`, { completado });
    setProgreso((m) => new Map(m).set(asignaturaId, r));
  };

  const color = `var(--family-${seccion.familia})`;
  const hechas = seccion.asignaturas.filter((a) => progreso.get(a.id)?.completado).length;

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <Link to="/curso" className="field-hint" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <ArrowLeft size={14} /> Todas las secciones
      </Link>
      <div className="page-head" style={{ marginTop: "var(--space-3)" }}>
        <div>
          <span className="tag" style={{ ["--tag-color" as never]: color }}>
            {seccion.id} · {seccion.familia}
          </span>
          <h1 style={{ marginTop: "var(--space-2)" }}>{seccion.titulo}</h1>
          <p>
            {seccion.descripcion} · {hechas}/{seccion.asignaturas.length} completadas
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {seccion.asignaturas.map((a) => {
          const done = progreso.get(a.id)?.completado ?? false;
          return (
            <div key={a.id} className="asignatura-row" data-testid={`asignatura-${a.id}`}>
              <input
                type="checkbox"
                checked={done}
                aria-label={`Marcar ${a.titulo}`}
                data-testid={`asignatura-check-${a.id}`}
                onChange={(e) => void toggle(a.id, e.target.checked)}
              />
              <Link to={`/curso/${seccion.id}/${a.id}`} className={done ? "hecha" : ""}>
                <span className="mono asig-id">{a.id}</span> {a.titulo}
              </Link>
              <span className="meta" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <Clock size={12} /> {a.duracionEstimadaMin} min
              </span>
              {a.plantillaRelacionadaId && (
                <Link to={`/plantillas/${a.plantillaRelacionadaId}`} aria-label="Plantilla relacionada" data-tip="Plantilla relacionada">
                  <FileText size={14} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
