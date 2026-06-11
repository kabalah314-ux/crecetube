// Etapas cuyo cuerpo principal es el checklist (6 grabación y 7 edición) + base
// temporal para 8-10 hasta el Sprint 3.
import { useState } from "react";
import { ChevronDown, ChevronUp, Printer } from "lucide-react";
import { CONSEJOS } from "../consejos";
import type { StepProps } from "./types";

export function StepGenerico({
  video,
  patch,
  labelNotas,
  mostrarGuion,
  recordatoriosEdicion,
}: StepProps & { labelNotas: string; mostrarGuion?: boolean; recordatoriosEdicion?: boolean }) {
  const [guionAbierto, setGuionAbierto] = useState(false);

  const pendientes = recordatoriosEdicion
    ? video.guion.desarrollo
        .map((b, i) => {
          const cosas = [
            b.roturaPatron && "rotura de patrón",
            b.seoReset && "SEOreset",
            b.seoZoom && "SEOzoom",
          ].filter(Boolean);
          return cosas.length ? `Bloque ${i + 1}${b.titulo ? ` (${b.titulo})` : ""}: ${cosas.join(", ")}` : null;
        })
        .filter(Boolean)
    : [];

  return (
    <>
      {recordatoriosEdicion && pendientes.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-5)", borderColor: "var(--accent-gold)" }}>
          <strong>Tu guion pide:</strong>
          <ul style={{ margin: "var(--space-2) 0 0 var(--space-5)", color: "var(--text-secondary)" }}>
            {pendientes.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
          <p className="field-hint">{CONSEJOS.edicion.campos.tuGuionPide}</p>
        </div>
      )}

      {mostrarGuion && (
        <div className="card" style={{ marginBottom: "var(--space-5)" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setGuionAbierto(!guionAbierto)}
            data-testid="ver-guion"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            Ver guion {guionAbierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {guionAbierto && (
            <div className="guion-lectura">
              {video.guion.seoShock && <p><strong>SEOshock:</strong> {video.guion.seoShock}</p>}
              {video.guion.seoInicio && <p><strong>SEOinicio:</strong> {video.guion.seoInicio}</p>}
              {video.guion.seoLoop && <p><strong>SEOloop:</strong> {video.guion.seoLoop}</p>}
              {video.guion.desarrollo.map((b, i) => (
                <p key={i}>
                  <strong>Bloque {i + 1}{b.titulo ? ` · ${b.titulo}` : ""}:</strong> {b.contenido}
                </p>
              ))}
              {video.guion.seoResultado && <p><strong>SEOresultado:</strong> {video.guion.seoResultado}</p>}
              {video.guion.cliffhanger && <p><strong>Cliffhanger:</strong> {video.guion.cliffhanger}</p>}
              {video.guion.psicoCta && <p><strong>PsicoCTA:</strong> {video.guion.psicoCta}</p>}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                <Printer size={14} /> Imprimir guion
              </button>
            </div>
          )}
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="f-notas">
          {labelNotas}
        </label>
        <textarea
          id="f-notas"
          className="textarea"
          data-testid="field-notas"
          value={video.notas}
          placeholder="Apuntes libres del proyecto"
          onChange={(e) => patch({ notas: e.target.value })}
        />
      </div>
    </>
  );
}
