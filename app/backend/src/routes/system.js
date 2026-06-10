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
  const all = (sql) => db.prepare(sql).all().map(jparse);
  const exportado = {
    app: "crecetube-assistant",
    version: EXPORT_VERSION,
    exportadoEn: new Date().toISOString(),
    perfil: jparse(db.prepare("SELECT data FROM profile LIMIT 1").get()),
    videos: all("SELECT data FROM videos"),
    videosEliminados: all("SELECT data FROM deleted_videos"),
    progresoCurso: all("SELECT data FROM course_progress"),
    plantillasPropias: all("SELECT data FROM templates").filter((t) => !t.esPrecargada),
    snapshots: all("SELECT data FROM metric_snapshots"),
    interaccionesIA: all("SELECT data FROM ai_interactions"),
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

  db.transaction(() => {
    if (replaceAll) {
      db.prepare("DELETE FROM profile").run();
      db.prepare("DELETE FROM videos").run();
      db.prepare("DELETE FROM deleted_videos").run();
      db.prepare("DELETE FROM course_progress").run();
      db.prepare("DELETE FROM templates WHERE esPrecargada=0").run();
      db.prepare("DELETE FROM metric_snapshots").run();
      db.prepare("DELETE FROM ai_interactions").run();
    }

    if (data.perfil) {
      if (replaceAll || !db.prepare("SELECT 1 FROM profile LIMIT 1").get()) {
        db.prepare("DELETE FROM profile").run();
        db.prepare("INSERT INTO profile(id,data) VALUES(?,?)").run(data.perfil.id, JSON.stringify(data.perfil));
      }
    }

    const upVideo = db.prepare("INSERT OR REPLACE INTO videos(id,data,estado,createdAt,updatedAt,publishedAt) VALUES(?,?,?,?,?,?)");
    for (const v of data.videos ?? []) {
      upVideo.run(v.id, JSON.stringify(v), v.estado, v.createdAt, v.updatedAt, v.publishedAt);
      stats.videos++;
    }
    const upDel = db.prepare("INSERT OR REPLACE INTO deleted_videos(id,data,deletedAt) VALUES(?,?,?)");
    for (const v of data.videosEliminados ?? []) upDel.run(v.id, JSON.stringify(v), new Date().toISOString());

    const upProg = db.prepare("INSERT OR REPLACE INTO course_progress(asignaturaId,data) VALUES(?,?)");
    for (const p of data.progresoCurso ?? []) {
      upProg.run(p.asignaturaId, JSON.stringify(p));
      stats.progresoCurso++;
    }

    const upTpl = db.prepare("INSERT OR REPLACE INTO templates(id,data,tipo,esPrecargada) VALUES(?,?,?,0)");
    for (const t of data.plantillasPropias ?? []) {
      upTpl.run(t.id, JSON.stringify(t), t.tipo);
      stats.plantillasPropias++;
    }

    const upSnap = db.prepare("INSERT OR REPLACE INTO metric_snapshots(id,data,videoProjectId,fecha) VALUES(?,?,?,?)");
    for (const s of data.snapshots ?? []) {
      upSnap.run(s.id, JSON.stringify(s), s.videoProjectId, s.fecha);
      stats.snapshots++;
    }

    const upIa = db.prepare("INSERT OR REPLACE INTO ai_interactions(id,data,videoProjectId,tipo,createdAt) VALUES(?,?,?,?,?)");
    for (const i of data.interaccionesIA ?? []) {
      upIa.run(i.id, JSON.stringify(i), i.videoProjectId, i.tipo, i.createdAt);
      stats.interaccionesIA++;
    }
  })();

  res.json({ ok: true, replaceAll, importado: stats });
}));

export default router;
