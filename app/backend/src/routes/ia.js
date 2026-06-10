// routes/ia.js — 04 completo: test-conexion, generar (con fallback 4.5.2) e historial.
import { Router } from "express";
import { ApiError, h, notFound } from "../errors.js";
import { jparse } from "../db.js";
import { nowIso, uuid } from "../util.js";
import { chat, resolveIaConfig, testConexion } from "../llm.js";
import { getProfileRow } from "./profile.js";
import { GENERADORES, SYSTEM_BASE, construirContexto, extraerJson } from "../prompts.js";

const esFree = (modelo) => modelo === "openrouter/free" || modelo?.endsWith(":free");

const router = Router();

router.post("/test-conexion", h(async (req, res) => {
  const profile = getProfileRow(req.app.locals.db);
  const override = req.body?.iaConfig;
  const iaCfg = resolveIaConfig(override ? { iaConfig: { ...profile?.iaConfig, ...override } } : profile);
  res.json(await testConexion(iaCfg));
}));

router.post("/generar", h(async (req, res) => {
  const db = req.app.locals.db;
  const { tipo, videoProjectId, opciones = {} } = req.body ?? {};
  const gen = GENERADORES[tipo];
  if (!gen) throw new ApiError("VALIDATION_ERROR", 422, `Generador desconocido: ${tipo}`);

  const profile = getProfileRow(db);
  const iaCfg = resolveIaConfig(profile);

  const video = videoProjectId
    ? jparse(db.prepare("SELECT data FROM videos WHERE id=?").get(videoProjectId))
    : null;

  // contexto extra para analisis_retencion: snapshots serializados (04 §4.6.9)
  if (tipo === "analisis_retencion" && video) {
    const snaps = db
      .prepare("SELECT data FROM metric_snapshots WHERE videoProjectId=? ORDER BY fecha")
      .all(video.id)
      .map(jparse)
      .map((s) => `${s.fecha} (día ${s.diasDesdePublicacion}): vistas ${s.vistas}, CTR ${s.ctr}%, retención ${s.retencionMediaPct}%, dur.media ${s.duracionMediaSeg}s`)
      .join("\n");
    opciones.snapshotsSerializados = snaps || "(ninguno)";
  }

  const ctx = construirContexto(profile, video);
  const userBase = `${ctx}\n\n${gen.user(opciones)}`;

  const pedir = (recordatorio) =>
    chat(iaCfg, {
      system: SYSTEM_BASE,
      user: recordatorio ? `${userBase}\nRECUERDA: responde SOLO el JSON, sin ningún texto adicional.` : userBase,
      temperature: gen.temperatura,
      maxTokens: gen.maxTokens,
    });

  // 4.5.2: extracción → 1 reintento → degradación elegante
  let r = await pedir(false);
  let parsed = extraerJson(r.content);
  let resultados = parsed ? gen.normalizar(parsed) : null;
  if (!resultados) {
    r = await pedir(true);
    parsed = extraerJson(r.content);
    resultados = parsed ? gen.normalizar(parsed) : null;
  }
  const parseFallido = !resultados;
  if (parseFallido) resultados = [{ texto: r.content }];

  const interaction = {
    id: uuid(),
    videoProjectId: video?.id ?? null,
    tipo,
    prompt: userBase,
    respuesta: r.content,
    respuestaParseada: parseFallido ? null : parsed,
    seleccionUsuario: null,
    modeloUsado: r.modeloUsado,
    tokensUsados: r.tokensUsados,
    costoEstimado: esFree(r.modeloUsado) || esFree(iaCfg.modelo) ? 0 : null,
    createdAt: nowIso(),
  };
  db.prepare("INSERT INTO ai_interactions(id,data,videoProjectId,tipo,createdAt) VALUES(?,?,?,?,?)").run(
    interaction.id,
    JSON.stringify(interaction),
    interaction.videoProjectId,
    tipo,
    interaction.createdAt
  );

  res.json({ interactionId: interaction.id, resultados, parseFallido });
}));

router.get("/historial", h(async (req, res) => {
  const db = req.app.locals.db;
  const { videoProjectId, tipo, limit = 20 } = req.query;
  let rows = db.prepare("SELECT data FROM ai_interactions ORDER BY createdAt DESC").all().map(jparse);
  if (videoProjectId) rows = rows.filter((x) => x.videoProjectId === videoProjectId);
  if (tipo) rows = rows.filter((x) => x.tipo === tipo);
  res.json(rows.slice(0, Number(limit)));
}));

router.patch("/historial/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const row = jparse(db.prepare("SELECT data FROM ai_interactions WHERE id=?").get(req.params.id));
  if (!row) throw notFound("Interacción", "VALIDATION_ERROR");
  if (typeof req.body?.seleccionUsuario === "string") row.seleccionUsuario = req.body.seleccionUsuario;
  db.prepare("UPDATE ai_interactions SET data=? WHERE id=?").run(JSON.stringify(row), row.id);
  res.json(row);
}));

export default router;
