import { Link } from "react-router-dom";
import { BookOpen, FileText, X, Zap } from "lucide-react";
import { globalProgress, type StepDef } from "./config";
import { CONSEJOS, GLOSARIO_ROMUALD } from "./consejos";
import { es } from "../i18n/es";
import type { VideoProject } from "../types";

interface Props {
  video: VideoProject;
  step: StepDef;
  abierto: boolean;
  onCerrar: () => void;
}

export function ContextPanel({ video, step, abierto, onCerrar }: Props) {
  const pct = globalProgress(video);
  const consejo = CONSEJOS[step.slug];
  return (
    <aside className={`context-panel${abierto ? " open" : ""}`} aria-label={es.wizard.ayudaContextual}>
      <button className="btn btn-ghost btn-sm context-close" onClick={onCerrar} aria-label="Cerrar ayuda">
        <X size={16} />
      </button>

      <div className="context-block" data-testid="context-consejo-romuald">
        <h4>
          <Zap size={16} /> {es.wizard.consejoRomuald}
        </h4>
        <p className="context-consejo">{consejo.banner}</p>
        {consejo.bannerDetalle && <p className="context-consejo">{consejo.bannerDetalle}</p>}
      </div>

      <div className="context-block">
        <h4>
          <BookOpen size={16} /> {es.wizard.delCurso}
        </h4>
        <ul>
          {step.curso.map((c) => (
            <li key={c.id}>
              <Link to={`/curso/${c.id}`} data-testid={`context-curso-${c.id}`}>
                {c.id} · {c.titulo}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {step.plantillas.length > 0 && (
        <div className="context-block">
          <h4>
            <FileText size={16} /> {es.wizard.plantillas}
          </h4>
          <ul>
            {step.plantillas.map((id) => (
              <li key={id}>
                <Link to={`/plantillas/${id}`} data-testid={`context-tpl-${id}`}>
                  {id.replace(/^tpl_/, "").replace(/_/g, " ")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="context-block">
        <h4>{es.wizard.progresoGlobal}</h4>
        <div className="ring" style={{ ["--pct" as never]: `${pct}` }} role="img" aria-label={`Progreso global ${pct}%`}>
          <span>{pct}%</span>
        </div>
      </div>

      <details className="context-block context-glosario" data-testid="context-glosario-romuald">
        <summary>{es.wizard.glosarioRomuald}</summary>
        <dl>
          {GLOSARIO_ROMUALD.map((g) => (
            <div key={g.termino}>
              <dt>{g.termino}</dt>
              <dd>{g.significado}</dd>
            </div>
          ))}
        </dl>
      </details>
    </aside>
  );
}
