// routes/videos.js — 03 §3.2.2 + transiciones 01 §1.6 + soft delete 03 §3.3.4.
import { Router, raw } from "express";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ApiError, h, notFound } from "../errors.js";
import { jparse } from "../db.js";
import { mergeDeep, nowIso, uuid } from "../util.js";
import { ESTADOS, nuevoVideo, ordenEstado, validarVideo } from "../videoDefaults.js";
import { cfg } from "../config.js";

const DIAS_30 = 30 * 24 * 60 * 60 * 1000;

const rowsToList = (rows) => rows.map(jparse);

function getVideo(db, id) {
  const v = jparse(db.prepare("SELECT data FROM videos WHERE id=?").get(id));
  if (!v) throw notFound("Vídeo", "VIDEO_NOT_FOUND");
  return v;
}

function saveVideo(db, v) {
  db.prepare(
    "INSERT OR REPLACE INTO videos(id,data,estado,createdAt,updatedAt,publishedAt) VALUES(?,?,?,?,?,?)"
  ).run(v.id, JSON.stringify(v), v.estado, v.createdAt, v.updatedAt, v.publishedAt);
}

// publicado → optimizacion automático a los 30 días (02 §2.3.4)
function aplicarTransicionesAuto(db) {
  const limite = new Date(Date.now() - DIAS_30).toISOString();
  const rows = db
    .prepare("SELECT data FROM videos WHERE estado='publicado' AND publishedAt IS NOT NULL AND publishedAt < ?")
    .all(limite);
  for (const row of rows) {
    const v = JSON.parse(row.data);
    v.estado = "optimizacion";
    v.updatedAt = nowIso();
    saveVideo(db, v);
  }
}

function cambiarEstado(db, v, nuevo, { publishedAt } = {}) {
  if (!ESTADOS.includes(nuevo))
    throw new ApiError("INVALID_STATE_TRANSITION", 422, `Estado desconocido: ${nuevo}`);
  if (nuevo === "publicado" && v.estado !== "publicado") {
    v.publishedAt = publishedAt ?? v.publishedAt ?? nowIso();
  }
  if (nuevo === "archivado" && v.estado !== "archivado") v.archivedAt = nowIso();
  if (v.estado === "archivado" && nuevo !== "archivado") v.archivedAt = null;
  v.estado = nuevo;
  v.updatedAt = nowIso();
  saveVideo(db, v);
  return v;
}

const router = Router();

router.get("/", h(async (req, res) => {
  const db = req.app.locals.db;
  aplicarTransicionesAuto(db);
  const { estado, tipo, q } = req.query;
  let videos = rowsToList(db.prepare("SELECT data FROM videos ORDER BY updatedAt DESC").all());
  if (estado) videos = videos.filter((v) => v.estado === estado);
  if (tipo) videos = videos.filter((v) => v.tipo === tipo);
  if (q) {
    const needle = String(q).toLowerCase();
    videos = videos.filter(
      (v) =>
        v.tituloIdea.toLowerCase().includes(needle) ||
        (v.tituloFinal ?? "").toLowerCase().includes(needle)
    );
  }
  res.json(videos);
}));

router.post("/", h(async (req, res) => {
  const db = req.app.locals.db;
  const { tituloIdea, nicho, tipo, formato, descripcionCorta, estado, publishedAt } = req.body ?? {};
  if (!tituloIdea || typeof tituloIdea !== "string" || tituloIdea.length > 200)
    throw new ApiError("VALIDATION_ERROR", 422, "tituloIdea es obligatorio (1-200 chars)", [
      { campo: "tituloIdea", mensaje: "Obligatorio, 1-200 caracteres" },
    ]);
  const v = nuevoVideo({ tituloIdea, nicho, tipo, formato, descripcionCorta });
  saveVideo(db, v);
  // Alta directa como "ya publicado" (02 §2.5)
  if (estado === "publicado") cambiarEstado(db, v, "publicado", { publishedAt });
  res.status(201).json(v);
}));

router.get("/:id", h(async (req, res) => {
  aplicarTransicionesAuto(req.app.locals.db);
  res.json(getVideo(req.app.locals.db, req.params.id));
}));

router.patch("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const current = getVideo(db, req.params.id);
  const patch = structuredClone(req.body ?? {});
  for (const k of ["id", "createdAt", "estado", "checklistEstado"]) delete patch[k]; // estado y checklist tienen endpoints propios
  const updated = mergeDeep(current, patch);
  updated.updatedAt = nowIso();
  const errors = validarVideo(updated);
  if (errors.length) throw new ApiError("VALIDATION_ERROR", 422, "El vídeo no pasa las validaciones", errors);
  saveVideo(db, updated);
  res.json(updated);
}));

router.patch("/:id/estado", h(async (req, res) => {
  const db = req.app.locals.db;
  const v = getVideo(db, req.params.id);
  const { estado, publishedAt } = req.body ?? {};
  res.json(cambiarEstado(db, v, estado, { publishedAt }));
}));

router.patch("/:id/checklist", h(async (req, res) => {
  const db = req.app.locals.db;
  const v = getVideo(db, req.params.id);
  const { stepId, itemKey, valor } = req.body ?? {};
  if (!stepId || !itemKey || typeof valor !== "boolean")
    throw new ApiError("VALIDATION_ERROR", 422, "Se espera { stepId, itemKey, valor:boolean }");
  v.checklistEstado[stepId] = v.checklistEstado[stepId] ?? {};
  v.checklistEstado[stepId][itemKey] = valor;
  v.updatedAt = nowIso();
  saveVideo(db, v);
  res.json(v);
}));

router.post("/:id/duplicar", h(async (req, res) => {
  const db = req.app.locals.db;
  const orig = getVideo(db, req.params.id);
  const copia = {
    ...structuredClone(orig),
    id: uuid(),
    tituloIdea: `Copia de ${orig.tituloIdea}`.slice(0, 200),
    estado: "idea",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    publishedAt: null,
    archivedAt: null,
    checklistEstado: {},
    metricasIds: [],
    difusion: nuevoVideo({ tituloIdea: "x" }).difusion,
  };
  saveVideo(db, copia);
  res.status(201).json(copia);
}));

router.delete("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const v = getVideo(db, req.params.id);
  db.transaction(() => {
    db.prepare("INSERT OR REPLACE INTO deleted_videos(id,data,deletedAt) VALUES(?,?,?)").run(
      v.id,
      JSON.stringify(v),
      nowIso()
    );
    db.prepare("DELETE FROM videos WHERE id=?").run(v.id);
  })();
  res.json({ ok: true, id: v.id });
}));

router.post("/:id/restaurar", h(async (req, res) => {
  const db = req.app.locals.db;
  const row = db.prepare("SELECT data FROM deleted_videos WHERE id=?").get(req.params.id);
  if (!row) throw notFound("Vídeo eliminado", "VIDEO_NOT_FOUND");
  const v = JSON.parse(row.data);
  db.transaction(() => {
    saveVideo(db, v);
    db.prepare("DELETE FROM deleted_videos WHERE id=?").run(v.id);
  })();
  res.json(v);
}));

// Subida de miniatura (02 §2.4.4): body binario imagen, ?alternativa=1 para variantes A/B.
router.post(
  "/:id/miniatura",
  raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "8mb" }),
  h(async (req, res) => {
    const db = req.app.locals.db;
    const v = getVideo(db, req.params.id);
    if (!Buffer.isBuffer(req.body) || req.body.length === 0)
      throw new ApiError("VALIDATION_ERROR", 422, "Envía la imagen como body binario (JPG/PNG/WebP)");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[req.headers["content-type"]];
    mkdirSync(cfg.UPLOADS_DIR, { recursive: true });
    const nombre = `${v.id}-${Date.now()}.${ext}`;
    writeFileSync(resolve(cfg.UPLOADS_DIR, nombre), req.body);
    const url = `/uploads/${nombre}`;
    if (req.query.alternativa === "1") v.miniatura.urlsAlternativas.push(url);
    else v.miniatura.urlPrincipal = url;
    v.updatedAt = nowIso();
    saveVideo(db, v);
    res.status(201).json({ url, video: v });
  })
);

export default router;
