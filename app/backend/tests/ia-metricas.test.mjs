import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, PERFIL_OK } from "./helpers.mjs";
import { setTransport } from "../src/llm.js";
import { extraerCorpusIdeacion } from "../src/corpus.js";
import cursoSeed from "../../guia_maestra/07_curso_seed.json" with { type: "json" };

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

  await t.test("temas_canal: 5 temas normalizados sin videoProjectId", async () => {
    let promptEnviado = "";
    setTransport(async (_cfg, payload) => {
      promptEnviado = payload?.messages?.find((m) => m.role === "user")?.content ?? "";
      return respuesta(
        JSON.stringify({
          temas: Array.from({ length: 5 }, (_, i) => ({
            titulo: `Tema sugerido ${i + 1}`,
            angulo: "ángulo de prueba",
            porQueFunciona: "encaja con el nicho",
            formato: i === 0 ? "short" : "formato-inventado",
            dificultad: i === 1 ? "alta" : "imposible",
          })),
        })
      );
    });
    const r = await call("POST", "/api/ia/generar", { tipo: "temas_canal" });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, false);
    assert.equal(r.body.resultados.length, 5);
    assert.equal(r.body.resultados[0].formato, "short");
    assert.equal(r.body.resultados[1].formato, "video"); // formato inválido → default
    assert.equal(r.body.resultados[1].dificultad, "alta");
    assert.equal(r.body.resultados[0].dificultad, "media"); // dificultad inválida → default
    // el prompt incluye el título del vídeo existente para no repetir temas
    assert.ok(promptEnviado.includes("Audio pro sin micro caro"));
    // y queda en historial sin vídeo asociado
    const hist = await call("GET", "/api/ia/historial?tipo=temas_canal");
    assert.equal(hist.body.length, 1);
    assert.equal(hist.body[0].videoProjectId, null);
  });

  await t.test("temas_canal: respuesta malformada → degradación elegante", async () => {
    setTransport(async () => respuesta('{"temas": "esto no es una lista"}'));
    const r = await call("POST", "/api/ia/generar", { tipo: "temas_canal" });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, true);
    assert.ok(r.body.resultados[0].texto.includes("no es una lista"));
  });

  await t.test("romu_aprueba: veredicto normalizado, máx 6 puntos y guardia de tamaño", async () => {
    let promptEnviado = "";
    setTransport(async (_cfg, payload) => {
      promptEnviado = payload?.messages?.find((m) => m.role === "user")?.content ?? "";
      return respuesta(
        JSON.stringify({
          veredicto: "aprobado",
          puntuacion: 8.6,
          puntos: Array.from({ length: 8 }, (_, i) => ({
            aspecto: `Aspecto ${i + 1}`,
            ok: i % 2 === 0,
            comentario: `comentario ${i + 1}`,
          })),
          resumen: "Esto ya huele a Pescaseo del bueno.",
        })
      );
    });
    const r = await call("POST", "/api/ia/generar", {
      tipo: "romu_aprueba",
      videoProjectId: video.id,
      opciones: {
        etapaNombre: "Título",
        etapaProposito: "Elegir el título final",
        datosEtapa: { tituloFinal: "Audio pro sin gastar un euro", relleno: "x".repeat(20000) },
        reglas: ["El título no supera los 60 caracteres", "y".repeat(20000)],
      },
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, false);
    const v = r.body.resultados[0];
    assert.equal(v.veredicto, "aprobado");
    assert.equal(v.puntuacion, 9); // 8.6 redondeada
    assert.equal(v.puntos.length, 6); // máximo 6 puntos
    assert.equal(v.puntos[1].ok, false);
    assert.ok(v.resumen.includes("Pescaseo"));
    // el prompt lleva los datos y las reglas de la etapa…
    assert.ok(promptEnviado.includes("Audio pro sin gastar un euro"));
    assert.ok(promptEnviado.includes("El título no supera los 60 caracteres"));
    // …pero recortados por la guardia de 6000 caracteres por bloque
    assert.ok(!promptEnviado.includes("x".repeat(7000)));
    assert.ok(!promptEnviado.includes("y".repeat(7000)));
    // y queda en el historial ligado al vídeo actual
    const hist = await call("GET", "/api/ia/historial?tipo=romu_aprueba");
    assert.equal(hist.body.length, 1);
    assert.equal(hist.body[0].videoProjectId, video.id);
  });

  await t.test("romu_aprueba: respuesta malformada → degradación elegante", async () => {
    setTransport(async () => respuesta('{"veredicto":"ni idea","puntos":"sin lista"}'));
    const r = await call("POST", "/api/ia/generar", {
      tipo: "romu_aprueba",
      videoProjectId: video.id,
      opciones: { datosEtapa: { tituloFinal: "x" }, reglas: [] },
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, true);
    assert.ok(r.body.resultados[0].texto.includes("ni idea"));
  });

  await t.test("corpus de ideación: respeta maxChars y solo asignaturas con contenido", () => {
    const corpus = extraerCorpusIdeacion();
    assert.ok(corpus.length > 0);
    assert.ok(corpus.length <= 4000, `corpus de ${corpus.length} chars supera los 4000`);
    assert.ok(extraerCorpusIdeacion(500).length <= 500);
    const seccionesIdeacion = cursoSeed.secciones.filter((s) => ["s3", "s4", "s6"].includes(s.id));
    const sinContenido = seccionesIdeacion.flatMap((s) =>
      s.asignaturas.filter((a) => !(typeof a.contenido === "string" && a.contenido.trim()))
    );
    assert.ok(sinContenido.length > 0, "el seed actual debería tener asignaturas vacías en s3/s4/s6");
    for (const a of sinContenido) {
      assert.ok(!corpus.includes(`### ${a.titulo}`), `asignatura sin contenido en el corpus: ${a.id}`);
    }
    const conContenido = seccionesIdeacion.flatMap((s) =>
      s.asignaturas.filter((a) => typeof a.contenido === "string" && a.contenido.trim())
    );
    assert.ok(conContenido.some((a) => corpus.includes(`### ${a.titulo}`)));
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
