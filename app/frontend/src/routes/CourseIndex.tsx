// /curso — las 20 secciones con progreso y color de familia (08 §8.6).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { es } from "../i18n/es";
import { api } from "../services/api";
import { filtrarCursoVisible } from "../lib/cursoVisible";
import type { CourseProgress, CourseStructure } from "../types";

export function CourseIndex() {
  const [curso, setCurso] = useState<CourseStructure | null>(null);
  const [progreso, setProgreso] = useState<CourseProgress[]>([]);

  useEffect(() => {
    void Promise.all([
      api.get<CourseStructure>("/api/curso/estructura"),
      api.get<CourseProgress[]>("/api/curso/progreso"),
    ]).then(([c, p]) => {
      setCurso(filtrarCursoVisible(c));
      setProgreso(p);
    });
  }, []);

  if (!curso) {
    return (
      <div className="splash" style={{ height: "40vh" }}>
        <span className="spinner" />
      </div>
    );
  }

  const completadas = new Set(progreso.filter((p) => p.completado).map((p) => p.asignaturaId));
  const totalHechas = curso.secciones.reduce(
    (n, s) => n + s.asignaturas.filter((a) => completadas.has(a.id)).length,
    0
  );
  const pctGlobal = curso.totalAsignaturas ? Math.round((totalHechas / curso.totalAsignaturas) * 100) : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{es.nav.curso}</h1>
          <p>
            {curso.totalSecciones} secciones · {curso.totalAsignaturas} clases · {totalHechas} completadas ({pctGlobal}%)
          </p>
        </div>
      </div>
      <div className="progress-thin" style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ width: `${pctGlobal}%` }} />
      </div>

      <div className="curso-grid">
        {curso.secciones.map((s) => {
          const hechas = s.asignaturas.filter((a) => completadas.has(a.id)).length;
          const pct = Math.round((hechas / s.asignaturas.length) * 100);
          const color = `var(--family-${s.familia})`;
          return (
            <Link key={s.id} to={`/curso/${s.id}`} className="seccion-card" data-testid={`curso-seccion-${s.id}`} style={{ ["--sec-color" as never]: color }}>
              <span className="seccion-id mono">{s.id}</span>
              <h3>{s.titulo}</h3>
              <p>{s.descripcion}</p>
              <div className="progress-thin">
                <div style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="meta mono">
                {hechas}/{s.asignaturas.length} clases
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
