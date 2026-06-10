// VideoWizard — orquestador del wizard (02 §2.3). Ruta /videos/:id/wizard/:stepId
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CloudUpload, Check, AlertTriangle, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { STEPS, stepBySlug, stepIndex } from "../wizard/config";
import { useVideoProject } from "../wizard/useVideoProject";
import { Stepper } from "../wizard/Stepper";
import { Checklist } from "../wizard/Checklist";
import { ContextPanel } from "../wizard/ContextPanel";
import { StepIdea } from "../wizard/steps/StepIdea";
import { StepInvestigacion } from "../wizard/steps/StepInvestigacion";
import { StepTitulo } from "../wizard/steps/StepTitulo";
import { StepMiniatura } from "../wizard/steps/StepMiniatura";
import { StepGuion } from "../wizard/steps/StepGuion";
import { StepGenerico } from "../wizard/steps/StepGenerico";
import { StepPublicacion } from "../wizard/steps/StepPublicacion";
import { StepSprint } from "../wizard/steps/StepSprint";
import { StepEvergreen } from "../wizard/steps/StepEvergreen";
import type { VideoState } from "../types";
import { useStore } from "../store/useStore";
import { es } from "../i18n/es";
import { ESTADOS_ORDEN } from "../wizard/estados";
import type { StepProps } from "../wizard/steps/types";

function CuerpoEtapa({
  slug,
  props,
  cambiarEstado,
}: {
  slug: string;
  props: StepProps;
  cambiarEstado: (e: VideoState, publishedAt?: string) => Promise<unknown>;
}) {
  switch (slug) {
    case "idea":
      return <StepIdea {...props} />;
    case "investigacion":
      return <StepInvestigacion {...props} />;
    case "titulo":
      return <StepTitulo {...props} />;
    case "miniatura":
      return <StepMiniatura {...props} />;
    case "guion":
      return <StepGuion {...props} />;
    case "grabacion":
      return <StepGenerico {...props} labelNotas="Notas de producción" mostrarGuion />;
    case "edicion":
      return <StepGenerico {...props} labelNotas="Notas de edición" recordatoriosEdicion />;
    case "publicacion":
      return <StepPublicacion {...props} cambiarEstado={cambiarEstado} />;
    case "sprint":
      return <StepSprint {...props} />;
    case "evergreen":
      return <StepEvergreen {...props} cambiarEstado={cambiarEstado} />;
    default:
      return <StepGenerico {...props} labelNotas="Notas" />;
  }
}

export function VideoWizard() {
  const { id, stepId } = useParams();
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);
  const { video, cargando, errorCarga, saveState, patch, toggleManual, cambiarEstado } = useVideoProject(id);
  const [panelAbierto, setPanelAbierto] = useState(false);

  const step = stepBySlug(stepId ?? "");
  const idx = step ? stepIndex(step.slug) : -1;

  // stepId inválido → redirigir a la etapa de reanudación (02 §2.6)
  useEffect(() => {
    if (!cargando && video && !step) {
      import("../wizard/config").then(({ stepDeReanudacion }) =>
        navigate(`/videos/${video.id}/wizard/${stepDeReanudacion(video).slug}`, { replace: true })
      );
    }
  }, [cargando, video, step, navigate]);

  // vídeo inexistente
  useEffect(() => {
    if (errorCarga === "VIDEO_NOT_FOUND") {
      toast("error", "Ese vídeo no existe");
      navigate("/videos", { replace: true });
    }
  }, [errorCarga, navigate, toast]);

  // avance de estado al entrar en la etapa (02 §2.3.4) — solo hacia delante
  useEffect(() => {
    if (!video || !step?.estadoAlEntrar) return;
    if (ESTADOS_ORDEN.indexOf(step.estadoAlEntrar) > ESTADOS_ORDEN.indexOf(video.estado)) {
      void cambiarEstado(step.estadoAlEntrar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id, step?.slug]);

  // atajos Ctrl+← / Ctrl+→
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !video || idx < 0) return;
      if (e.key === "ArrowRight" && idx < STEPS.length - 1) {
        e.preventDefault();
        navigate(`/videos/${video.id}/wizard/${STEPS[idx + 1].slug}`);
      }
      if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        navigate(`/videos/${video.id}/wizard/${STEPS[idx - 1].slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, video, navigate]);

  if (cargando || !video || !step) {
    return (
      <div className="splash">
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div className="wizard">
      <div className="wizard-main">
        <Stepper video={video} actual={step.slug} />

        <div className="wizard-titlebar">
          <h1 style={{ fontSize: "var(--text-2xl)" }}>{step.titulo}</h1>
          <span className={`savestate ${saveState}`} aria-live="polite" data-testid="autosave-indicator">
            {saveState === "saving" && (
              <>
                <CloudUpload size={14} /> {es.common.guardando}
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check size={14} /> {es.common.guardado}
              </>
            )}
            {saveState === "error" && (
              <>
                <AlertTriangle size={14} /> {es.common.sinGuardar}
              </>
            )}
          </span>
        </div>

        <CuerpoEtapa slug={step.slug} props={{ video, patch }} cambiarEstado={cambiarEstado} />

        <Checklist video={video} step={step} onToggle={(itemKey, valor) => toggleManual(step.slug, itemKey, valor)} />

        <div className="wizard-nav">
          {idx > 0 ? (
            <Link className="btn btn-secondary" to={`/videos/${video.id}/wizard/${STEPS[idx - 1].slug}`} data-testid="wizard-prev">
              <ArrowLeft size={16} /> {es.common.anterior}
            </Link>
          ) : (
            <span />
          )}
          {idx < STEPS.length - 1 && (
            <Link className="btn btn-primary" to={`/videos/${video.id}/wizard/${STEPS[idx + 1].slug}`} data-testid="wizard-next">
              {es.common.siguiente} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      <ContextPanel video={video} step={step} abierto={panelAbierto} onCerrar={() => setPanelAbierto(false)} />
      <button className="btn btn-primary context-fab" onClick={() => setPanelAbierto(true)} data-testid="context-fab">
        <LifeBuoy size={16} /> {es.wizard.ayudaContextual}
      </button>
    </div>
  );
}
