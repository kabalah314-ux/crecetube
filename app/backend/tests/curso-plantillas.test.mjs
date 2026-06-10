import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers.mjs";

test("curso y plantillas", async (t) => {
  const { call, close } = await boot();
  t.after(close);

  await t.test("estructura completa desde seed: 20/169", async () => {
    const r = await call("GET", "/api/curso/estructura");
    assert.equal(r.status, 200);
    assert.equal(r.body.secciones.length, 20);
    const total = r.body.secciones.reduce((n, s) => n + s.asignaturas.length, 0);
    assert.equal(total, 169);
    assert.equal(r.body.secciones[0].id, "s1");
  });

  await t.test("progreso upsert: completar + nota", async () => {
    let r = await call("PATCH", "/api/curso/progreso/s1_a1", { completado: true });
    assert.equal(r.body.completado, true);
    assert.ok(r.body.fechaCompletado);
    assert.equal(r.body.seccionId, "s1");
    r = await call("PATCH", "/api/curso/progreso/s1_a1", { notaPersonal: "Repasar el banner" });
    assert.equal(r.body.completado, true); // upsert no pisa
    assert.equal(r.body.notaPersonal, "Repasar el banner");
    const lista = await call("GET", "/api/curso/progreso");
    assert.equal(lista.body.length, 1);
  });

  await t.test("asignatura desconocida → 422", async () => {
    const r = await call("PATCH", "/api/curso/progreso/s99_a99", { completado: true });
    assert.equal(r.status, 422);
  });

  await t.test("25 plantillas precargadas", async () => {
    const r = await call("GET", "/api/plantillas");
    assert.equal(r.body.length, 25);
    assert.ok(r.body.every((p) => p.esPrecargada && !p.esEditable));
    const porTipo = await call("GET", "/api/plantillas?tipo=email");
    assert.equal(porTipo.body.length, 4);
  });

  await t.test("aplicar variables resuelve y deja visibles las vacías", async () => {
    const r = await call("POST", "/api/plantillas/tpl_comunidad_seolaunch/aplicar", {
      variables: { tituloVideo: "Mi gran vídeo" },
    });
    assert.equal(r.status, 200);
    assert.ok(r.body.texto.includes("Mi gran vídeo"));
    assert.ok(r.body.texto.includes("{diaEstreno}")); // no provista → visible
  });

  await t.test("editar precargada → 403; duplicar → editable", async () => {
    let r = await call("PATCH", "/api/plantillas/tpl_guion_completo", { nombre: "Hackeada" });
    assert.equal(r.status, 403);
    assert.equal(r.body.code, "TEMPLATE_NOT_EDITABLE");
    r = await call("POST", "/api/plantillas", { duplicaDe: "tpl_guion_completo" });
    assert.equal(r.status, 201);
    assert.equal(r.body.esEditable, true);
    assert.ok(r.body.nombre.startsWith("Copia de"));
    const edit = await call("PATCH", `/api/plantillas/${r.body.id}`, { nombre: "Mi guion" });
    assert.equal(edit.body.nombre, "Mi guion");
    const del = await call("DELETE", `/api/plantillas/${r.body.id}`);
    assert.equal(del.body.ok, true);
  });

  await t.test("descarga md/txt; pdf → 422 documentado", async () => {
    const md = await call("GET", "/api/plantillas/tpl_banner_canal/descargar?formato=md");
    assert.equal(md.status, 200);
    const pdf = await call("GET", "/api/plantillas/tpl_banner_canal/descargar?formato=pdf");
    assert.equal(pdf.status, 422);
  });
});
