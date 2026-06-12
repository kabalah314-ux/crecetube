// Configuración — perfil + preferencias + IA (test de conexión). Export/import llega en Sprint 6.
import { useRef, useState } from "react";
import { Check, X, Database, Download, Upload } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import { AiBlock } from "../wizard/AiBlock";
import type { Frecuencia, Nivel, Objetivo } from "../types";

const MODELOS_FREE = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
];

export function Settings() {
  const profile = useStore((s) => s.profile)!;
  const patchProfile = useStore((s) => s.patchProfile);
  const setTheme = useStore((s) => s.setTheme);
  const toast = useStore((s) => s.toast);

  const [perfil, setPerfil] = useState({
    canalNombre: profile.canalNombre ?? "",
    canalUrl: profile.canalUrl ?? "",
    nicho: profile.nicho ?? "",
    nivel: profile.nivel,
    frecuenciaObjetivo: profile.frecuenciaObjetivo,
    objetivoPrincipal: profile.objetivoPrincipal,
  });
  const [ia, setIa] = useState({
    modelo: profile.iaConfig.modelo,
    apiKeyInput: "",
    temperatura: profile.iaConfig.temperatura,
  });
  const [test, setTest] = useState<{ tipo: "idle" | "loading" | "ok" | "err"; msg?: string }>({ tipo: "idle" });
  const claveGuardada = profile.iaConfig.apiKey === "***";
  const fileRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<unknown | null>(null);
  const [replaceAll, setReplaceAll] = useState(false);
  const [importando, setImportando] = useState(false);
  const loadProfile = useStore((s) => s.loadProfile);

  const onFichero = async (f: File) => {
    try {
      setImportData(JSON.parse(await f.text()));
    } catch {
      toast("error", "Ese archivo no es un JSON válido");
    }
  };

  const importar = async () => {
    setImportando(true);
    try {
      const r = await api.post<{ importado: Record<string, number> }>("/api/import", { replaceAll, data: importData });
      setImportData(null);
      await loadProfile();
      toast("success", `Importado: ${r.importado.videos} vídeo(s), ${r.importado.progresoCurso} progreso(s), ${r.importado.plantillasPropias} plantilla(s)`);
    } catch (e) {
      toast("error", isApiError(e) ? e.message : "No se pudo importar");
    } finally {
      setImportando(false);
    }
  };

  const guardarPerfil = async () => {
    try {
      // Vacío = "todavía sin decidir" → null (el backend acepta nulls desde T021)
      await patchProfile({
        ...perfil,
        canalNombre: perfil.canalNombre.trim() || null,
        nicho: perfil.nicho.trim() || null,
        canalUrl: perfil.canalUrl || null,
      });
      toast("success", "Perfil guardado");
    } catch (e) {
      toast("error", isApiError(e) ? e.message : "No se pudo guardar");
    }
  };

  const guardarIa = async () => {
    try {
      await patchProfile({
        iaConfig: {
          modelo: ia.modelo,
          temperatura: ia.temperatura,
          ...(ia.apiKeyInput ? { apiKey: ia.apiKeyInput } : {}),
        },
      });
      setIa((s) => ({ ...s, apiKeyInput: "" }));
      toast("success", "Configuración de IA guardada");
    } catch (e) {
      toast("error", isApiError(e) ? e.message : "No se pudo guardar");
    }
  };

  const probar = async () => {
    setTest({ tipo: "loading" });
    try {
      const r = await api.post<{ modelo: string; latenciaMs: number }>("/api/ia/test-conexion", {
        iaConfig: { modelo: ia.modelo, ...(ia.apiKeyInput ? { apiKey: ia.apiKeyInput } : {}) },
      });
      setTest({ tipo: "ok", msg: `Conectado · ${r.modelo} · ${r.latenciaMs}ms` });
    } catch (e) {
      setTest({ tipo: "err", msg: isApiError(e) ? e.message : "Error inesperado" });
    }
  };

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <div className="page-head">
        <h1>{es.settings.titulo}</h1>
      </div>

      {/* ---- Perfil ---- */}
      <section className="card" style={{ marginBottom: "var(--space-5)" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>{es.settings.perfil}</h3>
        <div className="field">
          <label className="label">Nombre del canal</label>
          <input className="input" data-testid="settings-canal-nombre" value={perfil.canalNombre} maxLength={80}
            onChange={(e) => setPerfil({ ...perfil, canalNombre: e.target.value })} />
        </div>
        {/* T022: sugerir nombres con IA — solo si el perfil aún no tiene nombre pero sí nicho */}
        {!profile.canalNombre && profile.nicho && (
          <div data-testid="nombres-canal-block" style={{ marginBottom: "var(--space-4)" }}>
            <AiBlock
              tipo="sugerir_nombres_canal"
              etiqueta={es.nombresCanal.etiqueta}
              tip={es.nombresCanal.tip}
              opciones={{ nicho: profile.nicho }}
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
                          onClick={() => {
                            setPerfil((s) => ({ ...s, canalNombre: r.nombre }));
                            toast("info", es.nombresCanal.aplicadoLocal);
                          }}
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
        )}
        <div className="field">
          <label className="label">URL del canal</label>
          <input className="input" data-testid="settings-canal-url" value={perfil.canalUrl}
            placeholder="https://youtube.com/@tucanal"
            onChange={(e) => setPerfil({ ...perfil, canalUrl: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Nicho</label>
          <input className="input" data-testid="settings-nicho" value={perfil.nicho} maxLength={60}
            onChange={(e) => setPerfil({ ...perfil, nicho: e.target.value })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
          <div className="field">
            <label className="label">Nivel</label>
            <select className="select" data-testid="settings-nivel" value={perfil.nivel}
              onChange={(e) => setPerfil({ ...perfil, nivel: e.target.value as Nivel })}>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Frecuencia objetivo</label>
            <select className="select" data-testid="settings-frecuencia" value={perfil.frecuenciaObjetivo ?? ""}
              onChange={(e) => setPerfil({ ...perfil, frecuenciaObjetivo: (e.target.value || null) as Frecuencia | null })}>
              <option value="">{es.onboarding.frecuenciaNoSe}</option>
              {Object.entries(es.frecuencias).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Objetivo</label>
            <select className="select" data-testid="settings-objetivo" value={perfil.objetivoPrincipal}
              onChange={(e) => setPerfil({ ...perfil, objetivoPrincipal: e.target.value as Objetivo })}>
              {Object.entries(es.objetivos).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={guardarPerfil} data-testid="settings-guardar-perfil">
          {es.common.guardar}
        </button>
      </section>

      {/* ---- Preferencias ---- */}
      <section className="card" style={{ marginBottom: "var(--space-5)" }}>
        <h3 style={{ marginBottom: "var(--space-4)" }}>{es.settings.preferencias}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span>{es.settings.tema}</span>
            <button
              className="switch"
              role="switch"
              aria-checked={profile.preferenciasUi.tema === "dark"}
              data-testid="settings-tema"
              onClick={() => setTheme(profile.preferenciasUi.tema === "dark" ? "light" : "dark")}
            />
          </label>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span>{es.settings.densidad}</span>
            <select
              className="select"
              style={{ width: 180 }}
              data-testid="settings-densidad"
              value={profile.preferenciasUi.densidad}
              onChange={(e) => patchProfile({ preferenciasUi: { densidad: e.target.value as "compacta" | "comoda" } })}
            >
              <option value="comoda">Cómoda</option>
              <option value="compacta">Compacta</option>
            </select>
          </label>
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span>{es.settings.sonidos}</span>
            <button
              className="switch"
              role="switch"
              aria-checked={profile.preferenciasUi.sonidos}
              data-testid="settings-sonidos"
              onClick={() => patchProfile({ preferenciasUi: { sonidos: !profile.preferenciasUi.sonidos } })}
            />
          </label>
        </div>
      </section>

      {/* ---- IA ---- */}
      <section className="card" style={{ marginBottom: "var(--space-5)" }}>
        <h3 style={{ marginBottom: "var(--space-2)" }}>{es.settings.ia}</h3>
        <p className="field-hint" style={{ marginBottom: "var(--space-4)" }}>{es.settings.iaLimites}</p>
        <div className="field">
          <label className="label">Modelo</label>
          <select className="select" data-testid="settings-ia-modelo" value={ia.modelo}
            onChange={(e) => setIa({ ...ia, modelo: e.target.value })}>
            {MODELOS_FREE.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            {!MODELOS_FREE.includes(ia.modelo) && <option value={ia.modelo}>{ia.modelo}</option>}
          </select>
          <p className="field-hint">{es.settings.iaAvisoPrivacidad}</p>
        </div>
        <div className="field">
          <label className="label">API key {claveGuardada && "(hay una clave guardada)"}</label>
          <input className="input" type="password" data-testid="settings-ia-key"
            placeholder={claveGuardada ? "••••••••  (escribe para sustituirla)" : "sk-or-…"}
            value={ia.apiKeyInput}
            onChange={(e) => { setIa({ ...ia, apiKeyInput: e.target.value }); setTest({ tipo: "idle" }); }} />
        </div>
        <div className="field">
          <label className="label">Temperatura: {ia.temperatura.toFixed(1)}</label>
          <input type="range" min={0} max={1} step={0.1} value={ia.temperatura} data-testid="settings-ia-temperatura"
            onChange={(e) => setIa({ ...ia, temperatura: Number(e.target.value) })} style={{ width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={guardarIa} data-testid="settings-ia-guardar">
            {es.common.guardar}
          </button>
          <button className="btn btn-secondary" onClick={probar} disabled={test.tipo === "loading" || (!claveGuardada && !ia.apiKeyInput)}
            data-testid="settings-ia-test">
            {test.tipo === "loading" ? <span className="spinner" /> : null} Probar conexión
          </button>
          {test.tipo === "ok" && (
            <span style={{ color: "var(--accent-mint)", display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Check size={16} /> {test.msg}
            </span>
          )}
          {test.tipo === "err" && (
            <span style={{ color: "var(--accent-rust)", display: "inline-flex", gap: 6, alignItems: "center" }}>
              <X size={16} /> {test.msg}
            </span>
          )}
        </div>
      </section>

      {/* ---- Export/Import ---- */}
      <section className="card">
        <h3 style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: "var(--space-2)" }}>
          <Database size={20} /> {es.settings.exportImport}
        </h3>
        <p className="field-hint" style={{ marginBottom: "var(--space-4)" }}>
          Sin login, tus datos viven solo en este dispositivo: descarga una copia de vez en cuando.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <a className="btn btn-secondary" href="/api/export" data-testid="btn-export">
            <Download size={16} /> Descargar copia (JSON)
          </a>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            data-testid="input-import"
            onChange={(e) => e.target.files?.[0] && void onFichero(e.target.files[0])}
          />
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} data-testid="btn-import">
            <Upload size={16} /> Importar copia
          </button>
        </div>
      </section>

      <Modal
        open={importData !== null}
        onClose={() => setImportData(null)}
        title="Importar copia de seguridad"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setImportData(null)}>
              {es.common.cancelar}
            </button>
            <button className="btn btn-primary" disabled={importando} onClick={importar} data-testid="confirm-import">
              {importando ? <span className="spinner" /> : <Upload size={16} />} Importar
            </button>
          </>
        }
      >
        <div className="radio-cards">
          <button type="button" className={`radio-card${!replaceAll ? " selected" : ""}`} onClick={() => setReplaceAll(false)} data-testid="import-merge">
            <strong>Fusionar</strong>
            <span>Añade lo del backup a lo que ya tienes (mismo id = se actualiza)</span>
          </button>
          <button type="button" className={`radio-card${replaceAll ? " selected" : ""}`} onClick={() => setReplaceAll(true)} data-testid="import-replace">
            <strong>Sustituir todo</strong>
            <span>Borra lo actual y deja la app exactamente como en el backup</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}
