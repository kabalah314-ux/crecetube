// routes/canales.js — CRUD de canales del usuario (T017).
// El canal por defecto y los canales con vídeos no se pueden eliminar (422).
import { Router } from "express";
import { ApiError, h, notFound } from "../errors.js";
import { ensureDefaultChannel } from "../db.js";
import { nowIso, uuid } from "../util.js";

const pub = (row) => ({
  id: row.id,
  nombre: row.nombre,
  esPorDefecto: Boolean(row.esPorDefecto),
  createdAt: row.createdAt,
});

async function getCanal(db, userId, id) {
  const row = await db.get("SELECT id,userId,nombre,esPorDefecto,createdAt FROM channels WHERE id=? AND userId=?", [id, userId]);
  if (!row) throw notFound("Canal", "CHANNEL_NOT_FOUND");
  return row;
}

function validarNombre(nombre) {
  if (typeof nombre !== "string" || !nombre.trim() || nombre.length > 80)
    throw new ApiError("VALIDATION_ERROR", 422, "nombre es obligatorio (1-80 chars)", [
      { campo: "nombre", mensaje: "Obligatorio, 1-80 caracteres" },
    ]);
  return nombre.trim();
}

const router = Router();

router.get("/", h(async (req, res) => {
  const db = req.app.locals.db;
  await ensureDefaultChannel(db, req.userId);
  const rows = await db.all(
    "SELECT id,nombre,esPorDefecto,createdAt FROM channels WHERE userId=? ORDER BY esPorDefecto DESC, createdAt",
    [req.userId]
  );
  res.json(rows.map(pub));
}));

router.post("/", h(async (req, res) => {
  const db = req.app.locals.db;
  const nombre = validarNombre(req.body?.nombre);
  const esPrimero = !(await db.get("SELECT 1 FROM channels WHERE userId=? LIMIT 1", [req.userId]));
  const canal = { id: uuid(), userId: req.userId, nombre, esPorDefecto: esPrimero ? 1 : 0, createdAt: nowIso() };
  await db.run("INSERT INTO channels(id,userId,nombre,esPorDefecto,createdAt) VALUES(?,?,?,?,?)", [
    canal.id, canal.userId, canal.nombre, canal.esPorDefecto, canal.createdAt,
  ]);
  res.status(201).json(pub(canal));
}));

router.patch("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const canal = await getCanal(db, req.userId, req.params.id);
  if (req.body?.nombre !== undefined) canal.nombre = validarNombre(req.body.nombre);
  // Marcar como por defecto desmarca el resto (no se permite quedarse sin canal por defecto).
  if (req.body?.esPorDefecto === true && !canal.esPorDefecto) {
    await db.run("UPDATE channels SET esPorDefecto=0 WHERE userId=?", [req.userId]);
    canal.esPorDefecto = 1;
  }
  await db.run("UPDATE channels SET nombre=?, esPorDefecto=? WHERE id=?", [canal.nombre, canal.esPorDefecto, canal.id]);
  res.json(pub(canal));
}));

router.delete("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const canal = await getCanal(db, req.userId, req.params.id);
  if (canal.esPorDefecto)
    throw new ApiError("CHANNEL_NOT_DELETABLE", 422, "El canal por defecto no se puede eliminar");
  const conVideos = await db.get("SELECT 1 FROM videos WHERE userId=? AND canalId=? LIMIT 1", [req.userId, canal.id]);
  if (conVideos)
    throw new ApiError("CHANNEL_NOT_DELETABLE", 422, "El canal tiene vídeos: muévelos o elimínalos antes");
  await db.run("DELETE FROM channels WHERE id=?", [canal.id]);
  res.json({ ok: true, id: canal.id });
}));

export default router;
