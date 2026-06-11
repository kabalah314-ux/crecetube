import { useState, useEffect } from "react";
import { Zap, X } from "lucide-react";
import { CONSEJOS } from "./consejos";
import type { StepId } from "../types";

function lsKey(slug: StepId) {
  return `ct.tipbanner.${slug}`;
}

function leerDescartado(slug: StepId): boolean {
  try {
    return localStorage.getItem(lsKey(slug)) === "1";
  } catch {
    return false;
  }
}

function guardarDescartado(slug: StepId) {
  try {
    localStorage.setItem(lsKey(slug), "1");
  } catch {
    // sin acceso a localStorage — ignorar silenciosamente
  }
}

function borrarDescartado(slug: StepId) {
  try {
    localStorage.removeItem(lsKey(slug));
  } catch {
    // sin acceso a localStorage — ignorar silenciosamente
  }
}

export function TipBanner({ slug }: { slug: StepId }) {
  const consejo = CONSEJOS[slug];
  const [descartado, setDescartado] = useState(() => leerDescartado(slug));
  const [expandido, setExpandido] = useState(false);

  // Re-evaluar estado de descartado cuando cambie el slug
  useEffect(() => {
    setDescartado(leerDescartado(slug));
    setExpandido(false);
  }, [slug]);

  function descartar() {
    guardarDescartado(slug);
    setDescartado(true);
  }

  function reabrir() {
    borrarDescartado(slug);
    setDescartado(false);
  }

  if (descartado) {
    return (
      <div
        className="tip-banner-collapsed"
        data-testid={`tip-banner-${slug}`}
        role="button"
        tabIndex={0}
        onClick={reabrir}
        onKeyDown={(e) => e.key === "Enter" && reabrir()}
        data-testid-reopen={`tip-banner-reopen-${slug}`}
      >
        <Zap size={14} />
        <span data-testid={`tip-banner-reopen-${slug}`}>Consejo Romuald — mostrar</span>
      </div>
    );
  }

  return (
    <div className="tip-banner" data-testid={`tip-banner-${slug}`}>
      <div className="tip-banner-header">
        <Zap size={16} className="tip-banner-icon" />
        <p className="tip-banner-texto">{consejo.banner}</p>
        <button
          className="tip-banner-dismiss"
          onClick={descartar}
          aria-label="Descartar consejo"
          data-testid={`tip-banner-dismiss-${slug}`}
        >
          <X size={14} />
        </button>
      </div>

      {consejo.bannerDetalle && expandido && (
        <p className="tip-banner-detalle">{consejo.bannerDetalle}</p>
      )}

      {consejo.bannerDetalle && (
        <button
          className="tip-banner-more"
          onClick={() => setExpandido((v) => !v)}
          data-testid={`tip-banner-more-${slug}`}
        >
          {expandido ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  );
}
