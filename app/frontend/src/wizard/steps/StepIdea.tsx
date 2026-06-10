// Etapa 1 · idea (02 §2.4.1)
import { CharCount } from "../fields";
import type { StepProps } from "./types";

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
  return (
    <>
      <div className="field">
        <label className="label" htmlFor="f-idea">
          ¿Sobre qué va tu próximo vídeo?
        </label>
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

      <div className="field">
        <label className="label" htmlFor="f-brief">
          Cuéntalo en 2–3 frases
        </label>
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
        <span className="label" data-tip="Sprint vive de los 7 primeros días; evergreen acumula durante meses (s3_a1)">
          Tipo de vídeo
        </span>
        <div className="radio-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {TIPOS.map(({ v, t, d }) => (
            <button
              key={v}
              type="button"
              className={`radio-card${video.tipo === v ? " selected" : ""}`}
              data-testid={`field-tipo-${v}`}
              onClick={() => patch({ tipo: v })}
            >
              <strong>{t}</strong>
              <span>{d}</span>
            </button>
          ))}
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
        <label className="label" htmlFor="f-nicho">
          Nicho
        </label>
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
