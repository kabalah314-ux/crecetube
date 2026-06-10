import { Lock } from "lucide-react";
import { isItemDone, stepProgress, type StepDef } from "./config";
import type { VideoProject } from "../types";

interface Props {
  video: VideoProject;
  step: StepDef;
  onToggle: (itemKey: string, valor: boolean) => void;
}

export function Checklist({ video, step, onToggle }: Props) {
  const { done, total } = stepProgress(video, step);
  return (
    <section className="card checklist-card" aria-label={`Checklist de ${step.titulo}`}>
      <header className="checklist-head">
        <h3>Checklist de la etapa</h3>
        <span className="mono" style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
          {done}/{total}
        </span>
      </header>
      <div className="progress-thin" style={{ marginBottom: "var(--space-4)" }}>
        <div style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
      </div>
      <ul className="checklist">
        {step.checklist.map((item) => {
          const hecho = isItemDone(video, step, item);
          const esAuto = Boolean(item.auto);
          return (
            <li key={item.key} className={hecho ? "done" : ""}>
              <label
                className={esAuto ? "auto" : ""}
                data-tip={esAuto ? "Se marca solo cuando el dato correspondiente está completo" : undefined}
              >
                <input
                  type="checkbox"
                  checked={hecho}
                  disabled={esAuto}
                  data-testid={`checklist-${step.slug}-${item.key}`}
                  onChange={(e) => onToggle(item.key, e.target.checked)}
                />
                <span className="check-text">{item.texto}</span>
                {esAuto && <Lock size={12} className="check-lock" aria-label="Item automático" />}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
