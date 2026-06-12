// AiBlock — 06 §6.7.6 + 02 §2.3.6. En Sprint 2 los generadores aún no existen en el
// backend (llegan en Sprint 5): el botón ya respeta el estado "sin configurar".
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, Lock } from "lucide-react";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";

interface Props {
  tipo: string;
  /** opcional: los generadores de canal (temas_canal, evaluacion_nicho) no van ligados a un vídeo */
  videoProjectId?: string | null;
  etiqueta: string;
  opciones?: Record<string, unknown>;
  /** recibe la respuesta parseada del backend y la pinta como cards */
  render: (resultados: unknown[], parseFallido: boolean) => ReactNode;
  disabledExtra?: string | null;
  /** Tooltip Romuald anclado en la cabecera del bloque IA */
  tip?: string;
}

/** T022: enlace al paso que falta según el pasoSlug que devuelve el backend. */
function enlacePaso(pasoSlug: string, videoProjectId?: string | null): string | null {
  if (pasoSlug === "configuracion") return "/configuracion";
  if (pasoSlug === "viabilidad") return "/viabilidad";
  if (videoProjectId && videoProjectId !== "viabilidad") return `/videos/${videoProjectId}/wizard/${pasoSlug}`;
  return null;
}

export function AiBlock({ tipo, videoProjectId, etiqueta, opciones, render, disabledExtra, tip }: Props) {
  const profile = useStore((s) => s.profile);
  const toast = useStore((s) => s.toast);
  const configurada = profile?.iaConfig.apiKey === "***";
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<unknown[] | null>(null);
  const [parseFallido, setParseFallido] = useState(false);
  // T022: bloqueo duro — el backend rechaza con REQUISITO_FALTANTE si falta un paso del método
  const [bloqueado, setBloqueado] = useState<{ mensaje: string; pasoSlug: string } | null>(null);

  const generar = async () => {
    setCargando(true);
    try {
      const r = await api.post<{ resultados: unknown[]; parseFallido: boolean }>("/api/ia/generar", {
        tipo,
        videoProjectId: videoProjectId ?? null,
        opciones: opciones ?? {},
      });
      setBloqueado(null);
      setResultados(r.resultados);
      setParseFallido(r.parseFallido);
    } catch (e) {
      if (isApiError(e) && e.code === "REQUISITO_FALTANTE") {
        const det = Array.isArray(e.details) ? (e.details[0] as { pasoSlug?: string } | undefined) : undefined;
        setBloqueado({ mensaje: e.message, pasoSlug: det?.pasoSlug ?? "" });
      } else if (isApiError(e) && e.code === "NOT_FOUND") {
        toast("info", "Los generadores IA se activan en el Sprint 5 del roadmap.");
      } else {
        toast("error", isApiError(e) ? e.message : "Error generando");
      }
    } finally {
      setCargando(false);
    }
  };

  const enlaceBloqueo = bloqueado ? enlacePaso(bloqueado.pasoSlug, videoProjectId) : null;

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
            disabled={cargando || Boolean(disabledExtra) || Boolean(bloqueado)}
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
      {bloqueado && (
        <div className="ai-bloqueado" data-testid="aiblock-bloqueado" role="alert">
          <Lock size={16} className="ai-bloqueado-icono" aria-hidden />
          <div>
            <strong className="ai-bloqueado-titulo">{es.wizard.bloqueadoTitulo}</strong>
            <p className="ai-bloqueado-mensaje">{bloqueado.mensaje}</p>
            {enlaceBloqueo && (
              <Link to={enlaceBloqueo} className="ai-bloqueado-enlace" data-testid="aiblock-bloqueado-ir">
                {es.wizard.bloqueadoIrAlPaso}
              </Link>
            )}
          </div>
        </div>
      )}
      {resultados && <div className="ai-results">{render(resultados, parseFallido)}</div>}
    </section>
  );
}
