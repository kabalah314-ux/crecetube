import { Link } from "react-router-dom";
import { BookOpen, FileText, X } from "lucide-react";
import { globalProgress, type StepDef } from "./config";
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
  return (
    <aside className={`context-panel${abierto ? " open" : ""}`} aria-label={es.wizard.ayudaContextual}>
      <button className="btn btn-ghost btn-sm context-close" onClick={onCerrar} aria-label="Cerrar ayuda">
        <X size={16} />
      </button>

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
    </aside>
  );
}
