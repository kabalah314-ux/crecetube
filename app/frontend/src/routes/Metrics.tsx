// /metricas — KPIs agregados + evolución por vídeo + snapshots + insights (08 §8.7).
import { useCallback, useEffect, useState } from "react";
import { LineChart as LineChartIcon, Plus, Pencil, Trash2, Lightbulb, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { EmptyState } from "../components/ui/EmptyState";
import { SnapshotModal } from "../components/SnapshotModal";
import { api } from "../services/api";
import { es } from "../i18n/es";
import type { MetricSnapshot, VideoProject } from "../types";

interface Resumen {
  videosConMetricas: number;
  vistasTotales: number;
  ctrMedio: number;
  retencionMedia: number;
  suscriptoresGanados: number;
  ingresosEstimados: number;
}

export function Metrics() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [insights, setInsights] = useState<Array<{ tipo: string; texto: string }>>([]);
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [videoSel, setVideoSel] = useState<string>("");
  const [snaps, setSnaps] = useState<MetricSnapshot[]>([]);
  const [modal, setModal] = useState<{ open: boolean; editar: MetricSnapshot | null }>({ open: false, editar: null });

  const cargarGlobal = useCallback(() => {
    void api.get<Resumen>("/api/metricas/resumen").then(setResumen);
    void api.get<Array<{ tipo: string; texto: string }>>("/api/metricas/insights").then(setInsights);
  }, []);

  useEffect(() => {
    cargarGlobal();
    void api.get<VideoProject[]>("/api/videos").then((v) => {
      const conFecha = v.filter((x) => x.publishedAt);
      setVideos(conFecha.length ? conFecha : v);
      if (conFecha[0]) setVideoSel(conFecha[0].id);
      else if (v[0]) setVideoSel(v[0].id);
    });
  }, [cargarGlobal]);

  useEffect(() => {
    if (!videoSel) return;
    void api.get<MetricSnapshot[]>(`/api/metricas/video/${videoSel}`).then(setSnaps);
  }, [videoSel]);

  const refrescar = () => {
    cargarGlobal();
    if (videoSel) void api.get<MetricSnapshot[]>(`/api/metricas/video/${videoSel}`).then(setSnaps);
  };

  const eliminar = async (id: string) => {
    await api.del(`/api/metricas/snapshot/${id}`);
    refrescar();
  };

  const datosGrafica = snaps.map((s) => ({
    dia: `D${s.diasDesdePublicacion}`,
    vistas: s.vistas,
    ctr: s.ctr,
    retencion: s.retencionMediaPct,
  }));

  const kpis: Array<[string, string]> = resumen
    ? [
        [String(resumen.videosConMetricas), "vídeos con métricas"],
        [resumen.vistasTotales.toLocaleString("es-ES"), "vistas acumuladas"],
        [`${resumen.ctrMedio}%`, "CTR medio"],
        [`${resumen.retencionMedia}%`, "retención media"],
        [String(resumen.suscriptoresGanados), "suscriptores ganados"],
      ]
    : [];

  return (
    <div className="page" style={{ maxWidth: 1440 }}>
      <div className="page-head">
        <div>
          <h1>{es.nav.metricas}</h1>
          <p>Registra snapshots manuales desde YouTube Analytics y deja que los datos hablen.</p>
        </div>
        {videoSel && (
          <button className="btn btn-primary" onClick={() => setModal({ open: true, editar: null })} data-testid="metricas-nuevo-snapshot">
            <Plus size={16} /> Nuevo snapshot
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        {kpis.map(([num, label]) => (
          <div className="card kpi" key={label}>
            <span className="kpi-num" style={{ fontSize: "var(--text-2xl)" }}>{num}</span>
            <span className="kpi-label">{label}</span>
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: "var(--space-3)" }}>
            <Lightbulb size={18} style={{ color: "var(--accent-gold)" }} /> Insights
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8, color: "var(--text-secondary)" }}>
            {insights.map((i, n) => (
              <li key={n} data-testid={`insight-${n}`}>{i.texto}</li>
            ))}
          </ul>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="card">
          <EmptyState icon={LineChartIcon} title="Todavía no hay nada que medir" desc="Publica tu primer vídeo y registra aquí sus métricas durante el sprint." />
        </div>
      ) : (
        <>
          <div className="filtros">
            <select className="select" value={videoSel} data-testid="metricas-video-select" onChange={(e) => setVideoSel(e.target.value)} style={{ minWidth: 280 }}>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.tituloFinal ?? v.tituloIdea}
                </option>
              ))}
            </select>
          </div>

          {snaps.length >= 2 ? (
            <div className="card" style={{ marginBottom: "var(--space-5)", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGrafica} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                  <XAxis dataKey="dia" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis yAxisId="vistas" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", borderRadius: 8, color: "var(--text-primary)" }} />
                  <Legend />
                  <Line yAxisId="vistas" type="monotone" dataKey="vistas" stroke="var(--accent-primary)" strokeWidth={2} dot />
                  <Line yAxisId="pct" type="monotone" dataKey="ctr" name="CTR %" stroke="var(--accent-gold)" strokeWidth={2} dot />
                  <Line yAxisId="pct" type="monotone" dataKey="retencion" name="Retención %" stroke="var(--accent-mint)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <EmptyState icon={TrendingUp} title="Con 2+ snapshots verás la evolución" desc="Registra métricas el día 2, 4 y 7 del sprint (la checklist te lo recuerda)." />
            </div>
          )}

          {snaps.length > 0 && (
            <div className="card" style={{ overflowX: "auto" }}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th><th>Día</th><th>Vistas</th><th>CTR</th><th>Retención</th><th>Vel./día</th><th>Subs</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {snaps.map((s) => (
                    <tr key={s.id} data-testid={`snapshot-row-${s.fecha}`}>
                      <td className="mono">{s.fecha}</td>
                      <td className="mono">{s.diasDesdePublicacion}</td>
                      <td>{s.vistas.toLocaleString("es-ES")}</td>
                      <td>{s.ctr}%</td>
                      <td>{s.retencionMediaPct}%</td>
                      <td>{s.velocidadVisualizacion}</td>
                      <td>{s.suscriptoresGanados}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button className="btn btn-ghost btn-sm" aria-label="Editar snapshot" onClick={() => setModal({ open: true, editar: s })}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" aria-label="Eliminar snapshot" onClick={() => void eliminar(s.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {videoSel && (
        <SnapshotModal
          open={modal.open}
          editar={modal.editar}
          videoProjectId={videoSel}
          onClose={() => setModal({ open: false, editar: null })}
          onGuardado={refrescar}
        />
      )}
    </div>
  );
}
