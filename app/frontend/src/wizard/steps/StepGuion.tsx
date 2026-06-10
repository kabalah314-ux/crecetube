// Etapa 5 · guion (02 §2.4.5) — bloques reordenables drag&drop + botones.
import { useState } from "react";
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { AiBlock } from "../AiBlock";
import type { StepProps } from "./types";
import type { BloqueGuion } from "../../types";

const fmt = (seg: number) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;

const CAMPOS_SEO: Array<{ k: "seoShock" | "seoInicio" | "seoLoop" | "seoResultado" | "psicoCta"; label: string; tip: string }> = [
  { k: "seoShock", label: "SEOshock", tip: "Gancho fuerte: dato, conflicto o demostración (s9_a3)" },
  { k: "seoInicio", label: "SEOinicio", tip: "Apertura 0:00-0:20 que promete el resultado (s9_a2)" },
  { k: "seoLoop", label: "SEOloop", tip: "Promesa diferida que se resuelve al final (s9_a4)" },
  { k: "seoResultado", label: "SEOresultado", tip: "El desenlace que cumple la promesa (s9_a8)" },
  { k: "psicoCta", label: "PsicoCTA", tip: "Llamada a la acción conectada al beneficio (s9_a9)" },
];

export function StepGuion({ video, patch }: StepProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const bloques = video.guion.desarrollo;

  const setBloques = (desarrollo: BloqueGuion[]) => {
    const duracionTotalEstimadaSeg = desarrollo.reduce((a, b) => a + (b.duracionSegundos || 0), 0) + 60;
    patch({ guion: { ...video.guion, desarrollo, duracionTotalEstimadaSeg } });
  };

  const setBloque = (i: number, b: Partial<BloqueGuion>) =>
    setBloques(bloques.map((x, j) => (j === i ? { ...x, ...b } : x)));

  const mover = (i: number, j: number) => {
    if (j < 0 || j >= bloques.length) return;
    const copia = [...bloques];
    const [b] = copia.splice(i, 1);
    copia.splice(j, 0, b);
    setBloques(copia);
  };

  return (
    <>
      {CAMPOS_SEO.slice(0, 3).map(({ k, label, tip }) => (
        <div className="field" key={k}>
          <label className="label" htmlFor={`f-${k}`} data-tip={tip}>
            {label} <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>ⓘ</span>
          </label>
          <textarea
            id={`f-${k}`}
            className="textarea"
            style={{ minHeight: 64 }}
            data-testid={`field-${k.toLowerCase()}`}
            value={video.guion[k]}
            onChange={(e) => patch({ guion: { ...video.guion, [k]: e.target.value } })}
          />
        </div>
      ))}

      <AiBlock
        tipo="hook"
        videoProjectId={video.id}
        etiqueta="Generar ganchos con IA"
        render={(resultados) => (
          <ul className="ai-cards">
            {(resultados as Array<{ texto: string; tipo: string; usoSugerido: string }>).map((r, i) => (
              <li key={i} className="ai-card" style={{ flexDirection: "column", alignItems: "stretch" }} data-testid={`ai-result-${i}`}>
                <span>
                  {r.texto}{" "}
                  <span className="tag" style={{ ["--tag-color" as never]: "var(--accent-gold)" }}>
                    {r.tipo}
                  </span>
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(["seoShock", "seoInicio", "seoLoop"] as const).map((destino) => (
                    <button
                      key={destino}
                      type="button"
                      className={`btn btn-sm ${r.usoSugerido === destino ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => patch({ guion: { ...video.guion, [destino]: r.texto } })}
                    >
                      → {destino}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      />

      <div className="field" style={{ marginTop: "var(--space-5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="label">Desarrollo</span>
          <span className="mono" style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            Σ {fmt(video.guion.duracionTotalEstimadaSeg)} estimado
          </span>
        </div>

        <div className="bloques">
          {bloques.map((b, i) => (
            <div
              key={i}
              className={`bloque${dragIdx === i ? " dragging" : ""}`}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragEnd={() => setDragIdx(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== i) mover(dragIdx, i);
                setDragIdx(null);
              }}
              data-testid={`guion-bloque-${i}`}
            >
              <div className="bloque-head">
                <GripVertical size={16} style={{ cursor: "grab", color: "var(--text-tertiary)" }} />
                <input
                  className="input"
                  style={{ flex: 1 }}
                  placeholder={`Bloque ${i + 1} — título`}
                  value={b.titulo}
                  data-testid={`guion-bloque-titulo-${i}`}
                  onChange={(e) => setBloque(i, { titulo: e.target.value })}
                />
                <input
                  className="input mono"
                  style={{ width: 90 }}
                  type="number"
                  min={0}
                  aria-label="Duración en segundos"
                  value={b.duracionSegundos || ""}
                  placeholder="seg"
                  onChange={(e) => setBloque(i, { duracionSegundos: Number(e.target.value) || 0 })}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <button type="button" className="btn btn-ghost btn-sm" aria-label="Subir bloque" onClick={() => mover(i, i - 1)}>
                    <ChevronUp size={14} />
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" aria-label="Bajar bloque" onClick={() => mover(i, i + 1)}>
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Eliminar bloque"
                  onClick={() => setBloques(bloques.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                className="textarea"
                style={{ minHeight: 72 }}
                placeholder="Contenido del bloque"
                value={b.contenido}
                onChange={(e) => setBloque(i, { contenido: e.target.value })}
              />
              <div className="chips">
                {(
                  [
                    ["roturaPatron", "Rotura de patrón"],
                    ["seoReset", "SEOreset"],
                    ["seoZoom", "SEOzoom"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    className={`chip${b[k] ? " active" : ""}`}
                    data-testid={`guion-bloque-${i}-${k.toLowerCase()}`}
                    onClick={() => setBloque(i, { [k]: !b[k] } as Partial<BloqueGuion>)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: "var(--space-3)" }}
          data-testid="guion-add-bloque"
          onClick={() =>
            setBloques([
              ...bloques,
              { titulo: "", duracionSegundos: 0, contenido: "", roturaPatron: false, seoReset: false, seoZoom: false },
            ])
          }
        >
          <Plus size={14} /> Añadir bloque
        </button>
      </div>

      {CAMPOS_SEO.slice(3).map(({ k, label, tip }) => (
        <div className="field" key={k}>
          <label className="label" htmlFor={`f-${k}`} data-tip={tip}>
            {label} <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>ⓘ</span>
          </label>
          <textarea
            id={`f-${k}`}
            className="textarea"
            style={{ minHeight: 64 }}
            data-testid={`field-${k.toLowerCase()}`}
            value={video.guion[k]}
            onChange={(e) => patch({ guion: { ...video.guion, [k]: e.target.value } })}
          />
        </div>
      ))}

      <div className="field">
        <label className="label" htmlFor="f-cliffhanger" data-tip="Anticipa el próximo vídeo justo antes del PsicoCTA (s9_a10)">
          Cliffhanger (opcional) <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>ⓘ</span>
        </label>
        <textarea
          id="f-cliffhanger"
          className="textarea"
          style={{ minHeight: 56 }}
          data-testid="field-cliffhanger"
          value={video.guion.cliffhanger ?? ""}
          onChange={(e) => patch({ guion: { ...video.guion, cliffhanger: e.target.value || null } })}
        />
      </div>
    </>
  );
}
