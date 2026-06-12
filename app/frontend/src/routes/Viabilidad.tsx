// Viabilidad.tsx — T018: estudio de viabilidad del nicho (solo para tieneCanalYa === false).
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckSquare, Square, Target } from "lucide-react";
import { es } from "../i18n/es";
import { api } from "../services/api";
import { useStore } from "../store/useStore";
import { AiBlock } from "../wizard/AiBlock";

const TOTAL_PASOS = 5;
const DEBOUNCE_MS = 800;

interface EstudioViabilidad {
  ideaCanal: string;
  aQuienAyuda: string;
  formatoPrevisto: string;
  busquedasEncontradas: string;
  canalesReferencia: string;
  anguloReferencia: string;
  subNicho: string;
  pvu: string;
  checklistVeredicto: Record<string, boolean>;
  autoveredicto: "viable" | "ajustar" | "pivotar" | null;
  saltado: boolean;
  completado: boolean;
}

const CHECKS_VEREDICTO = [
  { id: "demanda", label: es.viabilidad.checkDemandaAnotada },
  { id: "canales", label: es.viabilidad.checkCanalesIdentificados },
  { id: "hueco", label: es.viabilidad.checkHuecoIdentificado },
  { id: "subnicho", label: es.viabilidad.checkSubNichoElegido },
  { id: "pvu", label: es.viabilidad.checkPVUFormulada },
];

const ESTADO_INICIAL: EstudioViabilidad = {
  ideaCanal: "",
  aQuienAyuda: "",
  formatoPrevisto: "",
  busquedasEncontradas: "",
  canalesReferencia: "",
  anguloReferencia: "",
  subNicho: "",
  pvu: "",
  checklistVeredicto: {},
  autoveredicto: null,
  saltado: false,
  completado: false,
};

function StepIndicator({ paso }: { paso: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        marginBottom: "var(--space-5)",
        flexWrap: "wrap",
      }}
    >
      {Array.from({ length: TOTAL_PASOS }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background:
                i < paso
                  ? "var(--accent)"
                  : i === paso
                  ? "var(--accent)"
                  : "var(--surface-2)",
              border: `2px solid ${i <= paso ? "var(--accent)" : "var(--border)"}`,
              color: i <= paso ? "var(--bg)" : "var(--text-tertiary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {i < paso ? "✓" : i + 1}
          </div>
          {i < TOTAL_PASOS - 1 && (
            <div
              style={{
                width: 24,
                height: 2,
                background: i < paso ? "var(--accent)" : "var(--border)",
              }}
            />
          )}
        </div>
      ))}
      <span
        style={{
          marginLeft: "var(--space-3)",
          fontSize: "var(--text-sm)",
          color: "var(--text-tertiary)",
        }}
      >
        {es.viabilidad.pasoDe(paso + 1, TOTAL_PASOS)}
      </span>
    </div>
  );
}

function TipViabilidad({ texto }: { texto: string }) {
  return (
    <div
      className="tip-banner"
      style={{ marginBottom: "var(--space-4)" }}
    >
      <div className="tip-banner-header">
        <Target size={16} className="tip-banner-icon" />
        <p className="tip-banner-texto">{texto}</p>
      </div>
    </div>
  );
}

function CheckItem({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (id: string, val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(id, !checked)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-3)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "var(--space-2) 0",
        textAlign: "left",
        color: "var(--text-primary)",
        width: "100%",
      }}
    >
      {checked ? (
        <CheckSquare size={20} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
      ) : (
        <Square size={20} style={{ color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
      )}
      <span style={{ fontSize: "var(--text-sm)" }}>{label}</span>
    </button>
  );
}

export function Viabilidad() {
  const profile = useStore((s) => s.profile);
  const patchProfile = useStore((s) => s.patchProfile);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<EstudioViabilidad>(ESTADO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [cargado, setCargado] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar estado persistido al montar
  useEffect(() => {
    api
      .get<EstudioViabilidad | null>("/api/viabilidad")
      .then((d) => {
        if (d) {
          setDatos({ ...ESTADO_INICIAL, ...d });
        }
      })
      .catch(() => {
        // sin datos previos — empezamos desde cero
      })
      .finally(() => setCargado(true));
  }, []);

  // Autosave con debounce
  const guardarDebounced = useCallback(
    (nuevosDatos: EstudioViabilidad) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setGuardando(true);
        try {
          await api.patch("/api/viabilidad", nuevosDatos);
        } catch {
          // silencio — no interrumpir al usuario
        } finally {
          setGuardando(false);
        }
      }, DEBOUNCE_MS);
    },
    []
  );

  function actualizar(campo: keyof EstudioViabilidad, valor: EstudioViabilidad[typeof campo]) {
    const nuevo = { ...datos, [campo]: valor };
    setDatos(nuevo);
    guardarDebounced(nuevo);
  }

  function actualizarCheck(id: string, val: boolean) {
    const nuevo = {
      ...datos,
      checklistVeredicto: { ...datos.checklistVeredicto, [id]: val },
    };
    setDatos(nuevo);
    guardarDebounced(nuevo);
  }

  async function saltar() {
    const nuevo = { ...datos, saltado: true };
    setDatos(nuevo);
    try {
      await api.patch("/api/viabilidad", nuevo);
    } catch {
      // ignorar
    }
    toast("info", es.viabilidad.saltadoToast);
    navigate("/dashboard");
  }

  async function usarNombre(nombre: string) {
    try {
      await patchProfile({ canalNombre: nombre });
      toast("success", es.nombresCanal.aplicadoToast(nombre));
    } catch {
      toast("error", es.nombresCanal.errorAplicar);
    }
  }

  async function finalizar(autoveredicto: "viable" | "ajustar" | "pivotar") {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const nuevo = { ...datos, autoveredicto, completado: true };
    setDatos(nuevo);
    setGuardando(true);
    try {
      await api.patch("/api/viabilidad", nuevo);
      toast("success", es.viabilidad.completadoToast);
    } catch {
      toast("error", "No se pudo guardar el veredicto. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (!cargado) {
    return (
      <div className="page">
        <div className="splash">
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      </div>
    );
  }

  const nicho = profile?.nicho ?? "";
  const nivel = profile?.nivel ?? "principiante";

  return (
    <div className="page" data-testid="viabilidad-page">
      <div className="page-head">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Target size={24} /> {es.viabilidad.titulo}
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>{es.viabilidad.subtitulo}</p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          data-testid="viabilidad-saltar"
          onClick={saltar}
        >
          {es.viabilidad.saltar}
        </button>
      </div>

      {guardando && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}>
          {es.common.guardando}
        </p>
      )}

      <StepIndicator paso={paso} />

      {/* PASO 1 — Tu idea */}
      {paso === 0 && (
        <div className="card" data-testid="viabilidad-step-1">
          <h2 style={{ marginBottom: "var(--space-2)" }}>{es.viabilidad.paso1Titulo}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
            {es.viabilidad.paso1Desc}
          </p>
          <TipViabilidad
            texto="Romuald insiste: 'Cuanto más específico el nicho, menor la competencia y mayor el RPM de los anunciantes.' No busques un tema que te guste, busca el hueco donde la demanda supera la oferta."
          />
          <div className="field" style={{ marginBottom: "var(--space-4)" }}>
            <label className="field-label">{es.viabilidad.campoIdeaLabel}</label>
            <textarea
              className="field-input"
              rows={3}
              placeholder={es.viabilidad.campoIdeaPlaceholder}
              value={datos.ideaCanal}
              onChange={(e) => actualizar("ideaCanal", e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: "var(--space-4)" }}>
            <label className="field-label">{es.viabilidad.campoAQuienLabel}</label>
            <textarea
              className="field-input"
              rows={2}
              placeholder={es.viabilidad.campoAQuienPlaceholder}
              value={datos.aQuienAyuda}
              onChange={(e) => actualizar("aQuienAyuda", e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label">{es.viabilidad.campoFormatoLabel}</label>
            <input
              type="text"
              className="field-input"
              placeholder={es.viabilidad.campoFormatoPlaceholder}
              value={datos.formatoPrevisto}
              onChange={(e) => actualizar("formatoPrevisto", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* PASO 2 — Demanda */}
      {paso === 1 && (
        <div className="card" data-testid="viabilidad-step-2">
          <h2 style={{ marginBottom: "var(--space-2)" }}>{es.viabilidad.paso2Titulo}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
            {es.viabilidad.paso2Desc}
          </p>
          <TipViabilidad
            texto="Método de validación triple de Romuald: 1) YouTube Autocomplete — escribe tu tema y anota las sugerencias que aparecen. 2) Google Keyword Planner — ¿hay anunciantes pujando por esas palabras? 3) Analiza los primeros resultados — ¿hay vídeos con pocas vistas a pesar de tener meses? Ahí está el hueco."
          />
          <div className="field" style={{ marginBottom: "var(--space-4)" }}>
            <label className="field-label">{es.viabilidad.campoBusquedasLabel}</label>
            <span className="field-hint">
              Busca en YouTube y anota las sugerencias del autocompletado que aparezcan relacionadas con tu tema.
            </span>
            <textarea
              className="field-input"
              rows={4}
              placeholder={es.viabilidad.campoBusquedasPlaceholder}
              value={datos.busquedasEncontradas}
              onChange={(e) => actualizar("busquedasEncontradas", e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label">{es.viabilidad.campoCanalesLabel}</label>
            <span className="field-hint">
              Busca canales que ya traten este tema. Anota los que tienen suscriptores y vistas reales.
            </span>
            <textarea
              className="field-input"
              rows={3}
              placeholder={es.viabilidad.campoCanalesPlaceholder}
              value={datos.canalesReferencia}
              onChange={(e) => actualizar("canalesReferencia", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* PASO 3 — Competencia y hueco */}
      {paso === 2 && (
        <div className="card" data-testid="viabilidad-step-3">
          <h2 style={{ marginBottom: "var(--space-2)" }}>{es.viabilidad.paso3Titulo}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
            {es.viabilidad.paso3Desc}
          </p>
          <TipViabilidad
            texto="Ángulo diferencial = rotura de patrón conceptual. Pregúntate: ¿qué hace el 90% de los canales de mi nicho en sus miniaturas, títulos y estructuras? Haz lo opuesto o mejóralo radicalmente. Sin hueco identificado, eres uno más."
          />
          <div className="field">
            <label className="field-label">{es.viabilidad.campoAnguloLabel}</label>
            <span className="field-hint">
              Revisa los canales que anotaste en el paso anterior. ¿Qué repiten todos? ¿Qué nadie hace? Ese es tu ángulo.
            </span>
            <textarea
              className="field-input"
              rows={5}
              placeholder={es.viabilidad.campoAnguloPlaceholder}
              value={datos.anguloReferencia}
              onChange={(e) => actualizar("anguloReferencia", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* PASO 4 — Sub-nicho y PVU */}
      {paso === 3 && (
        <div className="card" data-testid="viabilidad-step-4">
          <h2 style={{ marginBottom: "var(--space-2)" }}>{es.viabilidad.paso4Titulo}</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
            {es.viabilidad.paso4Desc}
          </p>
          <TipViabilidad
            texto="El método del triángulo de Romuald: pasión (¿lo harás aunque no pagues?) × demanda activa (¿la gente lo busca ya?) × competencia manejable (¿puedes diferenciarte?). Si los tres lados son positivos, tienes un negocio. Si falta uno, ajusta."
          />
          <div className="field" style={{ marginBottom: "var(--space-4)" }}>
            <label className="field-label">{es.viabilidad.campoSubNichoLabel}</label>
            <span className="field-hint">
              Parte de tu idea inicial y afínala. Cuanto más específico, menos competencia directa.
            </span>
            <input
              type="text"
              className="field-input"
              placeholder={es.viabilidad.campoSubNichoPlaceholder}
              value={datos.subNicho}
              onChange={(e) => actualizar("subNicho", e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label">{es.viabilidad.campoPVULabel}</label>
            <span className="field-hint">
              Una frase. Sin jerga. Debe responder: ¿por qué alguien elegiría tu canal sobre los demás?
            </span>
            <textarea
              className="field-input"
              rows={2}
              placeholder={es.viabilidad.campoPVUPlaceholder}
              value={datos.pvu}
              onChange={(e) => actualizar("pvu", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* PASO 5 — Veredicto */}
      {paso === 4 && (
        <div data-testid="viabilidad-step-5">
          <div className="card" style={{ marginBottom: "var(--space-5)" }}>
            <h2 style={{ marginBottom: "var(--space-4)" }}>{es.viabilidad.paso5Titulo}</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              {es.viabilidad.paso5Desc}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              {CHECKS_VEREDICTO.map((c) => (
                <CheckItem
                  key={c.id}
                  id={c.id}
                  label={c.label}
                  checked={!!datos.checklistVeredicto[c.id]}
                  onChange={actualizarCheck}
                />
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: "var(--space-5)" }}>
            <AiBlock
              tipo="evaluacion_nicho"
              videoProjectId="viabilidad"
              etiqueta={es.viabilidad.iaEtiqueta}
              tip={es.viabilidad.iaTip}
              opciones={{
                nicho,
                ideaCanal: datos.ideaCanal,
                nivel,
                canalesReferencia: datos.canalesReferencia,
                subNicho: datos.subNicho,
                pvu: datos.pvu,
              }}
              render={(resultados, parseFallido) => {
                if (parseFallido || !resultados.length) {
                  return (
                    <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                      No se pudo parsear la respuesta de la IA.
                    </p>
                  );
                }
                const r = resultados[0] as {
                  veredicto: string;
                  puntuacion: number;
                  fortalezas: string[];
                  riesgos: string[];
                  siguientePaso: string | null;
                };
                const colorVeredicto =
                  r.veredicto === "viable"
                    ? "var(--color-success, #22c55e)"
                    : r.veredicto === "ajustar"
                    ? "var(--color-warning, #f59e0b)"
                    : "var(--color-error, #ef4444)";
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      <span
                        className="tag"
                        style={{ background: colorVeredicto, color: "white", fontWeight: 700 }}
                      >
                        {r.veredicto === "viable"
                          ? es.viabilidad.veredictoViable
                          : r.veredicto === "ajustar"
                          ? es.viabilidad.veredictoAjustar
                          : es.viabilidad.verdictoPivotar}
                      </span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                        Puntuacion: <strong>{r.puntuacion}/10</strong>
                      </span>
                    </div>
                    {r.fortalezas.length > 0 && (
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                          Fortalezas
                        </p>
                        <ul style={{ paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                          {r.fortalezas.map((f, i) => (
                            <li key={i} style={{ fontSize: "var(--text-sm)" }}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.riesgos.length > 0 && (
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                          Riesgos
                        </p>
                        <ul style={{ paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                          {r.riesgos.map((r2, i) => (
                            <li key={i} style={{ fontSize: "var(--text-sm)" }}>{r2}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.siguientePaso && (
                      <p style={{ fontSize: "var(--text-sm)", borderTop: "1px solid var(--border)", paddingTop: "var(--space-3)" }}>
                        <strong>Siguiente paso:</strong> {r.siguientePaso}
                      </p>
                    )}
                  </div>
                );
              }}
            />
          </div>

          {/* Sugerir nombres de canal (T022) */}
          <div className="card" style={{ marginBottom: "var(--space-5)" }} data-testid="nombres-canal-block">
            <AiBlock
              tipo="sugerir_nombres_canal"
              etiqueta={es.nombresCanal.etiqueta}
              tip={es.nombresCanal.tip}
              opciones={{
                nicho: datos.subNicho || nicho,
                ideaCanal: datos.ideaCanal,
                pvu: datos.pvu,
              }}
              render={(resultados, parseFallido) => {
                if (parseFallido || !resultados.length) {
                  return (
                    <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                      {es.nombresCanal.parseFallido}
                    </p>
                  );
                }
                return (
                  <ul className="ai-cards">
                    {(resultados as Array<{ nombre: string; porQue: string | null }>).map((r, i) => (
                      <li key={i} className="ai-card" data-testid={`nombre-sugerido-${i}`}>
                        <div>
                          <strong>{r.nombre}</strong>
                          {r.porQue && (
                            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                              {r.porQue}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          data-testid={`nombre-usar-${i}`}
                          onClick={() => void usarNombre(r.nombre)}
                        >
                          {es.nombresCanal.usar}
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              }}
            />
          </div>

          {/* Autoveredicto */}
          {!datos.completado && (
            <div className="card" data-testid="viabilidad-veredicto">
              <h3 style={{ marginBottom: "var(--space-4)" }}>{es.viabilidad.autoveredictoTitulo}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <button
                  className="btn btn-primary"
                  disabled={guardando}
                  onClick={() => finalizar("viable")}
                >
                  {es.viabilidad.autoveredictoViable}
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={guardando}
                  onClick={() => finalizar("ajustar")}
                >
                  {es.viabilidad.autoveredictoAjustar}
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={guardando}
                  onClick={() => finalizar("pivotar")}
                >
                  {es.viabilidad.autoverdictoPivotar}
                </button>
              </div>
            </div>
          )}

          {/* CTA tras completar */}
          {datos.completado && (
            <div
              className="card"
              data-testid="viabilidad-completado"
              style={{ textAlign: "center", padding: "var(--space-6)" }}
            >
              <p style={{ fontWeight: 700, marginBottom: "var(--space-4)" }}>
                Estudio completado. Veredicto:{" "}
                <strong>
                  {datos.autoveredicto === "viable"
                    ? es.viabilidad.veredictoViable
                    : datos.autoveredicto === "ajustar"
                    ? es.viabilidad.veredictoAjustar
                    : es.viabilidad.verdictoPivotar}
                </strong>
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/dashboard" className="btn btn-secondary">
                  {es.viabilidad.ctaDashboard}
                </Link>
                <Link to="/videos/nuevo" className="btn btn-primary">
                  {es.viabilidad.ctaPrimerVideo}
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navegacion entre pasos */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "var(--space-6)",
          gap: "var(--space-3)",
        }}
      >
        {paso > 0 ? (
          <button
            className="btn btn-ghost"
            data-testid="viabilidad-back"
            onClick={() => setPaso((p) => p - 1)}
          >
            {es.viabilidad.anterior}
          </button>
        ) : (
          <span />
        )}

        {paso < TOTAL_PASOS - 1 && (
          <button
            className="btn btn-primary"
            data-testid="viabilidad-next"
            onClick={() => setPaso((p) => p + 1)}
          >
            {es.viabilidad.siguiente}
          </button>
        )}
      </div>
    </div>
  );
}
