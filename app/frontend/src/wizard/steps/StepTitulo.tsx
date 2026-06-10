// Etapa 3 · titulo (02 §2.4.3)
import { ArrowUp, Trash2, Check } from "lucide-react";
import { AiBlock } from "../AiBlock";
import { CharCount } from "../fields";
import type { StepProps } from "./types";

export function StepTitulo({ video, patch }: StepProps) {
  const usarComoFinal = (alt: string) => {
    const previo = video.tituloFinal;
    const alternativos = video.titulosAlternativos.filter((t) => t !== alt);
    if (previo && !alternativos.includes(previo) && alternativos.length < 9) alternativos.push(previo);
    patch({ tituloFinal: alt, titulosAlternativos: alternativos });
  };

  const kwIncluida = video.tituloFinal
    ? video.palabrasClave.find((k) => video.tituloFinal!.toLowerCase().includes(k.toLowerCase()))
    : undefined;

  return (
    <>
      <div className="field">
        <label className="label" htmlFor="f-titulo-final">
          Título final
        </label>
        <input
          id="f-titulo-final"
          className="input"
          data-testid="field-titulo-final"
          value={video.tituloFinal ?? ""}
          maxLength={100}
          placeholder="El título que verá YouTube (≤60 ideal)"
          onChange={(e) => patch({ tituloFinal: e.target.value || null })}
        />
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center", marginTop: 4 }}>
          <CharCount len={(video.tituloFinal ?? "").length} ideal={60} max={100} />
          {video.tituloFinal && video.tituloFinal.length <= 60 && (
            <span className="field-hint" style={{ margin: 0, color: "var(--accent-mint)" }}>
              <Check size={12} style={{ display: "inline" }} /> ≤60
            </span>
          )}
          {kwIncluida && (
            <span className="field-hint" style={{ margin: 0, color: "var(--accent-mint)" }}>
              <Check size={12} style={{ display: "inline" }} /> kw “{kwIncluida}”
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <span className="label">Alternativas ({video.titulosAlternativos.length}/9)</span>
        <ul className="lista-simple">
          {video.titulosAlternativos.map((t) => (
            <li key={t}>
              <span>{t}</span>
              <span style={{ display: "inline-flex", gap: 4 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  data-tip="Usar como título final"
                  aria-label={`Usar "${t}" como final`}
                  onClick={() => usarComoFinal(t)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label={`Eliminar "${t}"`}
                  onClick={() => patch({ titulosAlternativos: video.titulosAlternativos.filter((x) => x !== t) })}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <AiBlock
        tipo="titulo"
        videoProjectId={video.id}
        etiqueta="Generar 9 títulos con IA"
        render={(resultados, parseFallido) =>
          parseFallido ? (
            <pre className="ai-raw">{(resultados[0] as { texto: string })?.texto}</pre>
          ) : (
            <ul className="ai-cards">
              {(resultados as Array<{ texto: string; angulo: string }>).map((r, i) => (
                <li key={i} className="ai-card" data-testid={`ai-result-${i}`}>
                  <span>
                    {r.texto}{" "}
                    <span className="tag" style={{ ["--tag-color" as never]: "var(--accent-gold)" }}>
                      {r.angulo}
                    </span>
                  </span>
                  <span style={{ display: "inline-flex", gap: 4 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={video.titulosAlternativos.length >= 9 || video.titulosAlternativos.includes(r.texto)}
                      onClick={() => patch({ titulosAlternativos: [...video.titulosAlternativos, r.texto] })}
                    >
                      Guardar
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => usarComoFinal(r.texto)}>
                      Elegir
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )
        }
      />

      <div className="field" style={{ marginTop: "var(--space-5)" }}>
        <label className="label" htmlFor="f-hashtag-titulo">
          Hashtag en el título (máx 1, opcional)
        </label>
        <input
          id="f-hashtag-titulo"
          className="input"
          style={{ maxWidth: 280 }}
          data-testid="field-hashtag-titulo"
          value={video.hashtags.titulo[0] ?? ""}
          placeholder="#audio"
          onChange={(e) => {
            const v = e.target.value.trim();
            patch({ hashtags: { ...video.hashtags, titulo: v ? [v] : [] } });
          }}
        />
        <p className="field-hint">Si lo usas, irá al final del título. Regla: corto y reconocible (s6_a6).</p>
      </div>
    </>
  );
}
