import type { VideoState } from "../types";

export const ESTADOS_ORDEN: VideoState[] = [
  "idea",
  "investigacion",
  "guion",
  "grabacion",
  "edicion",
  "publicado",
  "optimizacion",
  "archivado",
];

export const COLOR_ESTADO: Record<VideoState, string> = {
  idea: "var(--state-idea)",
  investigacion: "var(--state-investigacion)",
  guion: "var(--state-guion)",
  grabacion: "var(--state-grabacion)",
  edicion: "var(--state-edicion)",
  publicado: "var(--state-publicado)",
  optimizacion: "var(--state-optimizacion)",
  archivado: "var(--state-archivado)",
};
