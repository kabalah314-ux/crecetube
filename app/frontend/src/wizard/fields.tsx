// fields.tsx — controles reutilizables del wizard.
import { useState, type KeyboardEvent } from "react";
import { Plus, Trash2, Video as VideoIcon } from "lucide-react";

export function CharCount({ len, ideal, max }: { len: number; ideal: number; max: number }) {
  const cls = len > max ? "over" : len > ideal ? "warn" : "";
  return (
    <span className={`char-count ${cls}`}>
      {len}/{max}
    </span>
  );
}

/** Chips con añadir/quitar (palabras clave, hashtags…) */
export function ChipsEditor({
  valores,
  max,
  placeholder,
  testid,
  onChange,
  normaliza,
}: {
  valores: string[];
  max: number;
  placeholder: string;
  testid: string;
  onChange: (v: string[]) => void;
  normaliza?: (s: string) => string;
}) {
  const [texto, setTexto] = useState("");
  const [shake, setShake] = useState(false);

  const añadir = () => {
    const limpio = (normaliza ? normaliza(texto) : texto).trim();
    if (!limpio) return;
    if (valores.includes(limpio) || valores.length >= max) {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    onChange([...valores, limpio]);
    setTexto("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      añadir();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "var(--space-2)" }} className={shake ? "shake" : ""}>
        <input
          className="input"
          value={texto}
          placeholder={placeholder}
          data-testid={testid}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={onKey}
        />
        <button type="button" className="btn btn-secondary" onClick={añadir} aria-label="Añadir" data-testid={`${testid}-add`}>
          <Plus size={16} />
        </button>
      </div>
      <div className="field-hint">
        {valores.length}/{max}
      </div>
      {valores.length > 0 && (
        <div className="chips" style={{ marginTop: "var(--space-2)" }}>
          {valores.map((v) => (
            <span key={v} className="chip active" style={{ cursor: "default" }}>
              {v}
              <button
                type="button"
                aria-label={`Quitar ${v}`}
                style={{ all: "unset", cursor: "pointer", display: "inline-flex" }}
                onClick={() => onChange(valores.filter((x) => x !== v))}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Lista editable de textos (preguntas SEO…) */
export function ListEditor({
  valores,
  max,
  placeholder,
  testid,
  onChange,
}: {
  valores: string[];
  max: number;
  placeholder: string;
  testid: string;
  onChange: (v: string[]) => void;
}) {
  const [texto, setTexto] = useState("");
  const añadir = () => {
    const limpio = texto.trim();
    if (!limpio || valores.length >= max) return;
    onChange([...valores, limpio]);
    setTexto("");
  };
  return (
    <div>
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <input
          className="input"
          value={texto}
          placeholder={placeholder}
          data-testid={testid}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              añadir();
            }
          }}
        />
        <button type="button" className="btn btn-secondary" onClick={añadir} aria-label="Añadir" data-testid={`${testid}-add`}>
          <Plus size={16} />
        </button>
      </div>
      <div className="field-hint">
        {valores.length}/{max}
      </div>
      <ul className="lista-simple">
        {valores.map((v, i) => (
          <li key={`${v}-${i}`}>
            <span>{v}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-label={`Quitar "${v}"`}
              onClick={() => onChange(valores.filter((_, j) => j !== i))}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Referencias de competencia: url + notas */
export function RefsEditor({
  valores,
  onChange,
}: {
  valores: Array<{ url: string; notas: string }>;
  onChange: (v: Array<{ url: string; notas: string }>) => void;
}) {
  const setRow = (i: number, row: { url: string; notas: string }) =>
    onChange(valores.map((r, j) => (j === i ? row : r)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {valores.map((r, i) => (
        <div key={i} className="ref-row">
          <VideoIcon size={16} style={{ color: "var(--text-tertiary)", flex: "none" }} />
          <input
            className="input"
            placeholder="https://youtube.com/watch?v=…"
            value={r.url}
            data-testid={`field-competencia-url-${i}`}
            onChange={(e) => setRow(i, { ...r, url: e.target.value })}
          />
          <input
            className="input"
            placeholder="Qué hace bien / mal"
            value={r.notas}
            data-testid={`field-competencia-notas-${i}`}
            onChange={(e) => setRow(i, { ...r, notas: e.target.value })}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label="Quitar referencia"
            onClick={() => onChange(valores.filter((_, j) => j !== i))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        style={{ alignSelf: "flex-start" }}
        data-testid="field-competencia-add"
        onClick={() => onChange([...valores, { url: "", notas: "" }])}
      >
        <Plus size={14} /> Añadir referencia
      </button>
    </div>
  );
}
