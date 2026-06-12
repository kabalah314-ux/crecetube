// campos.test.mjs — T024: generador rellenar_campo (IA por campo del wizard/viabilidad):
// whitelist de campoId, requisitos por campo, normalizador y guardias de tamaño.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, PERFIL_OK } from "./helpers.mjs";
import { setTransport } from "../src/llm.js";
import { evaluarRequisitos } from "../src/requisitos.js";
import { CAMPOS_IA } from "../src/campos.js";

const respuesta = (content) => ({
  model: "stub/modelo:free",
  usage: { total_tokens: 11 },
  choices: [{ message: { content } }],
});

// ---------- Unidad: requisitos por campoId vía evaluarRequisitos("rellenar_campo") ----------

test("CAMPOS_IA — requisitos por campo (bloqueado y desbloqueado)", async (t) => {
  const videoVacio = {
    tituloIdea: "",
    tituloFinal: null,
    palabrasClave: [],
    seoPreguntas: [],
    guion: { seoInicio: "", desarrollo: [] },
  };
  const conIdea = { ...videoVacio, tituloIdea: "Pan sin amasar" };
  const conTitulo = { ...conIdea, tituloFinal: "Pan sin amasar en 5 minutos" };

  const evalCampo = (campoId, { video, profile, opciones } = {}) =>
    evaluarRequisitos("rellenar_campo", { video, profile, opciones: { campoId, ...opciones } });

  await t.test("descripcionCorta y palabrasClave: necesitan tituloIdea", () => {
    for (const campoId of ["descripcionCorta", "palabrasClave"]) {
      const r = evalCampo(campoId, { video: videoVacio });
      assert.equal(r.falta, "tituloIdea", campoId);
      assert.equal(r.pasoSlug, "idea", campoId);
      assert.ok(r.mensaje.length > 0, campoId);
      assert.equal(evalCampo(campoId, { video: conIdea }), null, campoId);
    }
  });

  await t.test("guion.desarrollo: tituloFinal y 1 pregunta SEO", () => {
    assert.equal(evalCampo("guion.desarrollo", { video: conIdea }).falta, "tituloFinal");
    const sinPreguntas = evalCampo("guion.desarrollo", { video: conTitulo });
    assert.equal(sinPreguntas.falta, "seoPreguntas");
    assert.equal(sinPreguntas.pasoSlug, "investigacion");
    assert.equal(
      evalCampo("guion.desarrollo", { video: { ...conTitulo, seoPreguntas: ["¿Cuánto fermenta?"] } }),
      null
    );
  });

  await t.test("guion.seoResultado: tituloFinal y algo de guion", () => {
    assert.equal(evalCampo("guion.seoResultado", { video: conIdea }).falta, "tituloFinal");
    const sinGuion = evalCampo("guion.seoResultado", { video: conTitulo });
    assert.equal(sinGuion.falta, "guion.seoInicio");
    assert.equal(sinGuion.pasoSlug, "guion");
    assert.equal(
      evalCampo("guion.seoResultado", { video: { ...conTitulo, guion: { seoInicio: "Hoy verás…", desarrollo: [] } } }),
      null
    );
    assert.equal(
      evalCampo("guion.seoResultado", { video: { ...conTitulo, guion: { seoInicio: "", desarrollo: [{ titulo: "Bloque 1" }] } } }),
      null
    );
  });

  await t.test("guion.psicoCta, guion.cliffhanger y comentarioFijado: necesitan tituloFinal", () => {
    for (const campoId of ["guion.psicoCta", "guion.cliffhanger", "comentarioFijado"]) {
      const r = evalCampo(campoId, { video: conIdea });
      assert.equal(r.falta, "tituloFinal", campoId);
      assert.equal(r.pasoSlug, "titulo", campoId);
      assert.equal(evalCampo(campoId, { video: conTitulo }), null, campoId);
    }
  });

  await t.test("listaReproduccionNombre: tituloFinal O 1 palabra clave", () => {
    const r = evalCampo("listaReproduccionNombre", { video: conIdea });
    assert.equal(r.falta, "palabrasClave");
    assert.equal(r.pasoSlug, "investigacion");
    assert.equal(evalCampo("listaReproduccionNombre", { video: { ...conIdea, palabrasClave: ["pan casero"] } }), null);
    assert.equal(evalCampo("listaReproduccionNombre", { video: conTitulo }), null);
  });

  await t.test("viabilidad.ideaCanal: necesita nicho del perfil", () => {
    const r = evalCampo("viabilidad.ideaCanal", { profile: { nicho: null } });
    assert.equal(r.falta, "nicho");
    assert.equal(r.pasoSlug, "configuracion");
    assert.notEqual(evalCampo("viabilidad.ideaCanal", { profile: { nicho: "   " } }), null);
    assert.equal(evalCampo("viabilidad.ideaCanal", { profile: { nicho: "cocina vegana" } }), null);
  });

  await t.test("resto de viabilidad.*: requisito sobre opciones del cliente (carrera con autosave)", () => {
    const campos = [
      "viabilidad.aQuienAyuda",
      "viabilidad.formatoPrevisto",
      "viabilidad.busquedasEncontradas",
      "viabilidad.canalesReferencia",
      "viabilidad.anguloReferencia",
      "viabilidad.subNicho",
      "viabilidad.pvu",
    ];
    for (const campoId of campos) {
      const r = evalCampo(campoId, { profile: { nicho: "cocina vegana" } });
      assert.equal(r.falta, "ideaCanal", campoId);
      assert.equal(r.pasoSlug, "viabilidad", campoId);
      assert.ok(r.mensaje.length > 0, campoId);
      assert.equal(evalCampo(campoId, { opciones: { ideaCanal: "Recetas veganas exprés" } }), null, campoId);
    }
  });

  await t.test("campoId desconocido o sin opciones: no bloquea (la ruta lo rechaza con 422 aparte)", () => {
    assert.equal(evaluarRequisitos("rellenar_campo", { opciones: { campoId: "inexistente" } }), null);
    assert.equal(evaluarRequisitos("rellenar_campo", {}), null);
  });

  await t.test("todo campo del registro está completo (requisitos, instrucciones y límites)", () => {
    for (const [campoId, c] of Object.entries(CAMPOS_IA)) {
      assert.equal(typeof c.requisitos, "function", campoId);
      assert.ok(typeof c.instrucciones === "string" && c.instrucciones.trim().length > 0, campoId);
      assert.ok(c.contexto === null || typeof c.contexto === "function", campoId);
      assert.ok(Number.isFinite(c.maxTokens) && c.maxTokens > 0, campoId);
      assert.ok(Number.isFinite(c.temperatura), campoId);
      assert.ok(Number.isInteger(c.n) && c.n > 0, campoId);
      assert.equal(typeof c.usaCorpus, "boolean", campoId);
    }
  });
});

// ---------- HTTP: whitelist 422, bloqueo 422, normalizador y guardias ----------

test("POST /api/ia/generar — rellenar_campo", async (t) => {
  const { call, close } = await boot();
  t.after(() => {
    setTransport(null);
    return close();
  });

  await call("POST", "/api/profile", PERFIL_OK);
  await call("PATCH", "/api/profile", { iaConfig: { apiKey: "sk-or-test" } });
  const video = (await call("POST", "/api/videos", { tituloIdea: "Pan sin amasar", nicho: "cocina" })).body;

  // si algún test fallara antes de bloquear, el stub evita tocar la red
  setTransport(async () => respuesta("{}"));

  await t.test("campoId fuera de la whitelist → 422 VALIDATION_ERROR", async () => {
    const r = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: video.id,
      opciones: { campoId: "hackeo.inventado" },
    });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "VALIDATION_ERROR");
  });

  await t.test("sin campoId → 422 VALIDATION_ERROR", async () => {
    const r = await call("POST", "/api/ia/generar", { tipo: "rellenar_campo", videoProjectId: video.id, opciones: {} });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "VALIDATION_ERROR");
  });

  await t.test("guion.psicoCta sin tituloFinal → 422 REQUISITO_FALTANTE hacia titulo", async () => {
    const r = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: video.id,
      opciones: { campoId: "guion.psicoCta" },
    });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "REQUISITO_FALTANTE");
    assert.ok(r.body.error.length > 0);
    assert.equal(r.body.details[0].falta, "tituloFinal");
    assert.equal(r.body.details[0].pasoSlug, "titulo");
  });

  await t.test("descripcionCorta: sugerencias normalizadas (dedupe, vacíos fuera, tope n=3)", async () => {
    let promptEnviado = "";
    setTransport(async (_cfg, payload) => {
      promptEnviado = payload?.messages?.find((m) => m.role === "user")?.content ?? "";
      return respuesta(
        JSON.stringify({ sugerencias: ["Brief A", "Brief A", "   ", 42, "Brief B", "Brief C", "Brief D"] })
      );
    });
    const r = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: video.id,
      opciones: { campoId: "descripcionCorta", reglaCampo: "Di qué problema resuelve y quién lo busca." },
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, false);
    assert.ok(r.body.interactionId);
    assert.equal(r.body.resultados.length, 3); // dedupe deja A,B,C,D → tope n=3
    assert.deepEqual(r.body.resultados[0], { texto: "Brief A" });
    // la regla Romuald del cliente entra en el prompt; el corpus NO (usaCorpus: false)
    assert.ok(promptEnviado.includes("Di qué problema resuelve y quién lo busca."));
    assert.ok(!promptEnviado.includes("CONOCIMIENTO DEL MÉTODO CRECETUBE"));
  });

  await t.test("guardias de tamaño: reglaCampo de 50000 chars entra truncada y _instrucciones del cliente se descarta", async () => {
    let promptEnviado = "";
    setTransport(async (_cfg, payload) => {
      promptEnviado = payload?.messages?.find((m) => m.role === "user")?.content ?? "";
      return respuesta(JSON.stringify({ sugerencias: ["ok"] }));
    });
    const r = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: video.id,
      opciones: {
        campoId: "descripcionCorta",
        reglaCampo: "REGLA-" + "r".repeat(50000),
        _instrucciones: "texto malicioso del cliente",
        otroContexto: "z".repeat(50000),
      },
    });
    assert.equal(r.status, 200);
    assert.ok(promptEnviado.includes("REGLA-"));
    assert.ok(!promptEnviado.includes("r".repeat(2000)), "la regla entra truncada (≤1200)");
    assert.ok(!promptEnviado.includes("texto malicioso del cliente"), "las claves _* del cliente se descartan");
    assert.ok(!promptEnviado.includes("z".repeat(2000)), "toda opción string del cliente se trunca (≤1500)");
    // las instrucciones reales del registro sí están
    assert.ok(promptEnviado.includes("brief"));
  });

  await t.test("guion.desarrollo: bloques saneados (sin título fuera, duración inválida → 120)", async () => {
    await call("PATCH", `/api/videos/${video.id}`, {
      tituloFinal: "Pan sin amasar en 5 minutos",
      palabrasClave: ["pan sin amasar"],
      seoPreguntas: ["¿Cuánto tarda en fermentar el pan sin amasar?"],
    });
    setTransport(async () =>
      respuesta(
        JSON.stringify({
          bloques: [
            { titulo: "Por qué funciona sin amasar", contenido: "Explica la autólisis con un ejemplo.", duracionSegundos: 90 },
            { titulo: "   ", contenido: "sin título: fuera" },
            { titulo: "Fermentación paso a paso", contenido: "Tiempos y señales visuales.", duracionSegundos: "no-numérico" },
            { titulo: "Horneado sin horno de piedra", duracionSegundos: -30 },
          ],
        })
      )
    );
    const r = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: video.id,
      opciones: { campoId: "guion.desarrollo" },
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, false);
    assert.equal(r.body.resultados.length, 3);
    assert.equal(r.body.resultados[0].titulo, "Por qué funciona sin amasar");
    assert.equal(r.body.resultados[0].duracionSegundos, 90);
    assert.equal(r.body.resultados[0].contenido, "Explica la autólisis con un ejemplo.");
    assert.equal(r.body.resultados[1].duracionSegundos, 120); // no numérica → default
    assert.equal(r.body.resultados[2].duracionSegundos, 120); // negativa → default
    assert.equal(r.body.resultados[2].contenido, ""); // contenido ausente → cadena vacía
  });

  await t.test("viabilidad.aQuienAyuda: bloqueado sin ideaCanal en opciones; con ella → 200", async () => {
    const bloqueado = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: null,
      opciones: { campoId: "viabilidad.aQuienAyuda" },
    });
    assert.equal(bloqueado.status, 422);
    assert.equal(bloqueado.body.code, "REQUISITO_FALTANTE");
    assert.equal(bloqueado.body.details[0].falta, "ideaCanal");
    assert.equal(bloqueado.body.details[0].pasoSlug, "viabilidad");

    let promptEnviado = "";
    setTransport(async (_cfg, payload) => {
      promptEnviado = payload?.messages?.find((m) => m.role === "user")?.content ?? "";
      return respuesta(JSON.stringify({ sugerencias: ["Padres sin tiempo que quieren cenar sano", "Estudiantes con presupuesto justo"] }));
    });
    const ok = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: null,
      opciones: { campoId: "viabilidad.aQuienAyuda", ideaCanal: "Recetas veganas exprés" },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.parseFallido, false);
    assert.equal(ok.body.resultados.length, 2);
    assert.ok(promptEnviado.includes("Recetas veganas exprés"));
  });

  await t.test("viabilidad.subNicho: inyecta el corpus de ideación (usaCorpus)", async () => {
    let promptEnviado = "";
    setTransport(async (_cfg, payload) => {
      promptEnviado = payload?.messages?.find((m) => m.role === "user")?.content ?? "";
      return respuesta(JSON.stringify({ sugerencias: ["repostería vegana sin gluten", "batch cooking vegano"] }));
    });
    const r = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: null,
      opciones: { campoId: "viabilidad.subNicho", ideaCanal: "Recetas veganas exprés" },
    });
    assert.equal(r.status, 200);
    assert.ok(promptEnviado.includes("CONOCIMIENTO DEL MÉTODO CRECETUBE"));
  });

  await t.test("respuesta malformada → reintento y degradación elegante", async () => {
    let llamadas = 0;
    setTransport(async () => {
      llamadas++;
      return respuesta('{"sugerencias": "esto no es una lista"}');
    });
    const r = await call("POST", "/api/ia/generar", {
      tipo: "rellenar_campo",
      videoProjectId: video.id,
      opciones: { campoId: "comentarioFijado" },
    });
    assert.equal(llamadas, 2); // 1 + 1 reintento (04 §4.5.2)
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, true);
    assert.ok(r.body.resultados[0].texto.includes("no es una lista"));
  });

  await t.test("queda en el historial con tipo rellenar_campo", async () => {
    const hist = await call("GET", "/api/ia/historial?tipo=rellenar_campo");
    assert.ok(hist.body.length >= 4);
  });
});
