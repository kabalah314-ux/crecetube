// routes/curso.js — 03 §3.2.3. Estructura desde seed en BD + progreso upsert.
import { Router } from "express";
import { ApiError, h } from "../errors.js";
import { getCourseStructure, jparse } from "../db.js";
import { nowIso, uuid } from "../util.js";

const router = Router();

router.get("/estructura", h(async (req, res) => {
  res.json(getCourseStructure(req.app.locals.db));
}));

router.get("/progreso", h(async (req, res) => {
  const rows = req.app.locals.db.prepare("SELECT data FROM course_progress").all();
  res.json(rows.map(jparse));
}));

router.patch("/progreso/:asignaturaId", h(async (req, res) => {
  const db = req.app.locals.db;
  const { asignaturaId } = req.params;

  const estructura = getCourseStructure(db);
  const seccion = estructura.secciones.find((s) => s.asignaturas.some((a) => a.id === asignaturaId));
  if (!seccion) throw new ApiError("VALIDATION_ERROR", 422, `Asignatura desconocida: ${asignaturaId}`);

  const actual = jparse(db.prepare("SELECT data FROM course_progress WHERE asignaturaId=?").get(asignaturaId)) ?? {
    id: uuid(),
    asignaturaId,
    seccionId: seccion.id,
    completado: false,
    notaPersonal: "",
    fechaCompletado: null,
    vinculadoAVideoIds: [],
  };

  const { completado, notaPersonal, vinculadoAVideoIds } = req.body ?? {};
  if (typeof completado === "boolean") {
    actual.completado = completado;
    actual.fechaCompletado = completado ? nowIso() : null;
  }
  if (typeof notaPersonal === "string") {
    if (notaPersonal.length > 1000) throw new ApiError("VALIDATION_ERROR", 422, "Nota personal: máximo 1000 caracteres");
    actual.notaPersonal = notaPersonal;
  }
  if (Array.isArray(vinculadoAVideoIds)) actual.vinculadoAVideoIds = vinculadoAVideoIds;

  db.prepare("INSERT OR REPLACE INTO course_progress(asignaturaId,data) VALUES(?,?)").run(
    asignaturaId,
    JSON.stringify(actual)
  );
  res.json(actual);
}));

export default router;
