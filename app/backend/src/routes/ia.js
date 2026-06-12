// routes/ia.js — 04 completo: test-conexion, generar (con fallback 4.5.2) e historial.
import { Router } from "express";
import { ApiError, h, notFound } from "../errors.js";
import { jparse } from "../db.js";
import { nowIso, uuid } from "../util.js";
import { chat, resolveIaConfig, testConexion } from "../llm.js";
import { getProfileRow } from "./profile.js";
import { GENERADORES, SYSTEM_BASE, construirContexto, extraerJson } from "../prompts.js";
import { evaluarRequisitos } from "../requisitos.js";
import { CAMPOS_IA } from "../campos.js";

const esFree = (modelo) => modelo === "openrouter/free" || modelo?.endsWith(":free");

const router = Router();

router.post("/test-conexion", h(async (req, res) => {
  const profile = await getProfileRow(req.app.locals.db, req.userId);
  const override = req.body?.iaConfig;
  const iaCfg = resolveIaConfig(override ? { iaConfig: { ...profile?.iaConfig, ...override } } : profile);
  res.json(await testConexion(iaCfg));
}));

router.post("/generar", h(async (req, res) => {
  const db = req.app.locals.db;
  const { tipo, videoProjectId, opciones = {} } = req.body ?? {};
  const gen = GENERADORES[tipo];
  if (!gen) throw new ApiError("VALIDATION_ERROR", 422, `Generador desconocido: ${tipo}`);

  const profile = await getProfileRow(db, req.userId);
  const iaCfg = resolveIaConfig(profile);

  const video = videoProjectId
    ? jparse(await db.get("SELECT data FROM videos WHERE id=? AND userId=?", [videoProjectId, req.userId]))
    : null;

  // T024 — rellenar_campo: whitelist del campoId (anti prompt-injection), guardias de
  // tamaño sobre TODO string del cliente e inyección de instrucciones/contexto desde
  // el registro CAMPOS_IA. Va ANTES de evaluarRequisitos: los requisitos del campo se
  // evalúan vía la entrada rellenar_campo de requisitos.js (con opciones ya truncadas).
  let campoIA = null;
  if (tipo === "rellenar_campo") {
    campoIA = CAMPOS_IA[opciones?.campoId];
    if (!campoIA) throw new ApiError("VALIDATION_ERROR", 422, `Campo desconocido: ${opciones?.campoId}`);
    for (const k of Object.keys(opciones)) {
      // Las claves internas (_*) las pone el servidor: lo que mande el cliente se descarta.
      if (k.startsWith("_")) delete opciones[k];
      else if (typeof opciones[k] === "string") opciones[k] = opciones[k].slice(0, k === "reglaCampo" ? 1200 : 1500);
    }
    opciones._instrucciones = campoIA.instrucciones;
    const lineas = campoIA.contexto ? campoIA.contexto(video, profile, opciones) : null;
    opciones._contexto = Array.isArray(lineas) && lineas.length ? lineas.join("\n") : null;
    opciones._usaCorpus = campoIA.usaCorpus === true;
    opciones._n = campoIA.n;
  }

  // T022 — cadena del método: bloqueo duro si la etapa previa no está hecha.
  const requisito = evaluarRequisitos(tipo, { video, profile, opciones });
  if (requisito)
    throw new ApiError("REQUISITO_FALTANTE", 422, requisito.mensaje, [
      { falta: requisito.falta, pasoSlug: requisito.pasoSlug },
    ]);

  // contexto extra para analisis_retencion: snapshots serializados (04 §4.6.9)
  if (tipo === "analisis_retencion" && video) {
    const snaps = (await db.all("SELECT data FROM metric_snapshots WHERE userId=? AND videoProjectId=? ORDER BY fecha", [req.userId, video.id]))
      .map(jparse)
      .map((s) => `${s.fecha} (día ${s.diasDesdePublicacion}): vistas ${s.vistas}, CTR ${s.ctr}%, retención ${s.retencionMediaPct}%, dur.media ${s.duracionMediaSeg}s`)
      .join("\n");
    opciones.snapshotsSerializados = snaps || "(ninguno)";
  }

  // contexto extra para temas_canal (T019): perfil + títulos de TODOS los vídeos del usuario
  // (todos sus canales) para que la IA no repita temas ya hechos.
  if (tipo === "temas_canal") {
    const vids = (await db.all("SELECT data FROM videos WHERE userId=? AND estado != 'archivado'", [req.userId])).map(jparse);
    opciones.titulosExistentes = vids.map((v) => v?.tituloFinal ?? v?.tituloIdea).filter(Boolean);
    opciones.canalNombre = profile?.canalNombre ?? null;
    opciones.nicho = profile?.nicho ?? null;
    opciones.tieneCanalYa = profile?.tieneCanalYa ?? null;
  }

  // guardia de tamaño para romu_aprueba (T020): datosEtapa y reglas llegan del frontend;
  // se serializan y recortan aquí (misma filosofía maxChars que corpus.js).
  if (tipo === "romu_aprueba") {
    const MAX_EVAL_CHARS = 6000;
    const datos = opciones.datosEtapa && typeof opciones.datosEtapa === "object" ? opciones.datosEtapa : null;
    opciones.datosEtapa = datos ? JSON.stringify(datos, null, 1).slice(0, MAX_EVAL_CHARS) : null;
    const reglas = Array.isArray(opciones.reglas)
      ? opciones.reglas.filter((r) => typeof r === "string" && r.trim())
      : [];
    opciones.reglas = reglas.length
      ? reglas.map((r) => `- ${r.trim()}`).join("\n").slice(0, MAX_EVAL_CHARS)
      : null;
    opciones.etapaNombre = typeof opciones.etapaNombre === "string" ? opciones.etapaNombre.slice(0, 80) : null;
    opciones.etapaProposito = typeof opciones.etapaProposito === "string" ? opciones.etapaProposito.slice(0, 300) : null;
    opciones.nicho = profile?.nicho ?? null;
  }

  const ctx = construirContexto(profile, video);
  const userBase = `${ctx}\n\n${gen.user(opciones)}`;

  const pedir = (recordatorio) =>
    chat(iaCfg, {
      system: SYSTEM_BASE,
      user: recordatorio ? `${userBase}\nRECUERDA: responde SOLO el JSON, sin ningún texto adicional.` : userBase,
      // T024: los límites del campo (CAMPOS_IA) mandan sobre los del generador genérico.
      temperature: campoIA?.temperatura ?? gen.temperatura,
      maxTokens: campoIA?.maxTokens ?? gen.maxTokens,
    });

  // 4.5.2: extracción → 1 reintento → degradación elegante
  // (el segundo argumento solo lo usa rellenar_campo; el resto de normalizadores lo ignora)
  let r = await pedir(false);
  let parsed = extraerJson(r.content);
  let resultados = parsed ? gen.normalizar(parsed, opciones) : null;
  if (!resultados) {
    r = await pedir(true);
    parsed = extraerJson(r.content);
    resultados = parsed ? gen.normalizar(parsed, opciones) : null;
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
  await db.run("INSERT INTO ai_interactions(id,data,videoProjectId,tipo,createdAt,userId) VALUES(?,?,?,?,?,?)", [
    interaction.id,
    JSON.stringify(interaction),
    interaction.videoProjectId,
    tipo,
    interaction.createdAt,
    req.userId,
  ]);

  res.json({ interactionId: interaction.id, resultados, parseFallido });
}));

router.get("/historial", h(async (req, res) => {
  const db = req.app.locals.db;
  const { videoProjectId, tipo, limit = 20 } = req.query;
  let rows = (await db.all("SELECT data FROM ai_interactions WHERE userId=? ORDER BY createdAt DESC", [req.userId])).map(jparse);
  if (videoProjectId) rows = rows.filter((x) => x.videoProjectId === videoProjectId);
  if (tipo) rows = rows.filter((x) => x.tipo === tipo);
  res.json(rows.slice(0, Number(limit)));
}));

router.patch("/historial/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const row = jparse(await db.get("SELECT data FROM ai_interactions WHERE id=? AND userId=?", [req.params.id, req.userId]));
  if (!row) throw notFound("Interacción", "VALIDATION_ERROR");
  if (typeof req.body?.seleccionUsuario === "string") row.seleccionUsuario = req.body.seleccionUsuario;
  await db.run("UPDATE ai_interactions SET data=? WHERE id=?", [JSON.stringify(row), row.id]);
  res.json(row);
}));

export default router;
