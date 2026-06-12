// /acceso — entrar o crear cuenta (T016 Fase 1). Vive fuera de RequireProfile.
// Google Identity Services se carga bajo demanda solo si el backend tiene GOOGLE_CLIENT_ID.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import type { AuthUser } from "../types";

interface GisId {
  initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GisId } };
  }
}

let gisPromise: Promise<GisId> | null = null;

function loadGis(): Promise<GisId> {
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const ya = window.google?.accounts?.id;
      if (ya) return resolve(ya);
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => {
        const id = window.google?.accounts?.id;
        if (id) resolve(id);
        else reject(new Error("GIS no disponible"));
      };
      s.onerror = () => {
        gisPromise = null;
        reject(new Error("No se pudo cargar el script de Google"));
      };
      document.head.appendChild(s);
    });
  }
  return gisPromise;
}

export function Acceso() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [avisoModoLocal, setAvisoModoLocal] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const authConfig = useStore((s) => s.authConfig);
  const loadAuth = useStore((s) => s.loadAuth);
  const loadProfile = useStore((s) => s.loadProfile);
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    if (!authConfig) void loadAuth();
  }, [authConfig, loadAuth]);

  const tras = async (u: AuthUser, mensaje: string) => {
    await loadAuth();
    await loadProfile();
    toast("success", mensaje);
    // Si esa cuenta aún no tiene perfil, el onboarding lo crea.
    navigate(useStore.getState().profileStatus === "ready" ? "/dashboard" : "/onboarding", { replace: true });
    void u;
  };

  const fallo = (e: unknown, porDefecto: string) => {
    if (isApiError(e) && e.code === "AUTH_NOT_CONFIGURED" && !authConfig?.googleClientId) {
      setAvisoModoLocal(true);
      return;
    }
    toast("error", isApiError(e) ? e.message : porDefecto);
  };

  const entrar = async () => {
    setEnviando(true);
    try {
      const u = await api.post<AuthUser>("/api/auth/login", { email: loginEmail, password: loginPassword });
      await tras(u, es.acceso.sesionIniciada(u.nombre ?? u.email ?? ""));
    } catch (e) {
      fallo(e, "No se pudo iniciar sesión");
    } finally {
      setEnviando(false);
    }
  };

  const crearCuenta = async () => {
    setEnviando(true);
    try {
      const u = await api.post<AuthUser>("/api/auth/registro", {
        email: regEmail,
        password: regPassword,
        ...(regNombre.trim() ? { nombre: regNombre.trim() } : {}),
      });
      await tras(u, es.acceso.cuentaCreada);
    } catch (e) {
      fallo(e, "No se pudo crear la cuenta");
    } finally {
      setEnviando(false);
    }
  };

  // Cuenta demo (T023): sandbox precargada con datos de muestra, sin onboarding.
  const entrarDemo = async () => {
    setEnviando(true);
    try {
      await api.post<AuthUser>("/api/auth/demo");
      await loadAuth();
      await loadProfile();
      toast("success", es.acceso.demoIniciada);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      fallo(e, es.acceso.demoError);
    } finally {
      setEnviando(false);
    }
  };

  // Aviso de modo local: proactivo si el backend no tiene auth configurada (GET /api/auth/config),
  // o reactivo si un intento devuelve AUTH_NOT_CONFIGURED.
  const mostrarAvisoLocal = avisoModoLocal || (authConfig !== null && !authConfig.authConfigurada);

  // Botón de Google: solo si el backend tiene GOOGLE_CLIENT_ID.
  const googleClientId = authConfig?.googleClientId ?? null;
  useEffect(() => {
    if (!googleClientId || !googleRef.current) return;
    let cancelado = false;
    loadGis()
      .then((gis) => {
        if (cancelado || !googleRef.current) return;
        gis.initialize({
          client_id: googleClientId,
          callback: ({ credential }) => {
            void (async () => {
              try {
                const u = await api.post<AuthUser>("/api/auth/google", { credential });
                await tras(u, es.acceso.sesionIniciada(u.nombre ?? u.email ?? ""));
              } catch (e) {
                fallo(e, "No se pudo entrar con Google");
              }
            })();
          },
        });
        gis.renderButton(googleRef.current, { theme: "outline", size: "large", text: "continue_with", width: 280 });
      })
      .catch(() => toast("error", "No se pudo cargar el acceso con Google"));
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId]);

  return (
    <div className="ob-wrap" data-testid="acceso-page">
      <div className="ob-body" style={{ maxWidth: 760 }}>
        <div className="ob-brand">{es.app.nombre}</div>
        <h1 className="ob-title" style={{ fontSize: "var(--text-2xl)" }}>
          {es.acceso.titulo}
        </h1>
        <p className="ob-sub">{es.acceso.subtitulo}</p>

        {googleClientId && <div ref={googleRef} data-testid="acceso-google" />}

        {mostrarAvisoLocal && (
          <p className="field-hint" role="status" data-testid="acceso-aviso-local" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Info size={16} style={{ flex: "none", marginTop: 2 }} /> {es.acceso.avisoModoLocal}
          </p>
        )}

        <div className="acceso-grid">
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              void entrar();
            }}
          >
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>{es.acceso.tabEntrar}</h2>
            <div className="field">
              <label className="label" htmlFor="acceso-login-email">
                {es.acceso.email}
              </label>
              <input
                id="acceso-login-email"
                className="input"
                type="email"
                autoComplete="email"
                required
                data-testid="acceso-login-email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="acceso-login-password">
                {es.acceso.password}
              </label>
              <input
                id="acceso-login-password"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                data-testid="acceso-login-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={enviando} data-testid="acceso-login-submit">
              {enviando ? <span className="spinner" /> : null} {es.acceso.entrar}
            </button>
          </form>

          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              void crearCuenta();
            }}
          >
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)" }}>{es.acceso.tabCrear}</h2>
            <div className="field">
              <label className="label" htmlFor="acceso-registro-nombre">
                {es.acceso.nombre}
              </label>
              <input
                id="acceso-registro-nombre"
                className="input"
                maxLength={80}
                autoComplete="name"
                data-testid="acceso-registro-nombre"
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="acceso-registro-email">
                {es.acceso.email}
              </label>
              <input
                id="acceso-registro-email"
                className="input"
                type="email"
                autoComplete="email"
                required
                data-testid="acceso-registro-email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="acceso-registro-password">
                {es.acceso.password}
              </label>
              <input
                id="acceso-registro-password"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                data-testid="acceso-registro-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <p className="field-hint">{es.acceso.passwordHint}</p>
            </div>
            <button type="submit" className="btn btn-secondary" disabled={enviando} data-testid="acceso-registro-submit">
              {enviando ? <span className="spinner" /> : null} {es.acceso.crearCuenta}
            </button>
          </form>
        </div>

        {authConfig?.authConfigurada && (
          <div style={{ marginTop: "var(--space-5)", textAlign: "center" }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={enviando}
              data-testid="acceso-demo"
              onClick={() => void entrarDemo()}
            >
              {enviando ? <span className="spinner" /> : null} {es.acceso.probarDemo}
            </button>
            <p className="field-hint" style={{ marginTop: "var(--space-2)" }}>
              {es.acceso.demoHint}
            </p>
          </div>
        )}

        <Link to="/" className="field-hint">
          {es.acceso.volverInicio}
        </Link>
      </div>
    </div>
  );
}
