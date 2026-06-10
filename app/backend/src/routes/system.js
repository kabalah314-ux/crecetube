// routes/system.js — health + export/import (03 §3.2.7, 08 §8.8).
import { Router } from "express";
import { ApiError, h } from "../errors.js";
import { jparse } from "../db.js";

const EXPORT_VERSION = 1;

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, app: "CRECETUBE Assistant", version: "1.0.0", ts: new Date().toISOString() });
});

router.get("/export", h(async (req, res) => {
  const db = req.app.locals.db;
  const all = async (sql) => (await db.all(sql)).map(jparse);
  const exportado = {
    app: "crecetube-assistant",
    version: EXPORT_VERSION,
    exportadoEn: new Date().toISOString(),
    perfil: jparse(await db.get("SELECT data FROM profile LIMIT 1")),
    videos: await all("SELECT data FROM videos"),
    videosEliminados: await all("SELECT data FROM deleted_videos"),
    progresoCurso: await all("SELECT data FROM course_progress"),
    plantillasPropias: (await all("SELECT data FROM templates")).filter((t) => !t.esPrecargada),
    snapshots: await all("SELECT data FROM metric_snapshots"),
    interaccionesIA: await all("SELECT data FROM ai_interactions"),
  };
  res
    .set("Content-Disposition", `attachment; filename="crecetube-backup-${exportado.exportadoEn.slice(0, 10)}.json"`)
    .json(exportado);
}));

router.post("/import", h(async (req, res) => {
  const db = req.app.locals.db;
  const { replaceAll = false, data } = req.body ?? {};
  if (!data || typeof data !== "object")
    throw new ApiError("VALIDATION_ERROR", 422, "Se espera { replaceAll, data } con el JSON exportado");
  if (data.version !== EXPORT_VERSION)
    throw new ApiError("IMPORT_VERSION_MISMATCH", 422, `Versión de backup incompatible (esperada ${EXPORT_VERSION}, recibida ${data.version ?? "ninguna"})`);

  const stats = { videos: 0, progresoCurso: 0, plantillasPropias: 0, snapshots: 0, interaccionesIA: 0 };
  const tieneProfile = Boolean(await db.get("SELECT 1 FROM profile LIMIT 1"));
  const stmts = [];

  if (replaceAll) {
    for (const tbl of ["profile", "videos", "deleted_videos", "course_progress", "metric_snapshots", "ai_interactions"]) {
      stmts.push({ sql: `DELETE FROM ${tbl}`, args: [] });
    }
    stmts.push({ sql: "DELETE FROM templates WHERE esPrecargada=0", args: [] });
  }

  if (data.perfil && (replaceAll || !tieneProfile)) {
    stmts.push({ sql: "DELETE FROM profile", args: [] });
    stmts.push({ sql: "INSERT INTO profile(id,data) VALUES(?,?)", args: [data.perfil.id, JSON.stringify(data.perfil)] });
  }

  for (const v of data.videos ?? []) {
    stmts.push({
      sql: "INSERT OR REPLACE INTO videos(id,data,estado,createdAt,updatedAt,publishedAt) VALUES(?,?,?,?,?,?)",
      args: [v.id, JSON.stringify(v), v.estado, v.createdAt, v.updatedAt, v.publishedAt],
    });
    stats.videos++;
  }
  for (const v of data.videosEliminados ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO deleted_videos(id,data,deletedAt) VALUES(?,?,?)", args: [v.id, JSON.stringify(v), new Date().toISOString()] });
  }
  for (const p of data.progresoCurso ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO course_progress(asignaturaId,data) VALUES(?,?)", args: [p.asignaturaId, JSON.stringify(p)] });
    stats.progresoCurso++;
  }
  for (const t of data.plantillasPropias ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO templates(id,data,tipo,esPrecargada) VALUES(?,?,?,0)", args: [t.id, JSON.stringify(t), t.tipo] });
    stats.plantillasPropias++;
  }
  for (const s of data.snapshots ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO metric_snapshots(id,data,videoProjectId,fecha) VALUES(?,?,?,?)", args: [s.id, JSON.stringify(s), s.videoProjectId, s.fecha] });
    stats.snapshots++;
  }
  for (const i of data.interaccionesIA ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO ai_interactions(id,data,videoProjectId,tipo,createdAt) VALUES(?,?,?,?,?)", args: [i.id, JSON.stringify(i), i.videoProjectId, i.tipo, i.createdAt] });
    stats.interaccionesIA++;
  }

  if (stmts.length) await db.batch(stmts);
  res.json({ ok: true, replaceAll, importado: stats });
}));

export default router;
