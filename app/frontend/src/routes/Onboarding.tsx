// Onboarding — 10 pasos (02 §2.2 + pregunta multicanal de T017), con borrador en localStorage.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Pencil, X } from "lucide-react";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import type { Frecuencia, Nivel, Objetivo } from "../types";

const DRAFT_KEY = "crecetube.onboarding.draft";
const NICHOS = ["cocina", "gaming", "finanzas", "tecnología", "fitness", "educación", "viajes", "humor"];

interface Draft {
  tieneCanalYa: boolean | null;
  gestionMulticanal: boolean | null;
  canalNombre: string;
  canalUrl: string;
  nicho: string;
  nivel: Nivel | null;
  frecuenciaObjetivo: Frecuencia | null;
  objetivoPrincipal: Objetivo | null;
  iaKey: string;
}

const EMPTY: Draft = {
  tieneCanalYa: null,
  gestionMulticanal: null,
  canalNombre: "",
  canalUrl: "",
  nicho: "",
  nivel: null,
  frecuenciaObjetivo: null,
  objetivoPrincipal: null,
  iaKey: "",
};

function loadDraft(): { paso: number; draft: Draft } {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { paso: parsed.paso ?? 0, draft: { ...EMPTY, ...parsed.draft } };
    }
  } catch {
    /* borrador corrupto → empezar de cero */
  }
  return { paso: 0, draft: EMPTY };
}

const urlValida = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export function Onboarding() {
  const init = useMemo(loadDraft, []);
  const [paso, setPaso] = useState(init.paso);
  const [draft, setDraft] = useState<Draft>(init.draft);
  const [error, setError] = useState("");
  const [testEstado, setTestEstado] = useState<{ tipo: "idle" | "loading" | "ok" | "err"; msg?: string }>({ tipo: "idle" });
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();
  const createProfile = useStore((s) => s.createProfile);
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ paso, draft }));
  }, [paso, draft]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setError("");
  };

  const go = (n: number) => {
    setError("");
    setPaso(n);
  };

  const valida = (p: number): string => {
    switch (p) {
      case 1:
        return draft.tieneCanalYa === null ? "Elige una opción para continuar" : "";
      case 2:
        return draft.gestionMulticanal === null ? es.onboarding.multicanalError : "";
      case 3:
        if (!draft.canalNombre.trim()) return "El nombre es obligatorio";
        if (draft.canalNombre.length > 80) return "Máximo 80 caracteres";
        if (draft.tieneCanalYa && draft.canalUrl && !urlValida(draft.canalUrl)) return es.onboarding.urlInvalida;
        return "";
      case 4:
        return draft.nicho.trim() ? "" : "Cuéntame tu nicho para personalizar la app";
      case 5:
        return draft.nivel ? "" : "Elige tu nivel";
      case 6:
        return draft.frecuenciaObjetivo ? "" : "Elige una frecuencia";
      case 7:
        return draft.objetivoPrincipal ? "" : "Elige tu objetivo";
      default:
        return "";
    }
  };

  const next = () => {
    const err = valida(paso);
    if (err) return setError(err);
    go(Math.min(paso + 1, 9));
  };

  const probarConexion = async () => {
    setTestEstado({ tipo: "loading" });
    try {
      const r = await api.post<{ ok: boolean; modelo: string; latenciaMs: number }>("/api/ia/test-conexion", {
        iaConfig: { apiKey: draft.iaKey },
      });
      setTestEstado({ tipo: "ok", msg: `Conectado · ${r.modelo} · ${r.latenciaMs}ms` });
    } catch (e) {
      setTestEstado({ tipo: "err", msg: isApiError(e) ? e.message : "Error inesperado" });
    }
  };

  const crear = async () => {
    setEnviando(true);
    try {
      const p = await createProfile({
        canalNombre: draft.canalNombre.trim(),
        canalUrl: draft.tieneCanalYa && draft.canalUrl ? draft.canalUrl : null,
        nicho: draft.nicho.trim(),
        nivel: draft.nivel!,
        frecuenciaObjetivo: draft.frecuenciaObjetivo!,
        objetivoPrincipal: draft.objetivoPrincipal!,
        tieneCanalYa: Boolean(draft.tieneCanalYa),
        gestionMulticanal: Boolean(draft.gestionMulticanal),
        ...(draft.iaKey ? ({ iaConfig: { apiKey: draft.iaKey } } as never) : {}),
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate("/dashboard");
      toast("success", es.onboarding.bienvenidaToast(p.canalNombre));
    } catch (e) {
      if (isApiError(e) && e.code === "PROFILE_ALREADY_EXISTS") navigate("/dashboard");
      else toast("error", isApiError(e) ? e.message : "No se pudo crear el perfil");
    } finally {
      setEnviando(false);
    }
  };

  const Card = ({
    sel,
    onClick,
    title,
    desc,
    testid,
  }: {
    sel: boolean;
    onClick: () => void;
    title: string;
    desc?: string;
    testid: string;
  }) => (
    <button type="button" className={`radio-card${sel ? " selected" : ""}`} onClick={onClick} data-testid={testid}>
      <strong>{title}</strong>
      {desc && <span>{desc}</span>}
    </button>
  );

  const pasos: Record<number, JSX.Element> = {
    0: (
      <>
        <div className="ob-brand">{es.app.nombre}</div>
        <h1 className="ob-title">{es.onboarding.bienvenidaClaim}</h1>
        <p className="ob-sub">{es.onboarding.bienvenidaSub}</p>
        <div>
          <button className="btn btn-primary btn-lg" onClick={() => go(1)} data-testid="onboarding-start">
            {es.onboarding.empezar} <ArrowRight size={20} />
          </button>
        </div>
      </>
    ),
    1: (
      <>
        <h1 className="ob-title">{es.onboarding.pasoCanalTitulo}</h1>
        <div className="radio-cards">
          <Card
            sel={draft.tieneCanalYa === true}
            onClick={() => set("tieneCanalYa", true)}
            title={es.onboarding.siTengo}
            desc={es.onboarding.siTengoDesc}
            testid="onboarding-has-channel-yes"
          />
          <Card
            sel={draft.tieneCanalYa === false}
            onClick={() => set("tieneCanalYa", false)}
            title={es.onboarding.noTengo}
            desc={es.onboarding.noTengoDesc}
            testid="onboarding-has-channel-no"
          />
        </div>
      </>
    ),
    2: (
      <>
        <h1 className="ob-title">{es.onboarding.multicanalTitulo}</h1>
        <div className="radio-cards">
          <Card
            sel={draft.gestionMulticanal === false}
            onClick={() => set("gestionMulticanal", false)}
            title={es.onboarding.multicanalUno}
            desc={es.onboarding.multicanalUnoDesc}
            testid="onboarding-multichannel-single"
          />
          <Card
            sel={draft.gestionMulticanal === true}
            onClick={() => set("gestionMulticanal", true)}
            title={es.onboarding.multicanalVarios}
            desc={es.onboarding.multicanalVariosDesc}
            testid="onboarding-multichannel-multi"
          />
        </div>
      </>
    ),
    3: (
      <>
        <h1 className="ob-title">
          {draft.tieneCanalYa ? es.onboarding.tuCanalTitulo : es.onboarding.tuCanalTituloNuevo}
        </h1>
        <div className="field">
          <label className="label" htmlFor="ob-nombre">
            {es.onboarding.nombreCanal}
          </label>
          <input
            id="ob-nombre"
            className="input"
            data-testid="onboarding-channel-name"
            placeholder={es.onboarding.nombrePlaceholder}
            value={draft.canalNombre}
            maxLength={80}
            autoFocus
            onChange={(e) => set("canalNombre", e.target.value)}
          />
          {draft.canalNombre.length >= 60 && (
            <div className={`char-count${draft.canalNombre.length >= 75 ? " warn" : ""}`}>
              {draft.canalNombre.length}/80
            </div>
          )}
        </div>
        {draft.tieneCanalYa && (
          <div className="field">
            <label className="label" htmlFor="ob-url">
              {es.onboarding.urlCanal}
            </label>
            <input
              id="ob-url"
              className="input"
              data-testid="onboarding-channel-url"
              placeholder="https://youtube.com/@tucanal"
              value={draft.canalUrl}
              onChange={(e) => set("canalUrl", e.target.value)}
            />
          </div>
        )}
      </>
    ),
    4: (
      <>
        <h1 className="ob-title">{es.onboarding.nichoTitulo}</h1>
        <div className="field">
          <input
            className="input"
            data-testid="onboarding-niche"
            placeholder={es.onboarding.nichoPlaceholder}
            value={draft.nicho}
            maxLength={60}
            autoFocus
            onChange={(e) => set("nicho", e.target.value)}
          />
        </div>
        <div className="chips">
          {NICHOS.map((n) => (
            <button
              type="button"
              key={n}
              className={`chip${draft.nicho === n ? " active" : ""}`}
              data-testid={`onboarding-niche-chip-${slug(n)}`}
              onClick={() => set("nicho", n)}
            >
              {n}
            </button>
          ))}
        </div>
      </>
    ),
    5: (
      <>
        <h1 className="ob-title">{es.onboarding.nivelTitulo}</h1>
        <div className="radio-cards">
          {(
            [
              ["principiante", es.onboarding.nivelPrincipiante, es.onboarding.nivelPrincipianteDesc],
              ["intermedio", es.onboarding.nivelIntermedio, es.onboarding.nivelIntermedioDesc],
              ["avanzado", es.onboarding.nivelAvanzado, es.onboarding.nivelAvanzadoDesc],
            ] as const
          ).map(([v, t, d]) => (
            <Card key={v} sel={draft.nivel === v} onClick={() => set("nivel", v)} title={t} desc={d} testid={`onboarding-level-${v}`} />
          ))}
        </div>
      </>
    ),
    6: (
      <>
        <h1 className="ob-title">{es.onboarding.frecuenciaTitulo}</h1>
        <div className="radio-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
          {(Object.keys(es.frecuencias) as Frecuencia[]).map((f) => (
            <Card
              key={f}
              sel={draft.frecuenciaObjetivo === f}
              onClick={() => set("frecuenciaObjetivo", f)}
              title={es.frecuencias[f]}
              testid={`onboarding-frequency-${f}`}
            />
          ))}
        </div>
        <p className="field-hint">{es.onboarding.frecuenciaHint}</p>
      </>
    ),
    7: (
      <>
        <h1 className="ob-title">{es.onboarding.objetivoTitulo}</h1>
        <div className="radio-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          {(Object.keys(es.objetivos) as Objetivo[]).map((o) => (
            <Card
              key={o}
              sel={draft.objetivoPrincipal === o}
              onClick={() => set("objetivoPrincipal", o)}
              title={es.objetivos[o]}
              testid={`onboarding-goal-${o}`}
            />
          ))}
        </div>
      </>
    ),
    8: (
      <>
        <h1 className="ob-title">{es.onboarding.iaTitulo}</h1>
        <p className="ob-sub">{es.onboarding.iaDesc}</p>
        <div className="field">
          <label className="label" htmlFor="ob-iakey">
            {es.onboarding.iaKey}
          </label>
          <input
            id="ob-iakey"
            className="input"
            type="password"
            data-testid="onboarding-ai-key"
            placeholder="sk-or-…"
            value={draft.iaKey}
            onChange={(e) => {
              set("iaKey", e.target.value);
              setTestEstado({ tipo: "idle" });
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="onboarding-ai-test"
            disabled={!draft.iaKey || testEstado.tipo === "loading"}
            onClick={probarConexion}
          >
            {testEstado.tipo === "loading" ? <span className="spinner" /> : null} {es.onboarding.iaProbar}
          </button>
          {testEstado.tipo === "ok" && (
            <span style={{ color: "var(--accent-mint)", display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Check size={16} /> {testEstado.msg}
            </span>
          )}
          {testEstado.tipo === "err" && (
            <span style={{ color: "var(--accent-rust)", display: "inline-flex", gap: 6, alignItems: "center" }}>
              <X size={16} /> {testEstado.msg}
            </span>
          )}
        </div>
      </>
    ),
    9: (
      <>
        <h1 className="ob-title">{es.onboarding.resumenTitulo}</h1>
        <dl className="ob-resumen">
          {(
            [
              [es.onboarding.multicanalResumen, draft.gestionMulticanal ? es.onboarding.multicanalVarios : es.onboarding.multicanalUno, 2],
              [es.onboarding.nombreCanal, draft.canalNombre, 3],
              ["Nicho", draft.nicho, 4],
              ["Nivel", draft.nivel ? es.onboarding[`nivel${cap(draft.nivel)}` as "nivelIntermedio"] : "", 5],
              ["Frecuencia", draft.frecuenciaObjetivo ? es.frecuencias[draft.frecuenciaObjetivo] : "", 6],
              ["Objetivo", draft.objetivoPrincipal ? es.objetivos[draft.objetivoPrincipal] : "", 7],
              ["IA", draft.iaKey ? "Configurada" : "Sin configurar (puedes hacerlo luego)", 8],
            ] as Array<[string, string, number]>
          ).map(([k, v, p]) => (
            <div className="ob-resumen-row" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
              <button type="button" className="btn btn-ghost btn-sm" aria-label={`Editar ${k}`} onClick={() => go(p)}>
                <Pencil size={14} />
              </button>
            </div>
          ))}
        </dl>
      </>
    ),
  };

  return (
    <div className="ob-wrap">
      <div className="ob-progress" aria-hidden={paso === 0}>
        {paso > 0 && (
          <>
            <div className="progress-thin">
              <div style={{ width: `${(paso / 9) * 100}%` }} />
            </div>
            <div className="field-hint" style={{ marginTop: 6 }}>
              Paso {paso} de 9
            </div>
          </>
        )}
      </div>
      <form
        className="ob-body"
        onSubmit={(e) => {
          e.preventDefault();
          if (paso === 9) crear();
          else next();
        }}
      >
        {pasos[paso]}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {paso > 0 && (
          <div className="ob-actions">
            <button type="button" className="btn btn-ghost" onClick={() => go(paso - 1)} data-testid="onboarding-back">
              {es.common.atras}
            </button>
            {paso === 8 ? (
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button type="button" className="btn btn-ghost" data-testid="onboarding-ai-skip" onClick={() => { set("iaKey", ""); go(9); }}>
                  {es.onboarding.iaDespues}
                </button>
                <button type="submit" className="btn btn-primary">
                  {es.onboarding.iaGuardarSeguir}
                </button>
              </div>
            ) : paso === 9 ? (
              <button type="submit" className="btn btn-primary btn-lg" disabled={enviando} data-testid="onboarding-submit">
                {enviando ? <span className="spinner" /> : <Check size={18} />} {es.onboarding.crearEspacio}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" data-testid="onboarding-next">
                {es.common.siguiente} <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "educación" → "educacion" (testids sin tildes, kebab-case)
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
