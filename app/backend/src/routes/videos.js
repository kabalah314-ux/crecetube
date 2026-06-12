// routes/videos.js — 03 §3.2.2 + transiciones 01 §1.6 + soft delete 03 §3.3.4.
// Las miniaturas se guardan como data-URL dentro del VideoProject (sin filesystem, apto serverless).
import { Router } from "express";
import { ApiError, h, notFound } from "../errors.js";
import { ensureDefaultChannel, jparse } from "../db.js";
import { mergeDeep, nowIso, uuid } from "../util.js";
import { ESTADOS, nuevoVideo, validarVideo } from "../videoDefaults.js";

const DIAS_30 = 30 * 24 * 60 * 60 * 1000;

async function getVideo(db, userId, id) {
  const v = jparse(await db.get("SELECT data FROM videos WHERE id=? AND userId=?", [id, userId]));
  if (!v) throw notFound("Vídeo", "VIDEO_NOT_FOUND");
  return v;
}

const saveVideoStmt = (userId, v) => ({
  sql: "INSERT OR REPLACE INTO videos(id,data,estado,createdAt,updatedAt,publishedAt,userId,canalId) VALUES(?,?,?,?,?,?,?,?)",
  args: [v.id, JSON.stringify(v), v.estado, v.createdAt, v.updatedAt, v.publishedAt, userId, v.canalId ?? null],
});

async function saveVideo(db, userId, v) {
  const { sql, args } = saveVideoStmt(userId, v);
  await db.run(sql, args);
}

// Valida que el canal pertenece al usuario (422 si no).
async function validarCanal(db, userId, canalId) {
  const canal = await db.get("SELECT id FROM channels WHERE id=? AND userId=?", [canalId, userId]);
  if (!canal)
    throw new ApiError("VALIDATION_ERROR", 422, "canalId desconocido", [
      { campo: "canalId", mensaje: "No existe ese canal" },
    ]);
  return canal;
}

// publicado → optimizacion automático a los 30 días (02 §2.3.4)
async function aplicarTransicionesAuto(db, userId) {
  const limite = new Date(Date.now() - DIAS_30).toISOString();
  const rows = await db.all(
    "SELECT data FROM videos WHERE userId=? AND estado='publicado' AND publishedAt IS NOT NULL AND publishedAt < ?",
    [userId, limite]
  );
  for (const row of rows) {
    const v = JSON.parse(row.data);
    v.estado = "optimizacion";
    v.updatedAt = nowIso();
    await saveVideo(db, userId, v);
  }
}

async function cambiarEstado(db, userId, v, nuevo, { publishedAt } = {}) {
  if (!ESTADOS.includes(nuevo))
    throw new ApiError("INVALID_STATE_TRANSITION", 422, `Estado desconocido: ${nuevo}`);
  if (nuevo === "publicado" && v.estado !== "publicado") {
    v.publishedAt = publishedAt ?? v.publishedAt ?? nowIso();
  }
  if (nuevo === "archivado" && v.estado !== "archivado") v.archivedAt = nowIso();
  if (v.estado === "archivado" && nuevo !== "archivado") v.archivedAt = null;
  v.estado = nuevo;
  v.updatedAt = nowIso();
  await saveVideo(db, userId, v);
  return v;
}

const router = Router();

router.get("/", h(async (req, res) => {
  const db = req.app.locals.db;
  await aplicarTransicionesAuto(db, req.userId);
  const { estado, tipo, q, canalId } = req.query;
  let sql = "SELECT data FROM videos WHERE userId=?";
  const args = [req.userId];
  if (canalId) {
    sql += " AND canalId=?";
    args.push(String(canalId));
  }
  let videos = (await db.all(`${sql} ORDER BY updatedAt DESC`, args)).map(jparse);
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
  const { tituloIdea, nicho, tipo, formato, descripcionCorta, estado, publishedAt, canalId } = req.body ?? {};
  if (!tituloIdea || typeof tituloIdea !== "string" || tituloIdea.length > 200)
    throw new ApiError("VALIDATION_ERROR", 422, "tituloIdea es obligatorio (1-200 chars)", [
      { campo: "tituloIdea", mensaje: "Obligatorio, 1-200 caracteres" },
    ]);
  const canal = canalId ? await validarCanal(db, req.userId, canalId) : await ensureDefaultChannel(db, req.userId);
  const v = nuevoVideo({ tituloIdea, nicho, tipo, formato, descripcionCorta });
  v.canalId = canal.id;
  await saveVideo(db, req.userId, v);
  // Alta directa como "ya publicado" (02 §2.5)
  if (estado === "publicado") await cambiarEstado(db, req.userId, v, "publicado", { publishedAt });
  res.status(201).json(v);
}));

router.get("/:id", h(async (req, res) => {
  await aplicarTransicionesAuto(req.app.locals.db, req.userId);
  res.json(await getVideo(req.app.locals.db, req.userId, req.params.id));
}));

router.patch("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const current = await getVideo(db, req.userId, req.params.id);
  const patch = structuredClone(req.body ?? {});
  for (const k of ["id", "createdAt", "estado", "checklistEstado"]) delete patch[k]; // estado y checklist tienen endpoints propios
  // mover de canal: solo a un canal propio
  if (patch.canalId !== undefined && patch.canalId !== current.canalId) await validarCanal(db, req.userId, patch.canalId);
  const updated = mergeDeep(current, patch);
  updated.updatedAt = nowIso();
  const errors = validarVideo(updated);
  if (errors.length) throw new ApiError("VALIDATION_ERROR", 422, "El vídeo no pasa las validaciones", errors);
  await saveVideo(db, req.userId, updated);
  res.json(updated);
}));

router.patch("/:id/estado", h(async (req, res) => {
  const db = req.app.locals.db;
  const v = await getVideo(db, req.userId, req.params.id);
  const { estado, publishedAt } = req.body ?? {};
  res.json(await cambiarEstado(db, req.userId, v, estado, { publishedAt }));
}));

router.patch("/:id/checklist", h(async (req, res) => {
  const db = req.app.locals.db;
  const v = await getVideo(db, req.userId, req.params.id);
  const { stepId, itemKey, valor } = req.body ?? {};
  if (!stepId || !itemKey || typeof valor !== "boolean")
    throw new ApiError("VALIDATION_ERROR", 422, "Se espera { stepId, itemKey, valor:boolean }");
  v.checklistEstado[stepId] = v.checklistEstado[stepId] ?? {};
  v.checklistEstado[stepId][itemKey] = valor;
  v.updatedAt = nowIso();
  await saveVideo(db, req.userId, v);
  res.json(v);
}));

router.post("/:id/duplicar", h(async (req, res) => {
  const db = req.app.locals.db;
  const orig = await getVideo(db, req.userId, req.params.id);
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
  await saveVideo(db, req.userId, copia);
  res.status(201).json(copia);
}));

router.delete("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const v = await getVideo(db, req.userId, req.params.id);
  await db.batch([
    { sql: "INSERT OR REPLACE INTO deleted_videos(id,data,deletedAt,userId) VALUES(?,?,?,?)", args: [v.id, JSON.stringify(v), nowIso(), req.userId] },
    { sql: "DELETE FROM videos WHERE id=?", args: [v.id] },
  ]);
  res.json({ ok: true, id: v.id });
}));

router.post("/:id/restaurar", h(async (req, res) => {
  const db = req.app.locals.db;
  const row = await db.get("SELECT data FROM deleted_videos WHERE id=? AND userId=?", [req.params.id, req.userId]);
  if (!row) throw notFound("Vídeo eliminado", "VIDEO_NOT_FOUND");
  const v = JSON.parse(row.data);
  await db.batch([saveVideoStmt(req.userId, v), { sql: "DELETE FROM deleted_videos WHERE id=?", args: [v.id] }]);
  res.json(v);
}));

export default router;
