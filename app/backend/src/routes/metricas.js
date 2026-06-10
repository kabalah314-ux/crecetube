// routes/metricas.js — 03 §3.2.5 + insights heurísticos locales (08 §8.7, sin IA).
import { Router } from "express";
import { ApiError, h, notFound } from "../errors.js";
import { jparse } from "../db.js";
import { nowIso, uuid } from "../util.js";

const router = Router();

const snapsDe = (db, videoId) =>
  db.prepare("SELECT data FROM metric_snapshots WHERE videoProjectId=? ORDER BY fecha").all(videoId).map(jparse);

const ultimoSnapPorVideo = (db) => {
  const todos = db.prepare("SELECT data FROM metric_snapshots ORDER BY fecha").all().map(jparse);
  const ultimo = new Map();
  for (const s of todos) ultimo.set(s.videoProjectId, s); // ordenados asc → queda el último
  return ultimo;
};

function validarSnapshot(body) {
  const errors = [];
  if (!body.videoProjectId) errors.push({ campo: "videoProjectId", mensaje: "Obligatorio" });
  if (!body.fecha || !/^\d{4}-\d{2}-\d{2}/.test(body.fecha)) errors.push({ campo: "fecha", mensaje: "Fecha YYYY-MM-DD" });
  const ctr = Number(body.ctr ?? 0);
  if (ctr < 0 || ctr > 100) errors.push({ campo: "ctr", mensaje: "Debe ser 0-100" });
  const ret = Number(body.retencionMediaPct ?? 0);
  if (ret < 0 || ret > 100) errors.push({ campo: "retencionMediaPct", mensaje: "Debe ser 0-100" });
  return errors;
}

router.get("/resumen", h(async (req, res) => {
  const db = req.app.locals.db;
  const ultimos = [...ultimoSnapPorVideo(db).values()];
  const n = ultimos.length;
  const suma = (f) => ultimos.reduce((a, s) => a + (Number(f(s)) || 0), 0);
  res.json({
    videosConMetricas: n,
    vistasTotales: suma((s) => s.vistas),
    ctrMedio: n ? Number((suma((s) => s.ctr) / n).toFixed(2)) : 0,
    retencionMedia: n ? Number((suma((s) => s.retencionMediaPct) / n).toFixed(2)) : 0,
    suscriptoresGanados: suma((s) => s.suscriptoresGanados),
    ingresosEstimados: Number(suma((s) => s.ingresosEstimados ?? 0).toFixed(2)),
  });
}));

router.get("/insights", h(async (req, res) => {
  const db = req.app.locals.db;
  const ultimos = ultimoSnapPorVideo(db);
  const videos = new Map(
    db.prepare("SELECT data FROM videos").all().map(jparse).map((v) => [v.id, v])
  );
  const insights = [];
  let mejorCtr = null;
  let peorRet = null;
  for (const [vid, s] of ultimos) {
    if (!mejorCtr || s.ctr > mejorCtr.s.ctr) mejorCtr = { vid, s };
    if (!peorRet || s.retencionMediaPct < peorRet.s.retencionMediaPct) peorRet = { vid, s };
  }
  const nombre = (vid) => videos.get(vid)?.tituloFinal ?? videos.get(vid)?.tituloIdea ?? "un vídeo";
  if (mejorCtr && ultimos.size >= 2)
    insights.push({
      tipo: "positivo",
      texto: `Tu mejor CTR es ${mejorCtr.s.ctr}% en “${nombre(mejorCtr.vid)}”: analiza su miniatura y título y replica el patrón (s5, s6).`,
    });
  if (peorRet && peorRet.s.retencionMediaPct > 0 && peorRet.s.retencionMediaPct < 35)
    insights.push({
      tipo: "alerta",
      texto: `“${nombre(peorRet.vid)}” retiene solo el ${peorRet.s.retencionMediaPct}%: revisa el gancho de los primeros 15s y añade roturas de patrón (s9).`,
    });
  for (const [vid, s] of ultimos) {
    const serie = snapsDe(db, vid);
    if (serie.length >= 2) {
      const v0 = serie[0].velocidadVisualizacion;
      const v1 = serie.at(-1).velocidadVisualizacion;
      if (v0 > 0 && v1 > v0 * 1.5)
        insights.push({ tipo: "positivo", texto: `“${nombre(vid)}” está acelerando (${v0}→${v1} vistas/día): candidato a optimización evergreen (s3_a5).` });
    }
  }
  if (!insights.length)
    insights.push({ tipo: "info", texto: "Registra snapshots de al menos 2 vídeos para empezar a ver comparativas e insights." });
  res.json(insights);
}));

router.get("/video/:videoId", h(async (req, res) => {
  res.json(snapsDe(req.app.locals.db, req.params.videoId));
}));

router.post("/snapshot", h(async (req, res) => {
  const db = req.app.locals.db;
  const body = req.body ?? {};
  const errors = validarSnapshot(body);
  if (errors.length) throw new ApiError("VALIDATION_ERROR", 422, "Snapshot inválido", errors);

  const video = jparse(db.prepare("SELECT data FROM videos WHERE id=?").get(body.videoProjectId));
  if (!video) throw notFound("Vídeo", "VIDEO_NOT_FOUND");

  const fecha = body.fecha.slice(0, 10);
  // días de calendario (no instantes): publicado el día X, snapshot el día X+n → n
  const dias =
    body.diasDesdePublicacion ??
    (video.publishedAt
      ? Math.max(0, Math.round((new Date(fecha) - new Date(video.publishedAt.slice(0, 10))) / 86400000))
      : 0);

  const snap = {
    id: uuid(),
    videoProjectId: video.id,
    fecha,
    diasDesdePublicacion: dias,
    vistas: Number(body.vistas ?? 0),
    impresiones: Number(body.impresiones ?? 0),
    ctr: Number(body.ctr ?? 0),
    retencionMediaPct: Number(body.retencionMediaPct ?? 0),
    duracionMediaSeg: Number(body.duracionMediaSeg ?? 0),
    velocidadVisualizacion: Number((Number(body.vistas ?? 0) / Math.max(dias, 1)).toFixed(2)),
    suscriptoresGanados: Number(body.suscriptoresGanados ?? 0),
    comentarios: Number(body.comentarios ?? 0),
    likes: Number(body.likes ?? 0),
    ingresosEstimados: body.ingresosEstimados == null ? null : Number(body.ingresosEstimados),
    rpm: body.rpm == null ? null : Number(body.rpm),
    notas: body.notas ?? "",
  };

  try {
    db.prepare("INSERT INTO metric_snapshots(id,data,videoProjectId,fecha) VALUES(?,?,?,?)").run(
      snap.id, JSON.stringify(snap), snap.videoProjectId, snap.fecha
    );
  } catch (e) {
    if (String(e.message).includes("UNIQUE"))
      throw new ApiError("DUPLICATE_SNAPSHOT", 409, `Ya hay un snapshot de ese vídeo con fecha ${fecha}`);
    throw e;
  }

  video.metricasIds.push(snap.id);
  video.updatedAt = nowIso();
  db.prepare("UPDATE videos SET data=?, updatedAt=? WHERE id=?").run(JSON.stringify(video), video.updatedAt, video.id);

  res.status(201).json(snap);
}));

router.patch("/snapshot/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const snap = jparse(db.prepare("SELECT data FROM metric_snapshots WHERE id=?").get(req.params.id));
  if (!snap) throw notFound("Snapshot", "SNAPSHOT_NOT_FOUND");
  const campos = ["vistas", "impresiones", "ctr", "retencionMediaPct", "duracionMediaSeg", "suscriptoresGanados", "comentarios", "likes", "ingresosEstimados", "rpm", "notas", "diasDesdePublicacion"];
  for (const k of campos) if (req.body?.[k] !== undefined) snap[k] = req.body[k];
  if (snap.ctr < 0 || snap.ctr > 100) throw new ApiError("VALIDATION_ERROR", 422, "ctr debe ser 0-100");
  snap.velocidadVisualizacion = Number((snap.vistas / Math.max(snap.diasDesdePublicacion, 1)).toFixed(2));
  db.prepare("UPDATE metric_snapshots SET data=? WHERE id=?").run(JSON.stringify(snap), snap.id);
  res.json(snap);
}));

router.delete("/snapshot/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const r = db.prepare("DELETE FROM metric_snapshots WHERE id=?").run(req.params.id);
  if (!r.changes) throw notFound("Snapshot", "SNAPSHOT_NOT_FOUND");
  res.json({ ok: true });
}));

export default router;
