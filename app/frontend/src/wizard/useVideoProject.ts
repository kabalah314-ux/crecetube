// useVideoProject.ts — carga + autosave debounced 800ms con reintentos (02 §2.3.2).
import { useCallback, useEffect, useRef, useState } from "react";
import { api, isApiError } from "../services/api";
import type { DeepPartial, VideoProject, VideoState } from "../types";

export type SaveState = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;

function isPlain(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function mergeDeepClient<T>(target: T, patch: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (isPlain(v) && isPlain(out[k])) out[k] = mergeDeepClient(out[k], v as never);
    else if (Array.isArray(v)) out[k] = structuredClone(v);
    else out[k] = v;
  }
  return out as T;
}

export function useVideoProject(id: string | undefined) {
  const [video, setVideo] = useState<VideoProject | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const pending = useRef<DeepPartial<VideoProject>>({});
  const timer = useRef<number>();
  const retry = useRef({ intentos: 0, timer: 0 as number });
  const enVuelo = useRef(false);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setErrorCarga(null);
    setVideo(null);
    if (!id) return;
    api
      .get<VideoProject>(`/api/videos/${id}`)
      .then((v) => activo && setVideo(v))
      .catch((e) => activo && setErrorCarga(isApiError(e) ? e.code : "ERROR"))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [id]);

  const flush = useCallback(async () => {
    if (!id || enVuelo.current) return;
    const patch = pending.current;
    if (!Object.keys(patch).length) return;
    pending.current = {};
    enVuelo.current = true;
    setSaveState("saving");
    try {
      const server = await api.patch<VideoProject>(`/api/videos/${id}`, patch);
      enVuelo.current = false;
      retry.current.intentos = 0;
      // Solo adoptar la versión del servidor si no hay teclas nuevas en cola
      if (!Object.keys(pending.current).length) {
        setVideo((local) => (local ? { ...server, estado: local.estado, checklistEstado: local.checklistEstado } : server));
        setSaveState("saved");
        window.setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2000);
      } else {
        void flush();
      }
    } catch (e) {
      enVuelo.current = false;
      // reencolar el patch fallido por debajo de lo nuevo
      pending.current = mergeDeepClient(patch, pending.current) as DeepPartial<VideoProject>;
      if (isApiError(e) && e.status === 422) {
        // validación dura: no reintentar en bucle; avisar y descartar guardado hasta nuevo cambio
        setSaveState("error");
        return;
      }
      setSaveState("error");
      const espera = Math.min(1000 * 2 ** retry.current.intentos, 30000);
      retry.current.intentos++;
      window.clearTimeout(retry.current.timer);
      retry.current.timer = window.setTimeout(() => void flush(), espera);
    }
  }, [id]);

  const patch = useCallback(
    (p: DeepPartial<VideoProject>) => {
      setVideo((v) => (v ? mergeDeepClient(v, p) : v));
      pending.current = mergeDeepClient(pending.current, p) as DeepPartial<VideoProject>;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush]
  );

  // Ctrl/Cmd+S fuerza guardado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        window.clearTimeout(timer.current);
        void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  // flush al desmontar
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(retry.current.timer);
      if (Object.keys(pending.current).length && id) {
        void fetch(`/api/videos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pending.current),
          keepalive: true,
        });
      }
    },
    [id]
  );

  const toggleManual = useCallback(
    async (stepId: string, itemKey: string, valor: boolean) => {
      if (!id) return;
      setVideo((v) =>
        v
          ? {
              ...v,
              checklistEstado: {
                ...v.checklistEstado,
                [stepId]: { ...(v.checklistEstado[stepId] ?? {}), [itemKey]: valor },
              },
            }
          : v
      );
      try {
        await api.patch(`/api/videos/${id}/checklist`, { stepId, itemKey, valor });
      } catch {
        setVideo((v) =>
          v
            ? {
                ...v,
                checklistEstado: {
                  ...v.checklistEstado,
                  [stepId]: { ...(v.checklistEstado[stepId] ?? {}), [itemKey]: !valor },
                },
              }
            : v
        );
      }
    },
    [id]
  );

  const cambiarEstado = useCallback(
    async (estado: VideoState, publishedAt?: string) => {
      if (!id) return null;
      const server = await api.patch<VideoProject>(`/api/videos/${id}/estado`, { estado, publishedAt });
      setVideo((local) => (local ? { ...local, estado: server.estado, publishedAt: server.publishedAt, archivedAt: server.archivedAt } : server));
      return server;
    },
    [id]
  );

  return { video, setVideo, cargando, errorCarga, saveState, patch, flush, toggleManual, cambiarEstado };
}
