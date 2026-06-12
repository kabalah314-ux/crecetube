// Etapa 1 · idea (02 §2.4.1)
import { AiBlock } from "../AiBlock";
import { FieldIA } from "../FieldIA";
import { CharCount, LabelConTip } from "../fields";
import { CONSEJOS } from "../consejos";
import { es } from "../../i18n/es";
import type { StepProps } from "./types";

// Mismo contrato que el bloque de ideas del Dashboard (generador temas_canal)
interface TemaSugerido {
  titulo: string;
  angulo: string | null;
  porQueFunciona: string | null;
  formato: string;
  dificultad: string;
}

const TIPOS = [
  { v: "evergreen", t: "Evergreen", d: "Vídeo atemporal que acumula vistas meses" },
  { v: "sprint", t: "Sprint", d: "Vive de los primeros 7 días (tendencia, noticia)" },
  { v: "mixto", t: "Mixto", d: "Arranque fuerte + cola larga" },
] as const;

const FORMATOS = [
  { v: "long", t: "Largo" },
  { v: "short", t: "Short" },
  { v: "live", t: "Directo" },
  { v: "podcast", t: "Podcast" },
] as const;

export function StepIdea({ video, patch }: StepProps) {
  const usarTema = (tema: TemaSugerido) => {
    const brief = [tema.angulo, tema.porQueFunciona].filter(Boolean).join(" ").slice(0, 500);
    patch({
      tituloIdea: tema.titulo.slice(0, 200),
      ...(video.descripcionCorta.trim() === "" && brief ? { descripcionCorta: brief } : {}),
      formato: tema.formato === "short" ? "short" : "long",
    });
  };

  return (
    <>
      <div className="field">
        <LabelConTip htmlFor="f-idea" tip={CONSEJOS.idea.campos.tituloIdea}>
          ¿Sobre qué va tu próximo vídeo?
        </LabelConTip>
        <input
          id="f-idea"
          className="input"
          data-testid="field-titulo-idea"
          value={video.tituloIdea}
          maxLength={200}
          placeholder="Ej: Cómo grabar audio profesional sin micro caro"
          onChange={(e) => patch({ tituloIdea: e.target.value })}
        />
        <CharCount len={video.tituloIdea.length} ideal={120} max={200} />
      </div>

      {/* T024: ideas amplias reutilizando temas_canal (mismo render que el Dashboard) + "Usar esta" */}
      <details className="acordeon" data-testid="sugerir-ideas">
        <summary>{es.fieldIA.sugerirIdeas}</summary>
        <div className="acordeon-body">
          <AiBlock
            tipo="temas_canal"
            etiqueta={es.ideas.etiqueta}
            tip={es.ideas.tip}
            render={(resultados, parseFallido) => {
              if (parseFallido || !resultados.length) {
                return (
                  <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{es.ideas.parseFallido}</p>
                );
              }
              const temas = resultados as TemaSugerido[];
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {temas.map((tema, i) => (
                    <div
                      key={i}
                      className="card"
                      data-testid={`idea-tema-${i}`}
                      style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
                    >
                      <p style={{ fontWeight: 700 }}>{tema.titulo}</p>
                      {tema.angulo && (
                        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>{tema.angulo}</p>
                      )}
                      {tema.porQueFunciona && <p style={{ fontSize: "var(--text-sm)" }}>{tema.porQueFunciona}</p>}
                      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                        <span className="tag">{es.ideas.formato[tema.formato] ?? tema.formato}</span>
                        <span className="tag">{es.ideas.dificultad[tema.dificultad] ?? tema.dificultad}</span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ marginLeft: "auto" }}
                          data-testid={`idea-usar-${i}`}
                          onClick={() => usarTema(tema)}
                        >
                          {es.fieldIA.usarEsta}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </div>
      </details>

      <div className="field">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <LabelConTip htmlFor="f-brief" tip={CONSEJOS.idea.campos.descripcionCorta}>
            Cuéntalo en 2–3 frases
          </LabelConTip>
          <FieldIA
            campoId="descripcionCorta"
            videoProjectId={video.id}
            modo="texto"
            valoresActuales={[video.descripcionCorta]}
            onUsar={(texto) => patch({ descripcionCorta: texto.slice(0, 500) })}
          />
        </div>
        <textarea
          id="f-brief"
          className="textarea"
          data-testid="field-descripcion-corta"
          value={video.descripcionCorta}
          maxLength={500}
          placeholder="Qué problema resuelve, a quién va dirigido y por qué tú"
          onChange={(e) => patch({ descripcionCorta: e.target.value })}
        />
      </div>

      <div className="field">
        <span className="label">Tipo de vídeo</span>
        <div className="radio-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {TIPOS.map(({ v, t, d }) => {
            const tipKey = `tipo${v.charAt(0).toUpperCase()}${v.slice(1)}` as keyof typeof CONSEJOS.idea.campos;
            return (
              <button
                key={v}
                type="button"
                className={`radio-card${video.tipo === v ? " selected" : ""}`}
                data-testid={`field-tipo-${v}`}
                data-tip={CONSEJOS.idea.campos[tipKey]}
                onClick={() => patch({ tipo: v })}
              >
                <strong>{t}</strong>
                <span>{d}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <span className="label">Formato</span>
        <div className="chips">
          {FORMATOS.map(({ v, t }) => (
            <button
              key={v}
              type="button"
              className={`chip${video.formato === v ? " active" : ""}`}
              data-testid={`field-formato-${v}`}
              onClick={() => patch({ formato: v })}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <LabelConTip htmlFor="f-nicho" tip={CONSEJOS.idea.campos.nicho}>
          Nicho
        </LabelConTip>
        <input
          id="f-nicho"
          className="input"
          data-testid="field-nicho"
          value={video.nicho}
          maxLength={60}
          onChange={(e) => patch({ nicho: e.target.value })}
        />
      </div>
    </>
  );
}
