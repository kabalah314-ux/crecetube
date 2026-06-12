// requisitos.test.mjs — T022: cadena del método (bloqueo duro por generador)
// + generador sugerir_nombres_canal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, PERFIL_OK } from "./helpers.mjs";
import { setTransport } from "../src/llm.js";
import { evaluarRequisitos } from "../src/requisitos.js";

const respuesta = (content) => ({
  model: "stub/modelo:free",
  usage: { total_tokens: 7 },
  choices: [{ message: { content } }],
});

// ---------- Unidad: cada generador bloqueado/desbloqueado con fixtures mínimos ----------

test("evaluarRequisitos — bloqueado y desbloqueado por generador", async (t) => {
  const videoVacio = {
    palabrasClave: [],
    seoPreguntas: [],
    tituloFinal: null,
    publishedAt: null,
    guion: { seoInicio: "", desarrollo: [] },
  };
  const conTitulo = { ...videoVacio, tituloFinal: "Audio pro sin micro caro" };
  const perfilConNicho = { nicho: "cocina vegana" };
  const perfilSinNicho = { nicho: null };

  await t.test("seo_preguntas: necesita 1 palabra clave", () => {
    const r = evaluarRequisitos("seo_preguntas", { video: videoVacio });
    assert.equal(r.falta, "palabrasClave");
    assert.equal(r.pasoSlug, "investigacion");
    assert.ok(r.mensaje.length > 0);
    assert.equal(evaluarRequisitos("seo_preguntas", { video: { ...videoVacio, palabrasClave: ["audio"] } }), null);
  });

  await t.test("titulo: necesita 3 palabras clave y 1 pregunta SEO", () => {
    assert.equal(evaluarRequisitos("titulo", { video: videoVacio }).pasoSlug, "investigacion");
    // 3 keywords pero 0 preguntas → sigue bloqueado
    assert.notEqual(evaluarRequisitos("titulo", { video: { ...videoVacio, palabrasClave: ["a", "b", "c"] } }), null);
    // 2 keywords y 1 pregunta → sigue bloqueado
    assert.notEqual(
      evaluarRequisitos("titulo", { video: { ...videoVacio, palabrasClave: ["a", "b"], seoPreguntas: ["¿x?"] } }),
      null
    );
    assert.equal(
      evaluarRequisitos("titulo", { video: { ...videoVacio, palabrasClave: ["a", "b", "c"], seoPreguntas: ["¿x?"] } }),
      null
    );
  });

  await t.test("miniatura_brief, hook, hashtags y comunidad: necesitan tituloFinal", () => {
    for (const tipo of ["miniatura_brief", "hook", "hashtags", "comunidad"]) {
      const r = evaluarRequisitos(tipo, { video: videoVacio });
      assert.equal(r.falta, "tituloFinal", tipo);
      assert.equal(r.pasoSlug, "titulo", tipo);
      assert.equal(evaluarRequisitos(tipo, { video: conTitulo }), null, tipo);
    }
  });

  await t.test("descripcion: tituloFinal y algo de guion", () => {
    assert.equal(evaluarRequisitos("descripcion", { video: videoVacio }).falta, "tituloFinal");
    const sinGuion = evaluarRequisitos("descripcion", { video: conTitulo });
    assert.equal(sinGuion.falta, "guion.seoInicio");
    assert.equal(sinGuion.pasoSlug, "guion");
    assert.equal(
      evaluarRequisitos("descripcion", { video: { ...conTitulo, guion: { seoInicio: "Hoy verás…", desarrollo: [] } } }),
      null
    );
    assert.equal(
      evaluarRequisitos("descripcion", { video: { ...conTitulo, guion: { seoInicio: "", desarrollo: [{ titulo: "Bloque 1" }] } } }),
      null
    );
  });

  await t.test("email: tituloFinal y publishedAt", () => {
    assert.equal(evaluarRequisitos("email", { video: videoVacio }).pasoSlug, "titulo");
    const sinPublicar = evaluarRequisitos("email", { video: conTitulo });
    assert.equal(sinPublicar.falta, "publishedAt");
    assert.equal(sinPublicar.pasoSlug, "publicacion");
    assert.equal(evaluarRequisitos("email", { video: { ...conTitulo, publishedAt: "2026-06-01T10:00:00Z" } }), null);
  });

  await t.test("analisis_retencion: necesita publishedAt", () => {
    const r = evaluarRequisitos("analisis_retencion", { video: conTitulo });
    assert.equal(r.falta, "publishedAt");
    assert.equal(r.pasoSlug, "publicacion");
    assert.equal(
      evaluarRequisitos("analisis_retencion", { video: { ...conTitulo, publishedAt: "2026-06-01T10:00:00Z" } }),
      null
    );
  });

  await t.test("temas_canal y sugerir_nombres_canal: necesitan nicho en el perfil", () => {
    for (const tipo of ["temas_canal", "sugerir_nombres_canal"]) {
      const r = evaluarRequisitos(tipo, { profile: perfilSinNicho });
      assert.equal(r.falta, "nicho", tipo);
      assert.equal(r.pasoSlug, "configuracion", tipo);
      assert.notEqual(evaluarRequisitos(tipo, { profile: { nicho: "   " } }), null, `${tipo}: nicho en blanco bloquea`);
      assert.equal(evaluarRequisitos(tipo, { profile: perfilConNicho }), null, tipo);
    }
  });

  await t.test("romu_aprueba y evaluacion_nicho: sin requisitos", () => {
    assert.equal(evaluarRequisitos("romu_aprueba", { video: videoVacio, profile: perfilSinNicho }), null);
    assert.equal(evaluarRequisitos("evaluacion_nicho", {}), null);
  });

  await t.test("tipo desconocido o sin contexto: no bloquea (la ruta valida el tipo aparte)", () => {
    assert.equal(evaluarRequisitos("inexistente", {}), null);
    assert.equal(evaluarRequisitos("romu_aprueba"), null);
  });
});

// ---------- HTTP: 422 REQUISITO_FALTANTE con detalles + sugerir_nombres_canal ----------

test("POST /api/ia/generar — bloqueo duro y generador de nombres", async (t) => {
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

  await t.test("titulo sin investigación → 422 con detalles", async () => {
    const r = await call("POST", "/api/ia/generar", { tipo: "titulo", videoProjectId: video.id });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "REQUISITO_FALTANTE");
    assert.ok(r.body.error.length > 0);
    assert.equal(r.body.details[0].falta, "palabrasClave");
    assert.equal(r.body.details[0].pasoSlug, "investigacion");
  });

  await t.test("descripcion sin tituloFinal → 422; con título pero sin guion → 422 hacia guion", async () => {
    const r1 = await call("POST", "/api/ia/generar", { tipo: "descripcion", videoProjectId: video.id });
    assert.equal(r1.status, 422);
    assert.equal(r1.body.details[0].falta, "tituloFinal");
    assert.equal(r1.body.details[0].pasoSlug, "titulo");

    await call("PATCH", `/api/videos/${video.id}`, { tituloFinal: "Pan sin amasar en 5 minutos" });
    const r2 = await call("POST", "/api/ia/generar", { tipo: "descripcion", videoProjectId: video.id });
    assert.equal(r2.status, 422);
    assert.equal(r2.body.details[0].falta, "guion.seoInicio");
    assert.equal(r2.body.details[0].pasoSlug, "guion");
  });

  await t.test("temas_canal y sugerir_nombres_canal sin nicho → 422 hacia configuracion", async () => {
    await call("PATCH", "/api/profile", { nicho: null });
    for (const tipo of ["temas_canal", "sugerir_nombres_canal"]) {
      const r = await call("POST", "/api/ia/generar", { tipo });
      assert.equal(r.status, 422, tipo);
      assert.equal(r.body.code, "REQUISITO_FALTANTE", tipo);
      assert.equal(r.body.details[0].falta, "nicho", tipo);
      assert.equal(r.body.details[0].pasoSlug, "configuracion", tipo);
    }
    await call("PATCH", "/api/profile", { nicho: "cocina vegana" });
  });

  await t.test("sugerir_nombres_canal: 5 nombres normalizados (dedupe y vacíos fuera)", async () => {
    let promptEnviado = "";
    setTransport(async (_cfg, payload) => {
      promptEnviado = payload?.messages?.find((m) => m.role === "user")?.content ?? "";
      return respuesta(
        JSON.stringify({
          nombres: [
            { nombre: "Verde y Al Punto", porQue: "Une nicho y personalidad" },
            { nombre: "Verde y Al Punto", porQue: "duplicado: fuera" },
            { nombre: "   ", porQue: "vacío: fuera" },
            { nombre: "Cocina Sin Carne" },
            { nombre: "El Huerto en la Mesa", porQue: "x".repeat(500) },
            { nombre: "Vegana Fácil", porQue: "Claridad de búsqueda" },
            { nombre: "Sabor Verde", porQue: "Marca corta" },
            { nombre: "Sexto Nombre Sobrante", porQue: "máximo 5: fuera" },
          ],
        })
      );
    });
    const r = await call("POST", "/api/ia/generar", { tipo: "sugerir_nombres_canal", opciones: { nicho: "cocina vegana" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, false);
    assert.equal(r.body.resultados.length, 5);
    assert.equal(r.body.resultados[0].nombre, "Verde y Al Punto");
    assert.equal(r.body.resultados[1].porQue, null); // porQue ausente → null
    assert.ok(r.body.resultados[2].porQue.length <= 200); // truncado
    assert.ok(promptEnviado.includes("cocina vegana"));
    // queda en historial sin vídeo asociado
    const hist = await call("GET", "/api/ia/historial?tipo=sugerir_nombres_canal");
    assert.equal(hist.body.length, 1);
    assert.equal(hist.body[0].videoProjectId, null);
  });

  await t.test("sugerir_nombres_canal: respuesta malformada → degradación elegante", async () => {
    setTransport(async () => respuesta('{"nombres": "esto no es una lista"}'));
    const r = await call("POST", "/api/ia/generar", { tipo: "sugerir_nombres_canal", opciones: { nicho: "cocina vegana" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.parseFallido, true);
    assert.ok(r.body.resultados[0].texto.includes("no es una lista"));
  });
});
