// corpus.js — destila el seed del curso en un extracto compacto para los prompts
// de ideación (T019). El seed se importa estáticamente (mismo patrón que db.js)
// para que el bundler de Vercel lo incluya en la función serverless.
import cursoSeed from "../../guia_maestra/07_curso_seed.json" with { type: "json" };

// Secciones relevantes para idear temas: estrategia (s3), nichos (s4) y títulos (s6).
const SECCIONES_IDEACION = ["s3", "s4", "s6"];
const MIN_CHARS_POR_ASIGNATURA = 100;

// Compacta el contenido de una asignatura: una sola línea, espacios normalizados.
const compactar = (s) => s.replace(/\s+/g, " ").trim();

// Devuelve un extracto del curso (solo asignaturas con contenido) recortado a maxChars.
// El corpus mejora solo cuando el seed crezca: se calcula en cada llamada.
// GUARDIA OBLIGATORIA: jamás devolver más de maxChars (el seed completo puede ser enorme).
export function extraerCorpusIdeacion(maxChars = 4000) {
  const secciones = (cursoSeed.secciones ?? []).filter((s) => SECCIONES_IDEACION.includes(s.id));
  const items = [];
  for (const seccion of secciones) {
    for (const asignatura of seccion.asignaturas ?? []) {
      if (typeof asignatura.contenido === "string" && asignatura.contenido.trim()) {
        items.push({ seccion: seccion.titulo, titulo: asignatura.titulo, contenido: compactar(asignatura.contenido) });
      }
    }
  }
  if (!items.length) return "";

  // Presupuesto por asignatura: reparte maxChars descontando cabeceras y saltos de línea.
  const titulosSeccion = [...new Set(items.map((it) => it.seccion))];
  const overhead =
    titulosSeccion.reduce((acc, t) => acc + `## ${t}`.length + 1, 0) +
    items.reduce((acc, it) => acc + `### ${it.titulo}\n`.length + 1, 0);
  const porAsignatura = Math.max(MIN_CHARS_POR_ASIGNATURA, Math.floor((maxChars - overhead) / items.length));

  const bloques = [];
  let seccionActual = null;
  for (const it of items) {
    if (it.seccion !== seccionActual) {
      seccionActual = it.seccion;
      bloques.push(`## ${it.seccion}`);
    }
    bloques.push(`### ${it.titulo}\n${it.contenido.slice(0, porAsignatura)}`);
  }
  return bloques.join("\n").slice(0, maxChars);
}
