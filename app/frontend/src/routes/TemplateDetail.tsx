// /plantillas/:id — variables → preview en vivo → copiar/descargar/duplicar/editar.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Download, Files, Save, Trash2 } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import type { Template } from "../types";

const aplicar = (contenido: string, vars: Record<string, string>) =>
  contenido.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (m, n) => (vars[n] ? vars[n] : m));

export function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useStore((s) => s.toast);
  const profile = useStore((s) => s.profile);
  const [tpl, setTpl] = useState<Template | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState({ nombre: "", contenido: "" });
  const [modalEliminar, setModalEliminar] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Template>(`/api/plantillas/${id}`)
      .then((t) => {
        setTpl(t);
        setBorrador({ nombre: t.nombre, contenido: t.contenido });
        const iniciales: Record<string, string> = {};
        for (const v of t.variablesDinamicas) {
          iniciales[v.nombre] =
            v.nombre === "nombreCanal" && profile ? profile.canalNombre : v.valorPorDefecto;
        }
        setVars(iniciales);
      })
      .catch(() => {
        toast("error", "Esa plantilla no existe");
        navigate("/plantillas", { replace: true });
      });
  }, [id, navigate, toast, profile]);

  const preview = useMemo(() => (tpl ? aplicar(editando ? borrador.contenido : tpl.contenido, vars) : ""), [tpl, vars, editando, borrador.contenido]);

  if (!tpl) {
    return (
      <div className="splash" style={{ height: "40vh" }}>
        <span className="spinner" />
      </div>
    );
  }

  const copiar = async () => {
    await navigator.clipboard.writeText(preview);
    toast("success", "Copiado al portapapeles");
  };

  const duplicar = async () => {
    const copia = await api.post<Template>("/api/plantillas", { duplicaDe: tpl.id });
    toast("success", "Duplicada: ya puedes editarla");
    navigate(`/plantillas/${copia.id}`);
  };

  const guardar = async () => {
    try {
      const t = await api.patch<Template>(`/api/plantillas/${tpl.id}`, borrador);
      setTpl(t);
      setEditando(false);
      toast("success", "Plantilla guardada");
    } catch (e) {
      toast("error", isApiError(e) ? e.message : "No se pudo guardar");
    }
  };

  const eliminar = async () => {
    await api.del(`/api/plantillas/${tpl.id}`);
    toast("info", "Plantilla eliminada");
    navigate("/plantillas");
  };

  const urlDescarga = (formato: "md" | "txt") =>
    `/api/plantillas/${tpl.id}/descargar?formato=${formato}&variables=${encodeURIComponent(JSON.stringify(vars))}`;

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <Link to="/plantillas" className="field-hint" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
        <ArrowLeft size={14} /> Biblioteca
      </Link>
      <div className="page-head" style={{ marginTop: "var(--space-3)" }}>
        <div>
          {editando ? (
            <input
              className="input"
              style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}
              value={borrador.nombre}
              onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
            />
          ) : (
            <h1>{tpl.nombre}</h1>
          )}
          <p>
            {tpl.tipo}
            {tpl.seccionRelacionadaId && ` · sección ${tpl.seccionRelacionadaId}`}
            {tpl.esPrecargada && " · precargada (solo lectura)"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={copiar} data-testid="tpl-copiar">
            <Copy size={14} /> Copiar
          </button>
          <a className="btn btn-secondary btn-sm" href={urlDescarga("md")} data-testid="tpl-descargar-md">
            <Download size={14} /> .md
          </a>
          <a className="btn btn-secondary btn-sm" href={urlDescarga("txt")} data-testid="tpl-descargar-txt">
            <Download size={14} /> .txt
          </a>
          <button className="btn btn-secondary btn-sm" onClick={duplicar} data-testid={`template-use-${tpl.id}`}>
            <Files size={14} /> Duplicar
          </button>
          {tpl.esEditable &&
            (editando ? (
              <button className="btn btn-primary btn-sm" onClick={guardar} data-testid="tpl-guardar">
                <Save size={14} /> Guardar
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => setEditando(true)} data-testid="tpl-editar">
                Editar
              </button>
            ))}
          {!tpl.esPrecargada && (
            <button className="btn btn-danger btn-sm" onClick={() => setModalEliminar(true)} data-testid="tpl-eliminar">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="detalle-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,3fr)", gap: "var(--space-5)" }}>
        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>Variables</h3>
          {tpl.variablesDinamicas.length === 0 && <p className="field-hint">Esta plantilla no tiene variables.</p>}
          {tpl.variablesDinamicas.map((v) => (
            <div className="field" key={v.nombre}>
              <label className="label" htmlFor={`var-${v.nombre}`}>
                {v.nombre}
                {v.descripcion && <span style={{ fontWeight: 400, color: "var(--text-tertiary)" }}> — {v.descripcion}</span>}
              </label>
              <input
                id={`var-${v.nombre}`}
                className="input"
                type={v.tipo === "numero" ? "number" : "text"}
                value={vars[v.nombre] ?? ""}
                data-testid={`tpl-var-${v.nombre}`}
                onChange={(e) => setVars({ ...vars, [v.nombre]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "var(--space-4)" }}>{editando ? "Contenido (editando)" : "Vista previa"}</h3>
          {editando ? (
            <textarea
              className="textarea mono"
              style={{ minHeight: 420 }}
              value={borrador.contenido}
              data-testid="tpl-contenido-edit"
              onChange={(e) => setBorrador({ ...borrador, contenido: e.target.value })}
            />
          ) : (
            <pre className="tpl-preview" data-testid="tpl-preview">{preview}</pre>
          )}
        </div>
      </div>

      <Modal
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        title="¿Eliminar esta plantilla?"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setModalEliminar(false)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={eliminar} data-testid="tpl-confirm-eliminar">
              Eliminar
            </button>
          </>
        }
      >
        <p>“{tpl.nombre}” se eliminará definitivamente. Las precargadas no se pueden eliminar; esta es una copia tuya.</p>
      </Modal>
    </div>
  );
}
