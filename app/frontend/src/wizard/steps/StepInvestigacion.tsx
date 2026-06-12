// Etapa 2 · investigacion (02 §2.4.2)
import { useRef } from "react";
import { AiBlock } from "../AiBlock";
import { FieldIA } from "../FieldIA";
import { ChipsEditor, ListEditor, RefsEditor, LabelConTip } from "../fields";
import { CONSEJOS } from "../consejos";
import type { StepProps } from "./types";

export function StepInvestigacion({ video, patch }: StepProps) {
  // "Añadir todas" de FieldIA llama a onUsar varias veces en el mismo tick: se acumula
  // sobre un ref (no sobre el closure de `video`) para no perder elementos.
  const kwRef = useRef(video.palabrasClave);
  kwRef.current = video.palabrasClave;
  const anadirPalabraClave = (t: string) => {
    const limpio = t.trim();
    if (!limpio || kwRef.current.includes(limpio) || kwRef.current.length >= 15) return;
    const nuevas = [...kwRef.current, limpio];
    kwRef.current = nuevas;
    patch({ palabrasClave: nuevas });
  };

  return (
    <>
      <div className="field">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <LabelConTip as="span" tip={CONSEJOS.investigacion.campos.palabrasClave}>Palabras clave (máx 15)</LabelConTip>
          <FieldIA
            campoId="palabrasClave"
            videoProjectId={video.id}
            modo="lista"
            valoresActuales={video.palabrasClave}
            max={15}
            onUsar={anadirPalabraClave}
          />
        </div>
        <ChipsEditor
          valores={video.palabrasClave}
          max={15}
          placeholder="Ej: audio, micrófono barato…"
          testid="field-palabras-clave"
          onChange={(palabrasClave) => patch({ palabrasClave })}
        />
      </div>

      <div className="field">
        <LabelConTip as="span" tip={CONSEJOS.investigacion.campos.seoPreguntas}>Preguntas que responde el vídeo (máx 10)</LabelConTip>
        <ListEditor
          valores={video.seoPreguntas}
          max={10}
          placeholder="Ej: ¿qué micrófono comprar por menos de 50€?"
          testid="field-seo-preguntas"
          onChange={(seoPreguntas) => patch({ seoPreguntas })}
        />
      </div>

      <AiBlock
        tipo="seo_preguntas"
        videoProjectId={video.id}
        etiqueta="Generar preguntas SEO con IA"
        render={(resultados) => (
          <ul className="ai-cards">
            {(resultados as Array<{ texto: string }>).map((r, i) => (
              <li key={i} className="ai-card" data-testid={`ai-result-${i}`}>
                <span>{r.texto}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={video.seoPreguntas.length >= 10 || video.seoPreguntas.includes(r.texto)}
                  onClick={() => patch({ seoPreguntas: [...video.seoPreguntas, r.texto] })}
                >
                  Añadir
                </button>
              </li>
            ))}
          </ul>
        )}
      />

      <div className="field" style={{ marginTop: "var(--space-5)" }}>
        <LabelConTip as="span" tip={CONSEJOS.investigacion.campos.competenciaRefs}>Vídeos de la competencia</LabelConTip>
        <RefsEditor valores={video.competenciaRefs} onChange={(competenciaRefs) => patch({ competenciaRefs })} />
      </div>
    </>
  );
}
