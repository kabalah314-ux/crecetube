// SnapshotModal — alta/edición de MetricSnapshot (03 §3.1.6). Usado en /metricas y etapa sprint.
import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import type { MetricSnapshot } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  videoProjectId: string;
  editar?: MetricSnapshot | null;
  onGuardado: (s: MetricSnapshot) => void;
}

const CAMPOS: Array<[keyof MetricSnapshot, string, string]> = [
  ["vistas", "Vistas", "number"],
  ["impresiones", "Impresiones", "number"],
  ["ctr", "CTR %", "number"],
  ["retencionMediaPct", "Retención media %", "number"],
  ["duracionMediaSeg", "Duración media (seg)", "number"],
  ["suscriptoresGanados", "Suscriptores ganados", "number"],
  ["comentarios", "Comentarios", "number"],
  ["likes", "Likes", "number"],
  ["ingresosEstimados", "Ingresos estimados (€)", "number"],
  ["rpm", "RPM (€)", "number"],
];

export function SnapshotModal({ open, onClose, videoProjectId, editar, onGuardado }: Props) {
  const toast = useStore((s) => s.toast);
  const [datos, setDatos] = useState<Record<string, string>>({});
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editar) {
      setFecha(editar.fecha);
      const d: Record<string, string> = {};
      for (const [k] of CAMPOS) d[k] = editar[k] == null ? "" : String(editar[k]);
      d.notas = editar.notas;
      setDatos(d);
    } else {
      setDatos({});
      setFecha(new Date().toISOString().slice(0, 10));
    }
  }, [open, editar]);

  const guardar = async () => {
    setGuardando(true);
    try {
      const body: Record<string, unknown> = { notas: datos.notas ?? "" };
      for (const [k] of CAMPOS) {
        if (datos[k] !== "" && datos[k] !== undefined) body[k] = Number(datos[k]);
      }
      let s: MetricSnapshot;
      if (editar) {
        s = await api.patch<MetricSnapshot>(`/api/metricas/snapshot/${editar.id}`, body);
      } else {
        s = await api.post<MetricSnapshot>("/api/metricas/snapshot", { ...body, videoProjectId, fecha });
      }
      onGuardado(s);
      onClose();
      toast("success", editar ? "Snapshot actualizado" : "Snapshot registrado");
    } catch (e) {
      toast("error", isApiError(e) ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editar ? `Editar snapshot del ${editar.fecha}` : "Nuevo snapshot de métricas"}
      wide
      actions={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={guardando} onClick={guardar} data-testid="snapshot-guardar">
            {guardando ? <span className="spinner" /> : null} Guardar
          </button>
        </>
      }
    >
      {!editar && (
        <div className="field" style={{ maxWidth: 220 }}>
          <label className="label" htmlFor="snap-fecha">
            Fecha
          </label>
          <input id="snap-fecha" type="date" className="input" value={fecha} data-testid="snapshot-fecha" onChange={(e) => setFecha(e.target.value)} />
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
        {CAMPOS.map(([k, label]) => (
          <div className="field" key={String(k)} style={{ marginBottom: 0 }}>
            <label className="label" htmlFor={`snap-${String(k)}`}>
              {label}
            </label>
            <input
              id={`snap-${String(k)}`}
              type="number"
              step="any"
              className="input"
              value={datos[k as string] ?? ""}
              data-testid={`snapshot-${String(k)}`}
              onChange={(e) => setDatos({ ...datos, [k]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="field" style={{ marginTop: "var(--space-4)" }}>
        <label className="label" htmlFor="snap-notas">
          Notas
        </label>
        <textarea id="snap-notas" className="textarea" style={{ minHeight: 60 }} value={datos.notas ?? ""} onChange={(e) => setDatos({ ...datos, notas: e.target.value })} />
      </div>
    </Modal>
  );
}
