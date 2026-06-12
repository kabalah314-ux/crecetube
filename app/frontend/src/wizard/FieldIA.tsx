// FieldIA — T024: botón ✨ por campo + popover de sugerencias IA (generador rellenar_campo).
// Copia el patrón de gating apiKey / bloqueo REQUISITO_FALTANTE de AiBlock.tsx sin importarlo:
// este componente es la versión compacta para la fila del label de cada campo.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Plus, RefreshCw, Sparkles, X } from "lucide-react";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import { CAMPOS_IA, type ModoFieldIA } from "./camposIA";

export interface BloqueSugerido {
  titulo: string;
  contenido: string;
  duracionSegundos: number;
}

interface Props {
  campoId: string;
  videoProjectId: string | null;
  modo: ModoFieldIA;
  /** Contexto extra que viaja en opciones (valores actuales del formulario, antirepetición…) */
  getContexto?: () => Record<string, unknown>;
  /** Modo texto: recibe la sugerencia elegida. Modo lista: se llama una vez por elemento añadido. */
  onUsar: (texto: string) => void;
  /** Modo bloques: recibe el bloque a añadir (p. ej. a guion.desarrollo) */
  onUsarBloque?: (b: BloqueSugerido) => void;
  /** Modo lista: valores ya presentes (dedupe/tope). Modo texto: [valorActual] para confirmar antes de pisar. */
  valoresActuales?: string[];
  max?: number;
  etiqueta?: string;
}

/** T022: enlace al paso que falta según el pasoSlug que devuelve el backend (patrón AiBlock). */
function enlacePaso(pasoSlug: string, videoProjectId: string | null): string | null {
  if (pasoSlug === "configuracion") return "/configuracion";
  if (pasoSlug === "viabilidad") return "/viabilidad";
  if (videoProjectId && videoProjectId !== "viabilidad") return `/videos/${videoProjectId}/wizard/${pasoSlug}`;
  return null;
}

interface RespuestaGenerar {
  interactionId: string;
  resultados: unknown[];
  parseFallido: boolean;
}

export function FieldIA({
  campoId,
  videoProjectId,
  modo,
  getContexto,
  onUsar,
  onUsarBloque,
  valoresActuales,
  max,
  etiqueta,
}: Props) {
  const profile = useStore((s) => s.profile);
  const toast = useStore((s) => s.toast);
  const configurada = profile?.iaConfig.apiKey === "***";
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<unknown[] | null>(null);
  const [parseFallido, setParseFallido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bloqueo duro del método: el backend rechaza con REQUISITO_FALTANTE si falta un paso (T022)
  const [bloqueado, setBloqueado] = useState<{ mensaje: string; pasoSlug: string } | null>(null);
  // Modo bloques: índices ya añadidos para no insertar el mismo bloque dos veces
  const [bloquesAnadidos, setBloquesAnadidos] = useState<ReadonlySet<number>>(new Set());
  const wrapRef = useRef<HTMLSpanElement>(null);

  const titulo = etiqueta ?? es.fieldIA.rellenarConIA;

  // Cierre por click-fuera y Escape (no existe otro popover en el proyecto)
  useEffect(() => {
    if (!abierto) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAbierto(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [abierto]);

  const generar = async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await api.post<RespuestaGenerar>("/api/ia/generar", {
        tipo: "rellenar_campo",
        videoProjectId,
        opciones: { campoId, reglaCampo: CAMPOS_IA[campoId]?.regla, ...(getContexto?.() ?? {}) },
      });
      setBloqueado(null);
      setResultados(r.resultados);
      setParseFallido(r.parseFallido);
      setBloquesAnadidos(new Set());
    } catch (e) {
      if (isApiError(e) && e.code === "REQUISITO_FALTANTE") {
        const det = Array.isArray(e.details) ? (e.details[0] as { pasoSlug?: string } | undefined) : undefined;
        setBloqueado({ mensaje: e.message, pasoSlug: det?.pasoSlug ?? "" });
      } else {
        // Error genérico (500, red, AI_NOT_CONFIGURED): toast como AiBlock + texto en el popover
        const msg = isApiError(e) ? e.message : "Error generando";
        setError(msg);
        toast("error", msg);
      }
    } finally {
      setCargando(false);
    }
  };

  const alternar = () => {
    if (abierto) {
      setAbierto(false);
      return;
    }
    setAbierto(true);
    // Reintenta también tras un bloqueo: comprobar requisitos no consume tokens
    if (!resultados && !cargando) void generar();
  };

  // Sugerencias de texto plano ({texto}) — modos "texto" y "lista"
  const sugerencias: string[] = (resultados ?? [])
    .map((r) => {
      const t = (r as { texto?: unknown } | null)?.texto;
      return typeof t === "string" ? t.trim() : "";
    })
    .filter(Boolean);

  // Bloques de guion ({titulo, contenido, duracionSegundos}) — modo "bloques"
  const bloques: BloqueSugerido[] = (resultados ?? [])
    .map((r) => r as Partial<BloqueSugerido> | null)
    .filter((b): b is Partial<BloqueSugerido> => typeof b?.titulo === "string" && typeof b?.contenido === "string")
    .map((b) => ({
      titulo: b.titulo as string,
      contenido: b.contenido as string,
      duracionSegundos: typeof b.duracionSegundos === "number" ? b.duracionSegundos : 0,
    }));

  const usarTexto = (texto: string) => {
    // Patrón StepPublicacion: confirmar antes de pisar texto ya escrito
    const actual = (valoresActuales?.[0] ?? "").trim();
    if (actual && !window.confirm(es.fieldIA.confirmarPisar)) return;
    onUsar(texto);
    setAbierto(false);
  };

  const tope = max ?? Number.POSITIVE_INFINITY;
  const listaLlena = (valoresActuales?.length ?? 0) >= tope;
  const duplicada = (t: string) => (valoresActuales ?? []).includes(t);

  const anadirTodas = () => {
    // Dedupe + tope (patrón StepPublicacion): se añaden de una en una vía onUsar
    const actuales = new Set(valoresActuales ?? []);
    for (const t of sugerencias) {
      if (actuales.size >= tope) break;
      if (actuales.has(t)) continue;
      actuales.add(t);
      onUsar(t);
    }
  };

  const anadirBloque = (b: BloqueSugerido, i: number) => {
    onUsarBloque?.(b);
    setBloquesAnadidos((s) => new Set(s).add(i));
  };

  const enlaceBloqueo = bloqueado ? enlacePaso(bloqueado.pasoSlug, videoProjectId) : null;
  const sinResultados = modo === "bloques" ? bloques.length === 0 : sugerencias.length === 0;

  return (
    <span className="field-ia-wrap" ref={wrapRef}>
      <span {...(abierto ? {} : { "data-tip": configurada ? titulo : es.wizard.iaNoConfigurada })}>
        <button
          type="button"
          className="field-ia-btn"
          data-testid={`field-ia-${campoId}`}
          aria-label={titulo}
          aria-haspopup="dialog"
          aria-expanded={abierto}
          disabled={!configurada}
          onClick={alternar}
        >
          <Sparkles size={14} />
        </button>
      </span>

      {abierto && (
        <div className="field-ia-popover" data-testid="field-ia-popover" role="dialog" aria-label={titulo}>
          <div className="field-ia-head">
            <Sparkles size={14} aria-hidden />
            <strong>{titulo}</strong>
            {!cargando && resultados && (
              <button
                type="button"
                className="field-ia-icono"
                onClick={() => void generar()}
                aria-label={es.fieldIA.regenerar}
              >
                <RefreshCw size={13} />
              </button>
            )}
            <button type="button" className="field-ia-icono" onClick={() => setAbierto(false)} aria-label={es.common.cerrar}>
              <X size={13} />
            </button>
          </div>

          {cargando && (
            <p className="field-ia-estado">
              <span className="spinner" /> {es.fieldIA.pensando}
            </p>
          )}

          {!cargando && bloqueado && (
            <div className="ai-bloqueado" data-testid="field-ia-bloqueado" role="alert">
              <Lock size={16} className="ai-bloqueado-icono" aria-hidden />
              <div>
                <strong className="ai-bloqueado-titulo">{es.wizard.bloqueadoTitulo}</strong>
                <p className="ai-bloqueado-mensaje">{bloqueado.mensaje}</p>
                {enlaceBloqueo && (
                  <Link to={enlaceBloqueo} className="ai-bloqueado-enlace" data-testid="field-ia-bloqueado-ir">
                    {es.wizard.bloqueadoIrAlPaso}
                  </Link>
                )}
              </div>
            </div>
          )}

          {!cargando && !bloqueado && error && <p className="field-ia-error">{error}</p>}

          {!cargando && !bloqueado && !error && resultados && parseFallido && (
            <p className="field-ia-estado">{es.fieldIA.parseFallido}</p>
          )}

          {!cargando && !bloqueado && !error && resultados && !parseFallido && sinResultados && (
            <p className="field-ia-estado">{es.fieldIA.sinSugerencias}</p>
          )}

          {!cargando && !bloqueado && !error && resultados && !parseFallido && !sinResultados && (
            <>
              {modo === "texto" && (
                <ul className="field-ia-lista">
                  {sugerencias.map((t, i) => (
                    <li key={`${t}-${i}`} className="field-ia-sugerencia" data-testid={`field-ia-sugerencia-${i}`}>
                      <p>{t}</p>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => usarTexto(t)}>
                        {es.fieldIA.usarSugerencia}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {modo === "lista" && (
                <>
                  <div className="field-ia-chips">
                    {sugerencias.map((t, i) => (
                      <button
                        key={`${t}-${i}`}
                        type="button"
                        className="chip"
                        data-testid={`field-ia-sugerencia-${i}`}
                        disabled={duplicada(t) || listaLlena}
                        onClick={() => onUsar(t)}
                      >
                        <Plus size={12} aria-hidden /> {t}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: "flex-start" }}
                    data-testid="field-ia-anadir-todas"
                    disabled={listaLlena || sugerencias.every((t) => duplicada(t))}
                    onClick={anadirTodas}
                  >
                    {es.fieldIA.anadirTodas}
                  </button>
                </>
              )}

              {modo === "bloques" && (
                <ul className="field-ia-lista">
                  {bloques.map((b, i) => (
                    <li
                      key={`${b.titulo}-${i}`}
                      className="field-ia-sugerencia field-ia-bloque"
                      data-testid={`field-ia-sugerencia-${i}`}
                    >
                      <strong>{b.titulo}</strong>
                      <p>{b.contenido}</p>
                      <div className="field-ia-bloque-pie">
                        {b.duracionSegundos > 0 && <span className="field-ia-duracion">{b.duracionSegundos} s</span>}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={bloquesAnadidos.has(i)}
                          onClick={() => anadirBloque(b, i)}
                        >
                          {bloquesAnadidos.has(i) ? es.fieldIA.anadido : es.fieldIA.anadirBloque}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </span>
  );
}
