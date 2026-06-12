// routes/profile.js — 03 §3.2.1. Perfil singleton POR USUARIO (escopado por req.userId).
import { Router } from "express";
import { ApiError, h } from "../errors.js";
import { jparse } from "../db.js";
import { mergeDeep, nowIso, uuid, assert422 } from "../util.js";
import { cfg } from "../config.js";

const NIVELES = ["principiante", "intermedio", "avanzado"];
const FRECUENCIAS = ["diaria", "2x_semana", "semanal", "quincenal", "mensual"];
const OBJETIVOS = ["suscriptores", "monetizacion", "influencia", "ventas", "diversion"];

export const getProfileRow = async (db, userId) =>
  jparse(await db.get("SELECT data FROM profile WHERE userId=?", [userId]));

export const maskProfile = (p) => ({
  ...p,
  iaConfig: { ...p.iaConfig, apiKey: p.iaConfig?.apiKey ? "***" : "" },
});

function validate(body, errors) {
  assert422(typeof body.canalNombre === "string" && body.canalNombre.trim().length >= 1 && body.canalNombre.length <= 80, "canalNombre", "Obligatorio, 1-80 caracteres", errors);
  assert422(typeof body.nicho === "string" && body.nicho.trim().length >= 1 && body.nicho.length <= 60, "nicho", "Obligatorio, 1-60 caracteres", errors);
  assert422(NIVELES.includes(body.nivel), "nivel", `Debe ser uno de: ${NIVELES.join(", ")}`, errors);
  assert422(FRECUENCIAS.includes(body.frecuenciaObjetivo), "frecuenciaObjetivo", `Debe ser uno de: ${FRECUENCIAS.join(", ")}`, errors);
  assert422(OBJETIVOS.includes(body.objetivoPrincipal), "objetivoPrincipal", `Debe ser uno de: ${OBJETIVOS.join(", ")}`, errors);
  assert422(body.gestionMulticanal === undefined || typeof body.gestionMulticanal === "boolean", "gestionMulticanal", "Debe ser booleano", errors);
}

const router = Router();

router.get("/", h(async (req, res) => {
  const p = await getProfileRow(req.app.locals.db, req.userId);
  if (!p) throw new ApiError("PROFILE_NOT_FOUND", 404, "No hay perfil aún");
  res.json(maskProfile(p));
}));

router.get("/ia-status", h(async (req, res) => {
  const p = await getProfileRow(req.app.locals.db, req.userId);
  const ia = p?.iaConfig ?? {};
  res.json({ configured: Boolean(ia.apiKey || cfg.LLM_API_KEY), provider: ia.proveedor || cfg.LLM_PROVIDER });
}));

router.post("/", h(async (req, res) => {
  const db = req.app.locals.db;
  if (await getProfileRow(db, req.userId)) throw new ApiError("PROFILE_ALREADY_EXISTS", 409, "El perfil ya existe");
  const errors = [];
  validate(req.body ?? {}, errors);
  if (errors.length) throw new ApiError("VALIDATION_ERROR", 422, "Datos de perfil inválidos", errors);

  const now = nowIso();
  const profile = mergeDeep(
    {
      id: uuid(),
      canalNombre: "",
      canalUrl: null,
      nicho: "",
      nivel: "principiante",
      frecuenciaObjetivo: "semanal",
      objetivoPrincipal: "suscriptores",
      idioma: "es",
      tieneCanalYa: false,
      gestionMulticanal: false,
      preferenciasUi: { tema: "dark", densidad: "comoda", sonidos: false },
      iaConfig: {
        proveedor: cfg.LLM_PROVIDER,
        modelo: cfg.LLM_MODEL,
        apiKey: cfg.LLM_API_KEY,
        baseUrl: cfg.LLM_BASE_URL,
        temperatura: 0.7,
      },
      createdAt: now,
      updatedAt: now,
    },
    req.body
  );
  profile.createdAt = now;
  profile.updatedAt = now;
  await db.run("INSERT INTO profile(id,userId,data) VALUES(?,?,?)", [profile.id, req.userId, JSON.stringify(profile)]);
  res.status(201).json(maskProfile(profile));
}));

router.patch("/", h(async (req, res) => {
  const db = req.app.locals.db;
  const current = await getProfileRow(db, req.userId);
  if (!current) throw new ApiError("PROFILE_NOT_FOUND", 404, "No hay perfil aún");

  const patch = structuredClone(req.body ?? {});
  delete patch.id;
  delete patch.createdAt;
  // "***" significa "no tocar la clave guardada" (03 §3.1.1)
  if (patch.iaConfig && patch.iaConfig.apiKey === "***") delete patch.iaConfig.apiKey;

  const updated = mergeDeep(current, patch);
  updated.updatedAt = nowIso();

  const errors = [];
  validate(updated, errors);
  if (errors.length) throw new ApiError("VALIDATION_ERROR", 422, "Datos de perfil inválidos", errors);

  await db.run("UPDATE profile SET data=? WHERE userId=?", [JSON.stringify(updated), req.userId]);
  res.json(maskProfile(updated));
}));

export default router;
