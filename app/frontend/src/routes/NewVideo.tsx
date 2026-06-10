// /videos/nuevo — creación perezosa (02 §2.4.1): el POST se dispara al primer
// cambio válido del título y se continúa en el wizard con autosave normal.
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { es } from "../i18n/es";
import { api, isApiError } from "../services/api";
import { useStore } from "../store/useStore";
import type { VideoProject } from "../types";

export function NewVideo() {
  const [titulo, setTitulo] = useState("");
  const creando = useRef(false);
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const toast = useStore((s) => s.toast);

  const crear = async (valor: string) => {
    if (creando.current || !valor.trim()) return;
    creando.current = true;
    try {
      const v = await api.post<VideoProject>("/api/videos", {
        tituloIdea: valor.trim(),
        nicho: profile?.nicho ?? "",
      });
      navigate(`/videos/${v.id}/wizard/idea`, { replace: true });
    } catch (e) {
      creando.current = false;
      toast("error", isApiError(e) ? e.message : "No se pudo crear el proyecto");
    }
  };

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <h1>Nuevo vídeo</h1>
      </div>
      <div className="field">
        <label className="label" htmlFor="nv-titulo">
          ¿Sobre qué va tu próximo vídeo?
        </label>
        <input
          id="nv-titulo"
          className="input"
          autoFocus
          data-testid="field-titulo-idea"
          placeholder="Escribe la idea y el proyecto se crea solo…"
          value={titulo}
          maxLength={200}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => crear(titulo)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void crear(titulo);
            }
          }}
        />
        <p className="field-hint">Pulsa Enter (o sal del campo) y seguimos en el wizard. {es.common.guardando.replace("…", "")} automático a partir de ahí.</p>
      </div>
      <Link to="/videos" className="field-hint">
        ← Volver a vídeos
      </Link>
    </div>
  );
}
