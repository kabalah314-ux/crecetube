// AiBlock — 06 §6.7.6 + 02 §2.3.6. En Sprint 2 los generadores aún no existen en el
// backend (llegan en Sprint 5): el botón ya respeta el estado "sin configurar".
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw } from "lucide-react";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";

interface Props {
  tipo: string;
  videoProjectId: string;
  etiqueta: string;
  opciones?: Record<string, unknown>;
  /** recibe la respuesta parseada del backend y la pinta como cards */
  render: (resultados: unknown[], parseFallido: boolean) => ReactNode;
  disabledExtra?: string | null;
  /** Tooltip Romuald anclado en la cabecera del bloque IA */
  tip?: string;
}

export function AiBlock({ tipo, videoProjectId, etiqueta, opciones, render, disabledExtra, tip }: Props) {
  const profile = useStore((s) => s.profile);
  const toast = useStore((s) => s.toast);
  const configurada = profile?.iaConfig.apiKey === "***";
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<unknown[] | null>(null);
  const [parseFallido, setParseFallido] = useState(false);

  const generar = async () => {
    setCargando(true);
    try {
      const r = await api.post<{ resultados: unknown[]; parseFallido: boolean }>("/api/ia/generar", {
        tipo,
        videoProjectId,
        opciones: opciones ?? {},
      });
      setResultados(r.resultados);
      setParseFallido(r.parseFallido);
    } catch (e) {
      if (isApiError(e) && e.code === "NOT_FOUND") {
        toast("info", "Los generadores IA se activan en el Sprint 5 del roadmap.");
      } else {
        toast("error", isApiError(e) ? e.message : "Error generando");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="ai-block" aria-label={`Generador IA: ${etiqueta}`}>
      <div className="ai-head" {...(tip ? { "data-tip": tip } : {})}>
        <Sparkles size={18} />
        <strong>{etiqueta}</strong>
      </div>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
        {configurada ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={generar}
            disabled={cargando || Boolean(disabledExtra)}
            data-testid={`ai-generate-${tipo}`}
            {...(disabledExtra ? { "data-tip": disabledExtra } : {})}
          >
            {cargando ? (
              <>
                <span className="spinner" /> Pensando…
              </>
            ) : resultados ? (
              <>
                <RefreshCw size={14} /> Regenerar
              </>
            ) : (
              "Generar"
            )}
          </button>
        ) : (
          <span data-tip={es.wizard.iaNoConfigurada}>
            <button className="btn btn-primary btn-sm" disabled data-testid={`ai-generate-${tipo}`}>
              Generar
            </button>
          </span>
        )}
        {!configurada && (
          <Link to="/configuracion" className="field-hint" style={{ margin: 0 }}>
            {es.wizard.iaNoConfigurada}
          </Link>
        )}
      </div>
      {resultados && <div className="ai-results">{render(resultados, parseFallido)}</div>}
    </section>
  );
}
