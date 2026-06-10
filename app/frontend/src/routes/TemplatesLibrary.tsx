// /plantillas — biblioteca con filtro por tipo (08 §8.6).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Lock, PencilLine } from "lucide-react";
import { es } from "../i18n/es";
import { api } from "../services/api";
import type { Template } from "../types";

const TIPOS: Array<[string, string]> = [
  ["", "Todas"],
  ["descripcion", "Descripción"],
  ["guion", "Guion"],
  ["miniatura_brief", "Miniatura"],
  ["email", "Email"],
  ["comunidad", "Comunidad"],
  ["checklist", "Checklist"],
  ["pantalla_final", "Pantallas"],
  ["tarjeta", "Tarjetas"],
  ["banner", "Banner"],
  ["trailer", "Tráiler"],
];

export function TemplatesLibrary() {
  const [plantillas, setPlantillas] = useState<Template[] | null>(null);
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    void api.get<Template[]>(`/api/plantillas${tipo ? `?tipo=${tipo}` : ""}`).then(setPlantillas);
  }, [tipo]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{es.nav.plantillas}</h1>
          <p>25 plantillas precargadas del método. Duplica cualquiera para hacerla tuya.</p>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: "var(--space-5)" }}>
        {TIPOS.map(([v, l]) => (
          <button key={v} className={`chip${tipo === v ? " active" : ""}`} data-testid={`tpl-filter-${v || "todas"}`} onClick={() => setTipo(v)}>
            {l}
          </button>
        ))}
      </div>

      {plantillas === null ? (
        <div className="splash" style={{ height: "30vh" }}>
          <span className="spinner" />
        </div>
      ) : (
        <div className="videos-grid">
          {plantillas.map((p) => (
            <Link key={p.id} to={`/plantillas/${p.id}`} className="card card-hover" data-testid={`tpl-card-${p.id}`} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <FileText size={20} style={{ color: "var(--accent-gold)" }} />
                {p.esPrecargada ? (
                  <Lock size={14} style={{ color: "var(--text-disabled)" }} aria-label="Precargada (solo lectura)" />
                ) : (
                  <PencilLine size={14} style={{ color: "var(--accent-mint)" }} aria-label="Editable" />
                )}
              </div>
              <h3 style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-base)", fontWeight: 700 }}>{p.nombre}</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="tag" style={{ ["--tag-color" as never]: "var(--accent-gold)" }}>
                  {p.tipo}
                </span>
                {p.seccionRelacionadaId && (
                  <span className="tag" style={{ ["--tag-color" as never]: "var(--text-tertiary)" }}>
                    {p.seccionRelacionadaId}
                  </span>
                )}
              </div>
              <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
                {p.variablesDinamicas.length} variable(s)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
