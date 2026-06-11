// Filtro de visibilidad del curso: oculta asignaturas sin contenido y
// secciones que queden vacías. No toca datos: cuando una asignatura se
// rellene en el seed, reaparece sola. Los totales se recalculan sobre
// lo visible para que contadores y porcentajes sean coherentes.
import type { CourseSeccion, CourseStructure } from "../types";

export function filtrarCursoVisible(curso: CourseStructure): CourseStructure {
  const secciones: CourseSeccion[] = curso.secciones
    .map((s) => ({ ...s, asignaturas: s.asignaturas.filter((a) => a.contenido !== "") }))
    .filter((s) => s.asignaturas.length > 0);
  return {
    ...curso,
    secciones,
    totalSecciones: secciones.length,
    totalAsignaturas: secciones.reduce((n, s) => n + s.asignaturas.length, 0),
  };
}
