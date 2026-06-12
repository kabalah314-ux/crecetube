// routes/system.js — health + export/import (03 §3.2.7, 08 §8.8). Escopado por req.userId.
import { Router } from "express";
import { ApiError, h } from "../errors.js";
import { adoptVideosSinCanal, jparse } from "../db.js";

const EXPORT_VERSION = 1;

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, app: "CRECETUBE Assistant", version: "1.0.0", ts: new Date().toISOString() });
});

router.get("/export", h(async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  const all = async (sql, args = []) => (await db.all(sql, args)).map(jparse);
  const exportado = {
    app: "crecetube-assistant",
    version: EXPORT_VERSION,
    exportadoEn: new Date().toISOString(),
    perfil: jparse(await db.get("SELECT data FROM profile WHERE userId=?", [userId])),
    canales: (
      await db.all("SELECT id,nombre,esPorDefecto,createdAt FROM channels WHERE userId=? ORDER BY esPorDefecto DESC, createdAt", [userId])
    ).map((c) => ({ id: c.id, nombre: c.nombre, esPorDefecto: Boolean(c.esPorDefecto), createdAt: c.createdAt })),
    videos: await all("SELECT data FROM videos WHERE userId=?", [userId]),
    videosEliminados: await all("SELECT data FROM deleted_videos WHERE userId=?", [userId]),
    progresoCurso: await all("SELECT data FROM course_progress WHERE userId=?", [userId]),
    plantillasPropias: await all("SELECT data FROM templates WHERE esPrecargada=0 AND userId=?", [userId]),
    snapshots: await all("SELECT data FROM metric_snapshots WHERE userId=?", [userId]),
    interaccionesIA: await all("SELECT data FROM ai_interactions WHERE userId=?", [userId]),
  };
  res
    .set("Content-Disposition", `attachment; filename="crecetube-backup-${exportado.exportadoEn.slice(0, 10)}.json"`)
    .json(exportado);
}));

router.post("/import", h(async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.userId;
  const { replaceAll = false, data } = req.body ?? {};
  if (!data || typeof data !== "object")
    throw new ApiError("VALIDATION_ERROR", 422, "Se espera { replaceAll, data } con el JSON exportado");
  if (data.version !== EXPORT_VERSION)
    throw new ApiError("IMPORT_VERSION_MISMATCH", 422, `Versión de backup incompatible (esperada ${EXPORT_VERSION}, recibida ${data.version ?? "ninguna"})`);

  const stats = { videos: 0, progresoCurso: 0, plantillasPropias: 0, snapshots: 0, interaccionesIA: 0, canales: 0 };
  const tieneProfile = Boolean(await db.get("SELECT 1 FROM profile WHERE userId=?", [userId]));
  const stmts = [];

  if (replaceAll) {
    for (const tbl of ["profile", "videos", "deleted_videos", "course_progress", "metric_snapshots", "ai_interactions", "channels"]) {
      stmts.push({ sql: `DELETE FROM ${tbl} WHERE userId=?`, args: [userId] });
    }
    stmts.push({ sql: "DELETE FROM templates WHERE esPrecargada=0 AND userId=?", args: [userId] });
  }

  if (data.perfil && (replaceAll || !tieneProfile)) {
    stmts.push({ sql: "DELETE FROM profile WHERE userId=?", args: [userId] });
    stmts.push({ sql: "INSERT INTO profile(id,userId,data) VALUES(?,?,?)", args: [data.perfil.id, userId, JSON.stringify(data.perfil)] });
  }

  for (const c of data.canales ?? []) {
    stmts.push({
      sql: "INSERT OR REPLACE INTO channels(id,userId,nombre,esPorDefecto,createdAt) VALUES(?,?,?,?,?)",
      args: [c.id, userId, c.nombre, c.esPorDefecto ? 1 : 0, c.createdAt ?? new Date().toISOString()],
    });
    stats.canales++;
  }

  for (const v of data.videos ?? []) {
    stmts.push({
      sql: "INSERT OR REPLACE INTO videos(id,data,estado,createdAt,updatedAt,publishedAt,userId,canalId) VALUES(?,?,?,?,?,?,?,?)",
      args: [v.id, JSON.stringify(v), v.estado, v.createdAt, v.updatedAt, v.publishedAt, userId, v.canalId ?? null],
    });
    stats.videos++;
  }
  for (const v of data.videosEliminados ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO deleted_videos(id,data,deletedAt,userId) VALUES(?,?,?,?)", args: [v.id, JSON.stringify(v), new Date().toISOString(), userId] });
  }
  for (const p of data.progresoCurso ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO course_progress(userId,asignaturaId,data) VALUES(?,?,?)", args: [userId, p.asignaturaId, JSON.stringify(p)] });
    stats.progresoCurso++;
  }
  for (const t of data.plantillasPropias ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO templates(id,data,tipo,esPrecargada,userId) VALUES(?,?,?,0,?)", args: [t.id, JSON.stringify(t), t.tipo, userId] });
    stats.plantillasPropias++;
  }
  for (const s of data.snapshots ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO metric_snapshots(id,data,videoProjectId,fecha,userId) VALUES(?,?,?,?,?)", args: [s.id, JSON.stringify(s), s.videoProjectId, s.fecha, userId] });
    stats.snapshots++;
  }
  for (const i of data.interaccionesIA ?? []) {
    stmts.push({ sql: "INSERT OR REPLACE INTO ai_interactions(id,data,videoProjectId,tipo,createdAt,userId) VALUES(?,?,?,?,?,?)", args: [i.id, JSON.stringify(i), i.videoProjectId, i.tipo, i.createdAt, userId] });
    stats.interaccionesIA++;
  }

  if (stmts.length) await db.batch(stmts);
  // Backups antiguos sin canales: asegura canal por defecto y que los vídeos sin canal lo adopten.
  await adoptVideosSinCanal(db, userId);
  res.json({ ok: true, replaceAll, importado: stats });
}));

export default router;
