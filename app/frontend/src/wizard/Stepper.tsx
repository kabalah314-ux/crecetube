import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { STEPS, stepProgress } from "./config";
import type { VideoProject } from "../types";

export function Stepper({ video, actual }: { video: VideoProject; actual: string }) {
  return (
    <ol className="stepper" aria-label="Etapas del wizard">
      {STEPS.map((s, i) => {
        const { done, total } = stepProgress(video, s);
        const completo = done === total;
        const esActual = s.slug === actual;
        return (
          <li key={s.slug} className={`step${esActual ? " current" : ""}${completo ? " done" : ""}`}>
            <Link
              to={`/videos/${video.id}/wizard/${s.slug}`}
              data-testid={`wizard-step-${s.slug}`}
              aria-current={esActual ? "step" : undefined}
              title={`${s.titulo} (${done}/${total})`}
            >
              <span className="step-dot">{completo ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
              <span className="step-label">{s.titulo}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
