// Etapa 8 · publicacion (02 §2.4.8) — acordeón de 5 subsecciones + acción culminante.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Plus, Trash2, AlertTriangle, ListOrdered } from "lucide-react";
import { AiBlock } from "../AiBlock";
import { FieldIA } from "../FieldIA";
import { ChipsEditor, CharCount, LabelConTip } from "../fields";
import { CONSEJOS } from "../consejos";
import { es } from "../../i18n/es";
import { Modal } from "../../components/ui/Modal";
import { Confetti } from "../../components/Confetti";
import { useStore } from "../../store/useStore";
import { isItemDone, stepBySlug } from "../config";
import type { StepProps } from "./types";
import type { Tarjeta, VideoState } from "../../types";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TIPOS_TARJETA = ["Subjeta", "Indujetas", "Psicojetas", "SEOjeta", "SEOrescate"] as const;
const TIPOS_ELEMENTO = ["video", "lista", "suscripcion", "canal", "enlace"] as const;
const POSICIONES = ["izq", "der", "centro", "abajo"] as const;
const CONFIGS = ["unitaria", "binaria", "terciaria", "cuaternaria", "plantilla"] as const;

const aSegundos = (mmss: string) => {
  const m = mmss.match(/^(\d{1,3}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const aMmss = (seg: number) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;

function validarTarjetas(tarjetas: Tarjeta[]): string | null {
  if (tarjetas.length > 5) return "Máximo 5 tarjetas (límite YouTube)";
  const momentos = [...tarjetas.map((t) => t.momentoSegundos)].sort((a, b) => a - b);
  if (momentos.some((m) => m < 60)) return "Ninguna tarjeta en el primer minuto";
  for (let i = 1; i < momentos.length; i++) {
    if (momentos[i] - momentos[i - 1] < 120) return "Distancia mínima entre tarjetas: 2 minutos";
  }
  return null;
}

export function StepPublicacion({
  video,
  patch,
  cambiarEstado,
}: StepProps & { cambiarEstado: (e: VideoState, publishedAt?: string) => Promise<unknown> }) {
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);
  const [modalPublicar, setModalPublicar] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 16));
  const [confetti, setConfetti] = useState(false);
  const [publicando, setPublicando] = useState(false);

  // ---- timestamps con borrador local (solo se persisten sets válidos) ----
  const [tsRows, setTsRows] = useState(video.timestamps);
  useEffect(() => setTsRows(video.timestamps), [video.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const tsError = useMemo(() => {
    if (tsRows.length === 0) return null;
    if (tsRows[0].tiempo !== "00:00") return 'YouTube exige que el primer capítulo sea "00:00"';
    if (tsRows.some((r) => !/^\d{1,3}:\d{2}$/.test(r.tiempo))) return "Formato de tiempo: MM:SS";
    return null;
  }, [tsRows]);
  const setTimestamps = (rows: typeof tsRows) => {
    setTsRows(rows);
    const ok = rows.length === 0 || (rows[0]?.tiempo === "00:00" && rows.every((r) => /^\d{1,3}:\d{2}$/.test(r.tiempo)));
    if (ok) patch({ timestamps: rows });
  };

  // T024: capítulos deterministas (sin IA) desde guion.desarrollo. La intro (SEOshock/inicio/loop)
  // cuenta 60s por convención del método (misma suma que duracionTotalEstimadaSeg en StepGuion).
  const derivarCapitulos = () => {
    const bloquesGuion = video.guion.desarrollo;
    if (bloquesGuion.length === 0) {
      toast("info", es.fieldIA.derivarSinBloques);
      return;
    }
    if (tsRows.length > 0 && !window.confirm(es.fieldIA.confirmarPisarCapitulos)) return;
    let acumulado = 60;
    const rows = [{ tiempo: "00:00", titulo: "Introducción" }];
    bloquesGuion.forEach((b, i) => {
      rows.push({ tiempo: aMmss(acumulado), titulo: b.titulo.trim() || `Bloque ${i + 1}` });
      acumulado += b.duracionSegundos || 0;
    });
    setTimestamps(rows);
  };

  // ---- tarjetas con borrador local ----
  const [tarjetas, setTarjetasLocal] = useState(video.tarjetas);
  useEffect(() => setTarjetasLocal(video.tarjetas), [video.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const tarjetasError = validarTarjetas(tarjetas);
  const setTarjetas = (rows: Tarjeta[]) => {
    setTarjetasLocal(rows);
    if (!validarTarjetas(rows)) patch({ tarjetas: rows });
  };
  const avisoUltimos30 =
    video.guion.duracionTotalEstimadaSeg > 0 &&
    tarjetas.some((t) => t.momentoSegundos > video.guion.duracionTotalEstimadaSeg - 30);

  // ---- requisitos de publicación (02 §2.4.8) ----
  const step = stepBySlug("publicacion")!;
  const subido = isItemDone(video, step, step.checklist.find((i) => i.key === "video-subido-youtube")!);
  const faltan = [
    !video.tituloFinal && "título final",
    !video.miniatura.urlPrincipal && "miniatura subida",
    !subido && 'check "vídeo subido a YouTube"',
  ].filter(Boolean) as string[];

  const publicar = async () => {
    setPublicando(true);
    try {
      await cambiarEstado("publicado", new Date(fecha).toISOString());
      setModalPublicar(false);
      setConfetti(true);
      toast("success", "Publicado. Arranca la fase sprint 🚀");
      window.setTimeout(() => navigate(`/videos/${video.id}/wizard/sprint`), 900);
    } catch {
      toast("error", "No se pudo cambiar el estado");
    } finally {
      setPublicando(false);
    }
  };

  const resumenGuion = [video.guion.seoInicio, ...video.guion.desarrollo.map((b) => b.titulo), video.guion.psicoCta]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 1500);

  return (
    <>
      {confetti && <Confetti onFin={() => setConfetti(false)} />}

      {/* A — Descripción */}
      <details className="acordeon" open>
        <summary>A · Descripción y comentario fijado</summary>
        <div className="acordeon-body">
          <div className="field">
            <LabelConTip htmlFor="f-desc" tip={CONSEJOS.publicacion.campos.descripcion}>
              Descripción publicada{" "}
              <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}>
                (las 2 primeras líneas son el SEOextracto: lo único visible antes del “ver más”)
              </span>
            </LabelConTip>
            <textarea
              id="f-desc"
              className="textarea"
              style={{ minHeight: 180 }}
              data-testid="field-descripcion-publicada"
              value={video.descripcionPublicada}
              maxLength={5000}
              onChange={(e) => patch({ descripcionPublicada: e.target.value })}
            />
            <CharCount len={video.descripcionPublicada.length} ideal={3000} max={5000} />
          </div>
          <AiBlock
            tipo="descripcion"
            videoProjectId={video.id}
            etiqueta="Generar descripción con IA"
            opciones={{ resumenGuion }}
            render={(resultados) => {
              const r = resultados[0] as { texto: string; seoExtracto?: string };
              return (
                <div className="ai-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <pre className="ai-raw">{r?.texto}</pre>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ alignSelf: "flex-start" }}
                    onClick={() => {
                      if (video.descripcionPublicada.trim() && !window.confirm("¿Sustituir la descripción escrita?")) return;
                      patch({ descripcionPublicada: r.texto });
                    }}
                  >
                    Usar descripción
                  </button>
                </div>
              );
            }}
          />
          <div className="field" style={{ marginTop: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <LabelConTip htmlFor="f-fijado" tip={CONSEJOS.publicacion.campos.comentarioFijado}>
                Comentario fijado
              </LabelConTip>
              <FieldIA
                campoId="comentarioFijado"
                videoProjectId={video.id}
                modo="texto"
                valoresActuales={[video.comentarioFijado ?? ""]}
                onUsar={(texto) => patch({ comentarioFijado: texto || null })}
              />
            </div>
            <textarea
              id="f-fijado"
              className="textarea"
              style={{ minHeight: 80 }}
              data-testid="field-comentario-fijado"
              value={video.comentarioFijado ?? ""}
              onChange={(e) => patch({ comentarioFijado: e.target.value || null })}
            />
          </div>
        </div>
      </details>

      {/* B — Hashtags */}
      <details className="acordeon">
        <summary>B · Hashtags</summary>
        <div className="acordeon-body">
          <div className="field">
            <LabelConTip as="span" tip={CONSEJOS.publicacion.campos.hashtagsDescripcion}>En descripción (regla del 3: amplio + medio + específico, máx 15)</LabelConTip>
            <ChipsEditor
              valores={video.hashtags.descripcion}
              max={15}
              placeholder="#cocina"
              testid="field-hashtags-descripcion"
              normaliza={(s) => {
                const limpio = s.trim().toLowerCase().replace(/\s+/g, "");
                return limpio && !limpio.startsWith("#") ? `#${limpio}` : limpio;
              }}
              onChange={(descripcion) => patch({ hashtags: { ...video.hashtags, descripcion } })}
            />
          </div>
          <AiBlock
            tipo="hashtags"
            videoProjectId={video.id}
            etiqueta="Proponer hashtags con IA"
            render={(resultados) => {
              const r = resultados[0] as { amplio?: string; medio?: string; especifico?: string; titulo?: string };
              const tres = [r?.amplio, r?.medio, r?.especifico].filter(Boolean) as string[];
              return (
                <div className="ai-card">
                  <span className="mono">{tres.join("  ")}</span>
                  <span style={{ display: "inline-flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        patch({
                          hashtags: {
                            ...video.hashtags,
                            descripcion: [...new Set([...video.hashtags.descripcion, ...tres])].slice(0, 15),
                          },
                        })
                      }
                    >
                      Aplicar los 3
                    </button>
                    {r?.titulo && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => patch({ hashtags: { ...video.hashtags, titulo: [r.titulo!] } })}
                      >
                        “{r.titulo}” en título
                      </button>
                    )}
                  </span>
                </div>
              );
            }}
          />
          <div className="field" style={{ marginTop: "var(--space-4)", maxWidth: 320 }}>
            <label className="label" htmlFor="f-geo">
              Geolocalización (opcional)
            </label>
            <input
              id="f-geo"
              className="input"
              data-testid="field-geolocalizacion"
              value={video.hashtags.geolocalizacion ?? ""}
              placeholder="#madrid"
              onChange={(e) => patch({ hashtags: { ...video.hashtags, geolocalizacion: e.target.value || null } })}
            />
          </div>
        </div>
      </details>

      {/* C — Capítulos y lista */}
      <details className="acordeon">
        <summary>C · Capítulos y lista de reproducción</summary>
        <div className="acordeon-body">
          {tsError && (
            <p className="banner-error" role="alert" data-testid="timestamps-error">
              <AlertTriangle size={14} /> {tsError}
            </p>
          )}
          <LabelConTip as="span" tip={CONSEJOS.publicacion.campos.timestamps}>Capítulos (timestamps)</LabelConTip>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {tsRows.map((r, i) => (
              <div key={i} className="ref-row">
                <input
                  className="input mono"
                  style={{ width: 100 }}
                  value={r.tiempo}
                  placeholder="00:00"
                  aria-label={`Tiempo del capítulo ${i + 1}`}
                  data-testid={`field-timestamp-tiempo-${i}`}
                  onChange={(e) => setTimestamps(tsRows.map((x, j) => (j === i ? { ...x, tiempo: e.target.value } : x)))}
                />
                <input
                  className="input"
                  value={r.titulo}
                  placeholder="Título del capítulo"
                  aria-label={`Título del capítulo ${i + 1}`}
                  data-testid={`field-timestamp-titulo-${i}`}
                  onChange={(e) => setTimestamps(tsRows.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Quitar capítulo"
                  onClick={() => setTimestamps(tsRows.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              data-testid="timestamps-add"
              onClick={() =>
                setTimestamps([...tsRows, tsRows.length === 0 ? { tiempo: "00:00", titulo: "Introducción" } : { tiempo: "", titulo: "" }])
              }
            >
              <Plus size={14} /> {tsRows.length === 0 ? "Añadir 00:00 Introducción" : "Añadir capítulo"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              data-testid="derivar-capitulos"
              data-tip="Sin IA: usa los títulos y duraciones de los bloques del guion"
              onClick={derivarCapitulos}
            >
              <ListOrdered size={14} /> {es.fieldIA.derivarCapitulos}
            </button>
          </div>
          <div className="field" style={{ marginTop: "var(--space-4)", maxWidth: 420 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <label className="label" htmlFor="f-lista">
                Lista de reproducción
              </label>
              <FieldIA
                campoId="listaReproduccionNombre"
                videoProjectId={video.id}
                modo="texto"
                valoresActuales={[video.listaReproduccionNombre ?? ""]}
                onUsar={(texto) => patch({ listaReproduccionNombre: texto || null })}
              />
            </div>
            <input
              id="f-lista"
              className="input"
              data-testid="field-lista-reproduccion"
              value={video.listaReproduccionNombre ?? ""}
              placeholder="Nombre de la SEOlista donde vivirá"
              onChange={(e) => patch({ listaReproduccionNombre: e.target.value || null })}
            />
          </div>
        </div>
      </details>

      {/* D — Pantallas finales y tarjetas */}
      <details className="acordeon">
        <summary>D · Pantallas finales y tarjetas</summary>
        <div className="acordeon-body">
          <div className="field">
            <LabelConTip as="span" tip={CONSEJOS.publicacion.campos.pantallasYTarjetas}>Configuración de pantallas finales (últimos 20s)</LabelConTip>
            <div className="chips">
              {CONFIGS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip${video.pantallasFinales.configuracion === c ? " active" : ""}`}
                  data-testid={`field-pantallas-config-${c}`}
                  onClick={() => patch({ pantallasFinales: { ...video.pantallasFinales, configuracion: c } })}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="field-hint">Binaria recomendada: vídeo siguiente a la izquierda + suscripción a la derecha (s13_a2).</p>
          </div>
          {video.pantallasFinales.elementos.map((el, i) => (
            <div key={i} className="ref-row">
              <select
                className="select"
                style={{ width: 150 }}
                value={el.tipo}
                aria-label={`Tipo del elemento ${i + 1}`}
                onChange={(e) =>
                  patch({
                    pantallasFinales: {
                      ...video.pantallasFinales,
                      elementos: video.pantallasFinales.elementos.map((x, j) =>
                        j === i ? { ...x, tipo: e.target.value as typeof el.tipo } : x
                      ),
                    },
                  })
                }
              >
                {TIPOS_ELEMENTO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="input"
                value={el.destino}
                placeholder="Título o URL de destino"
                aria-label={`Destino del elemento ${i + 1}`}
                onChange={(e) =>
                  patch({
                    pantallasFinales: {
                      ...video.pantallasFinales,
                      elementos: video.pantallasFinales.elementos.map((x, j) => (j === i ? { ...x, destino: e.target.value } : x)),
                    },
                  })
                }
              />
              <select
                className="select"
                style={{ width: 110 }}
                value={el.posicion}
                aria-label={`Posición del elemento ${i + 1}`}
                onChange={(e) =>
                  patch({
                    pantallasFinales: {
                      ...video.pantallasFinales,
                      elementos: video.pantallasFinales.elementos.map((x, j) =>
                        j === i ? { ...x, posicion: e.target.value as typeof el.posicion } : x
                      ),
                    },
                  })
                }
              >
                {POSICIONES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Quitar elemento"
                onClick={() =>
                  patch({
                    pantallasFinales: {
                      ...video.pantallasFinales,
                      elementos: video.pantallasFinales.elementos.filter((_, j) => j !== i),
                    },
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: "var(--space-2)" }}
            data-testid="pantallas-add"
            onClick={() =>
              patch({
                pantallasFinales: {
                  ...video.pantallasFinales,
                  elementos: [...video.pantallasFinales.elementos, { tipo: "video", destino: "", posicion: "izq" }],
                },
              })
            }
          >
            <Plus size={14} /> Añadir elemento
          </button>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "var(--space-5) 0" }} />

          <LabelConTip as="span" tip={CONSEJOS.publicacion.campos.pantallasYTarjetas}>Tarjetas (máx 5 · nunca en el primer minuto · 2 min de distancia)</LabelConTip>
          {tarjetasError && (
            <p className="banner-error" role="alert" data-testid="tarjetas-error">
              <AlertTriangle size={14} /> {tarjetasError} — no se guarda hasta corregirlo
            </p>
          )}
          {avisoUltimos30 && !tarjetasError && (
            <p className="banner-aviso">
              <AlertTriangle size={14} /> Hay tarjetas en los últimos 30s del vídeo estimado: compiten con las pantallas finales.
            </p>
          )}
          {tarjetas.map((t, i) => (
            <div key={i} className="ref-row">
              <select
                className="select"
                style={{ width: 140 }}
                value={t.tipo}
                aria-label={`Tipo de la tarjeta ${i + 1}`}
                data-testid={`field-tarjeta-tipo-${i}`}
                onChange={(e) => setTarjetas(tarjetas.map((x, j) => (j === i ? { ...x, tipo: e.target.value as Tarjeta["tipo"] } : x)))}
              >
                {TIPOS_TARJETA.map((tt) => (
                  <option key={tt} value={tt}>
                    {tt}
                  </option>
                ))}
              </select>
              <input
                className="input mono"
                style={{ width: 90 }}
                defaultValue={t.momentoSegundos ? aMmss(t.momentoSegundos) : ""}
                placeholder="MM:SS"
                aria-label={`Momento de la tarjeta ${i + 1}`}
                data-testid={`field-tarjeta-momento-${i}`}
                onBlur={(e) => {
                  const seg = aSegundos(e.target.value);
                  if (seg !== null) setTarjetas(tarjetas.map((x, j) => (j === i ? { ...x, momentoSegundos: seg } : x)));
                }}
              />
              <input
                className="input"
                value={t.destino}
                placeholder="Vídeo/lista de destino"
                aria-label={`Destino de la tarjeta ${i + 1}`}
                onChange={(e) => setTarjetas(tarjetas.map((x, j) => (j === i ? { ...x, destino: e.target.value } : x)))}
              />
              <input
                className="input"
                style={{ maxWidth: 160 }}
                value={t.cta}
                placeholder="CTA en audio"
                aria-label={`CTA de la tarjeta ${i + 1}`}
                onChange={(e) => setTarjetas(tarjetas.map((x, j) => (j === i ? { ...x, cta: e.target.value } : x)))}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Quitar tarjeta"
                onClick={() => setTarjetas(tarjetas.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: "var(--space-2)" }}
            disabled={tarjetas.length >= 5}
            data-testid="tarjetas-add"
            onClick={() =>
              setTarjetas([
                ...tarjetas,
                { tipo: "SEOjeta", momentoSegundos: Math.max(90, (tarjetas.at(-1)?.momentoSegundos ?? 0) + 120), destino: "", cta: "" },
              ])
            }
          >
            <Plus size={14} /> Añadir tarjeta
          </button>
        </div>
      </details>

      {/* E — Momento */}
      <details className="acordeon">
        <summary>E · SEOhora — cuándo publicar</summary>
        <div className="acordeon-body" style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div className="field" style={{ minWidth: 200 }}>
            <LabelConTip htmlFor="f-dia" tip={CONSEJOS.publicacion.campos.seoHora}>
              Día de la semana
            </LabelConTip>
            <select
              id="f-dia"
              className="select"
              data-testid="field-seohora-dia"
              value={video.seoHora.diaSemana ?? ""}
              onChange={(e) => patch({ seoHora: { ...video.seoHora, diaSemana: e.target.value === "" ? null : Number(e.target.value) } })}
            >
              <option value="">—</option>
              {DIAS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <LabelConTip htmlFor="f-hora" tip={CONSEJOS.publicacion.campos.seoHora}>
              Hora
            </LabelConTip>
            <input
              id="f-hora"
              type="time"
              className="input"
              data-testid="field-seohora-hora"
              value={video.seoHora.horaPublicacion ?? ""}
              onChange={(e) => patch({ seoHora: { ...video.seoHora, horaPublicacion: e.target.value || null } })}
            />
          </div>
        </div>
      </details>

      {/* ---- Acción culminante ---- */}
      <div className="publicar-box">
        <span data-tip={faltan.length ? `Falta: ${faltan.join(", ")}` : undefined}>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={faltan.length > 0 || video.estado === "publicado" || video.estado === "optimizacion"}
            data-testid="btn-mark-published"
            onClick={() => setModalPublicar(true)}
          >
            <CheckCircle2 size={20} />{" "}
            {video.estado === "publicado" || video.estado === "optimizacion" ? "Ya publicado" : "Marcar como PUBLICADO"}
          </button>
        </span>
        {faltan.length > 0 && (
          <p className="field-hint" style={{ marginTop: "var(--space-2)" }}>
            Falta: {faltan.join(" · ")}
          </p>
        )}
      </div>

      <Modal
        open={modalPublicar}
        onClose={() => setModalPublicar(false)}
        title="¿Cuándo se publica?"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalPublicar(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={publicando} onClick={publicar} data-testid="confirm-publish">
              {publicando ? <span className="spinner" /> : <CheckCircle2 size={16} />} Confirmar publicación
            </button>
          </>
        }
      >
        <div className="field">
          <label className="label" htmlFor="f-fecha-pub">
            Fecha y hora de publicación
          </label>
          <input
            id="f-fecha-pub"
            type="datetime-local"
            className="input"
            value={fecha}
            data-testid="field-published-at"
            onChange={(e) => setFecha(e.target.value)}
          />
          <p className="field-hint">Con esta fecha se calculan los días del sprint y el paso a evergreen (día 30).</p>
        </div>
      </Modal>
    </>
  );
}
