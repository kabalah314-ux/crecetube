// routes/viabilidad.js — estudio de viabilidad singleton POR USUARIO (T018, escopado por req.userId).
import { Router } from "express";
import { h } from "../errors.js";
import { jparse } from "../db.js";
import { nowIso } from "../util.js";

const router = Router();

const ID = "main";

// GET /api/viabilidad — devuelve el estudio o null si no existe
router.get("/", h(async (req, res) => {
  const row = await req.app.locals.db.get("SELECT data FROM viabilidad WHERE userId=? AND id=?", [req.userId, ID]);
  res.json(jparse(row));
}));

// PATCH /api/viabilidad — upsert con merge de campos
router.patch("/", h(async (req, res) => {
  const db = req.app.locals.db;
  const existing = jparse(await db.get("SELECT data FROM viabilidad WHERE userId=? AND id=?", [req.userId, ID]));
  const now = nowIso();

  const actualizado = {
    ...(existing ?? { id: ID, createdAt: now }),
    ...(req.body ?? {}),
    id: ID,
    updatedAt: now,
  };

  await db.run(
    "INSERT OR REPLACE INTO viabilidad(id, userId, data, completado, createdAt, updatedAt) VALUES(?,?,?,?,?,?)",
    [
      ID,
      req.userId,
      JSON.stringify(actualizado),
      actualizado.completado ? 1 : 0,
      actualizado.createdAt,
      actualizado.updatedAt,
    ]
  );

  res.json(actualizado);
}));

export default router;
