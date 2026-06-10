import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, PERFIL_OK } from "./helpers.mjs";
import { setTransport } from "../src/llm.js";

const respuesta = (content) => ({
  model: "stub/modelo:free",
  usage: { total_tokens: 42 },
  choices: [{ message: { content } }],
});

test("módulo IA con transporte stub + métricas", async (t) => {
  const { call, close } = await boot();
  t.after(() => {
    setTransport(null);
    return close();
  });

  await call("POST", "/api/profile", PERFIL_OK);
  const video = (await call("POST", "/api/videos", { tituloIdea: "Audio pro sin micro caro", nicho: "tech" })).body;

  await t.test("generar sin clave → 503 AI_NOT_CONFIGURED", async () => {
    const r = await call("POST", "/api/ia/generar", { tipo: "titulo", videoProjectId: video.id });
    assert.equal(r.status, 503);
    assert.equal(r.body.code, "AI_NOT_CONFIGURED");
  });

  await call("PATCH", "/api/profile", { iaConfig: { apiKey: "sk-or-test" } });

  await t.test("titulo: JSON válido → 9 resultados normalizados", async () => {
    setTransport(async () =>
      respuesta(
        JSON.stringify({
          titulos: Array.from({ length: 9 }, (_, i) => ({ texto: `Título número ${i + 1}`, angulo: "beneficio" })),
        })
      )
    );
    const r = await call("POST", "/api/ia/generar", { tipo: "titulo", videoProjectId: video.id });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, false);
    assert.equal(r.body.resultados.length, 9);
    assert.ok(r.body.interactionId);
  });

  await t.test("JSON envuelto en fences y texto → extracción robusta", async () => {
    setTransport(async () => respuesta('Claro, aquí tienes:\n```json\n{"preguntas":["¿uno?","¿dos?","¿tres?"]}\n```\n¡Espero que sirva!'));
    const r = await call("POST", "/api/ia/generar", { tipo: "seo_preguntas", videoProjectId: video.id });
    assert.equal(r.body.parseFallido, false);
    assert.equal(r.body.resultados.length, 3);
  });

  await t.test("no-JSON persistente → reintento y degradación elegante", async () => {
    let llamadas = 0;
    setTransport(async () => {
      llamadas++;
      return respuesta("Lo siento, no puedo dar formato JSON hoy.");
    });
    const r = await call("POST", "/api/ia/generar", { tipo: "hook", videoProjectId: video.id });
    assert.equal(llamadas, 2); // 1 + 1 reintento (04 §4.5.2)
    assert.equal(r.body.parseFallido, true);
    assert.ok(r.body.resultados[0].texto.includes("no puedo"));
  });

  await t.test("hashtags inválidos se corrigen a null", async () => {
    setTransport(async () => respuesta(JSON.stringify({ amplio: "#cocina", medio: "con espacios mal", especifico: "#lasañavegana", titulo: "#cocina" })));
    const r = await call("POST", "/api/ia/generar", { tipo: "hashtags", videoProjectId: video.id });
    assert.equal(r.body.resultados[0].amplio, "#cocina");
    assert.equal(r.body.resultados[0].medio, null);
  });

  await t.test("historial registra y permite marcar selección", async () => {
    const hist = await call("GET", `/api/ia/historial?videoProjectId=${video.id}`);
    assert.ok(hist.body.length >= 4);
    assert.equal(hist.body[0].modeloUsado, "stub/modelo:free");
    assert.equal(hist.body[0].costoEstimado, 0);
    const sel = await call("PATCH", `/api/ia/historial/${hist.body[0].id}`, { seleccionUsuario: "Título número 1" });
    assert.equal(sel.body.seleccionUsuario, "Título número 1");
  });

  await t.test("snapshots: alta, unicidad 409 y velocidad calculada", async () => {
    await call("PATCH", `/api/videos/${video.id}/estado`, { estado: "publicado", publishedAt: "2026-06-01T10:00:00Z" });
    const s1 = await call("POST", "/api/metricas/snapshot", {
      videoProjectId: video.id,
      fecha: "2026-06-05",
      vistas: 400,
      ctr: 5.2,
      retencionMediaPct: 41,
    });
    assert.equal(s1.status, 201);
    assert.equal(s1.body.diasDesdePublicacion, 4);
    assert.equal(s1.body.velocidadVisualizacion, 100);
    const dup = await call("POST", "/api/metricas/snapshot", { videoProjectId: video.id, fecha: "2026-06-05", vistas: 1, ctr: 1, retencionMediaPct: 1 });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, "DUPLICATE_SNAPSHOT");
    const malCtr = await call("POST", "/api/metricas/snapshot", { videoProjectId: video.id, fecha: "2026-06-06", ctr: 150 });
    assert.equal(malCtr.status, 422);
  });

  await t.test("resumen e insights responden", async () => {
    const r = await call("GET", "/api/metricas/resumen");
    assert.equal(r.body.videosConMetricas, 1);
    assert.equal(r.body.vistasTotales, 400);
    const ins = await call("GET", "/api/metricas/insights");
    assert.ok(Array.isArray(ins.body) && ins.body.length >= 1);
  });

  await t.test("el vídeo guarda la referencia metricasIds", async () => {
    const v = await call("GET", `/api/videos/${video.id}`);
    assert.equal(v.body.metricasIds.length, 1);
  });
});
