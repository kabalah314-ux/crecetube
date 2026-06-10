// Etapa 4 · miniatura (02 §2.4.4)
import { useRef, useState } from "react";
import { Upload, Eye } from "lucide-react";
import { AiBlock } from "../AiBlock";
import { useStore } from "../../store/useStore";
import type { StepProps } from "./types";
import type { VideoProject } from "../../types";

const ESTRATEGIAS = ["SEOmarco", "SEOcara", "SEOflecha", "otra"] as const;
const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"];

export function StepMiniatura({ video, patch }: StepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [simulaGrilla, setSimulaGrilla] = useState(false);
  const toast = useStore((s) => s.toast);

  const subir = async (file: File, alternativa: boolean) => {
    if (!TIPOS_OK.includes(file.type)) {
      toast("error", "Formato no válido: usa JPG, PNG o WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("info", "Ojo: YouTube no acepta miniaturas de más de 2MB. La guardo igualmente.");
    }
    setSubiendo(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/miniatura${alternativa ? "?alternativa=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error();
      const { video: actualizado } = (await res.json()) as { video: VideoProject };
      patch({ miniatura: actualizado.miniatura });
    } catch {
      toast("error", "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  };

  const palabras = video.miniatura.palabrasMiniatura.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <div className="field">
        <span className="label">Estrategia visual</span>
        <div className="chips">
          {ESTRATEGIAS.map((e) => (
            <button
              key={e}
              type="button"
              className={`chip${video.miniatura.estrategia === e ? " active" : ""}`}
              data-testid={`field-miniatura-estrategia-${e.toLowerCase()}`}
              onClick={() => patch({ miniatura: { ...video.miniatura, estrategia: e } })}
            >
              {e}
            </button>
          ))}
        </div>
        <p className="field-hint">SEOmarco = borde llamativo · SEOcara = rostro 40-60% · SEOflecha = flecha guía (s5)</p>
      </div>

      <div className="field">
        <label className="label" htmlFor="f-palabras-mini">
          Palabras impresas (3–5)
        </label>
        <input
          id="f-palabras-mini"
          className="input"
          style={{ maxWidth: 420 }}
          data-testid="field-palabras-miniatura"
          value={video.miniatura.palabrasMiniatura}
          placeholder="AUDIO PRO SIN MICRO"
          onChange={(e) => patch({ miniatura: { ...video.miniatura, palabrasMiniatura: e.target.value } })}
        />
        <span className={`char-count${palabras > 5 ? " over" : ""}`}>{palabras} palabra(s)</span>
      </div>

      <div className="field">
        <label className="label" htmlFor="f-brief-mini">
          Brief de diseño
        </label>
        <textarea
          id="f-brief-mini"
          className="textarea"
          data-testid="field-brief-miniatura"
          value={video.miniatura.briefIA ?? ""}
          placeholder="Composición, paleta, qué NO hacer… (o genera uno con IA)"
          onChange={(e) => patch({ miniatura: { ...video.miniatura, briefIA: e.target.value || null } })}
        />
      </div>

      <AiBlock
        tipo="miniatura_brief"
        videoProjectId={video.id}
        etiqueta="Generar brief con IA"
        opciones={{ estrategia: video.miniatura.estrategia ?? "otra", palabrasMiniatura: video.miniatura.palabrasMiniatura }}
        disabledExtra={!video.miniatura.estrategia ? "Elige antes una estrategia" : null}
        render={(resultados) => {
          const r = resultados[0] as { texto: string; palabrasSugeridas?: string[] };
          return (
            <div className="ai-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "var(--space-3)" }}>
              <pre className="ai-raw">{r?.texto}</pre>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => patch({ miniatura: { ...video.miniatura, briefIA: r.texto } })}
                >
                  Usar este brief
                </button>
                {r?.palabrasSugeridas?.length ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => patch({ miniatura: { ...video.miniatura, palabrasMiniatura: r.palabrasSugeridas!.join(" ") } })}
                  >
                    Usar palabras: {r.palabrasSugeridas.join(" ")}
                  </button>
                ) : null}
              </div>
            </div>
          );
        }}
      />

      <div className="field" style={{ marginTop: "var(--space-5)" }}>
        <span className="label">Miniatura principal</span>
        {video.miniatura.urlPrincipal ? (
          <div className={simulaGrilla ? "grilla-sim" : ""}>
            <img
              src={video.miniatura.urlPrincipal}
              alt="Miniatura principal del vídeo"
              className="mini-preview"
              style={simulaGrilla ? { width: 168, height: 94, objectFit: "cover" } : undefined}
            />
            {simulaGrilla && (
              <>
                <div className="mini-fake" />
                <div className="mini-fake" />
                <div className="mini-fake" />
              </>
            )}
          </div>
        ) : (
          <p className="field-hint">Aún no hay miniatura subida.</p>
        )}
        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
          <input
            ref={fileRef}
            type="file"
            accept={TIPOS_OK.join(",")}
            hidden
            data-testid="field-miniatura-file"
            onChange={(e) => e.target.files?.[0] && subir(e.target.files[0], false)}
          />
          <input
            ref={altRef}
            type="file"
            accept={TIPOS_OK.join(",")}
            hidden
            data-testid="field-miniatura-file-alt"
            onChange={(e) => e.target.files?.[0] && subir(e.target.files[0], true)}
          />
          <button type="button" className="btn btn-secondary btn-sm" disabled={subiendo} onClick={() => fileRef.current?.click()}>
            {subiendo ? <span className="spinner" /> : <Upload size={14} />} Subir principal
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={subiendo} onClick={() => altRef.current?.click()}>
            <Upload size={14} /> Subir variante A/B
          </button>
          {video.miniatura.urlPrincipal && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              data-testid="btn-simular-grilla"
              onClick={() => setSimulaGrilla(!simulaGrilla)}
            >
              <Eye size={14} /> {simulaGrilla ? "Vista normal" : "Ver a tamaño búsqueda"}
            </button>
          )}
        </div>
        {video.miniatura.urlsAlternativas.length > 0 && (
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
            {video.miniatura.urlsAlternativas.map((u) => (
              <img key={u} src={u} alt="Variante de miniatura" style={{ width: 120, borderRadius: 6 }} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
