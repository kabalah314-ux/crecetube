// Etapa 2 · investigacion (02 §2.4.2)
import { AiBlock } from "../AiBlock";
import { ChipsEditor, ListEditor, RefsEditor, LabelConTip } from "../fields";
import { CONSEJOS } from "../consejos";
import type { StepProps } from "./types";

export function StepInvestigacion({ video, patch }: StepProps) {
  return (
    <>
      <div className="field">
        <LabelConTip as="span" tip={CONSEJOS.investigacion.campos.palabrasClave}>Palabras clave (máx 15)</LabelConTip>
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
