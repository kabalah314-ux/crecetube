import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers.mjs";

test("viabilidad: CRUD singleton", async (t) => {
  const { call, close } = await boot();
  t.after(close);

  await t.test("GET sin datos → null", async () => {
    const r = await call("GET", "/api/viabilidad");
    assert.equal(r.status, 200);
    assert.equal(r.body, null);
  });

  await t.test("PATCH crea el estudio", async () => {
    const r = await call("PATCH", "/api/viabilidad", {
      ideaCanal: "Canal de productividad para freelancers",
      subNicho: "productividad para diseñadores gráficos freelance",
      pvu: "El único canal de herramientas gratuitas para diseñadores",
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.id, "main");
    assert.equal(r.body.ideaCanal, "Canal de productividad para freelancers");
    assert.equal(r.body.subNicho, "productividad para diseñadores gráficos freelance");
    assert.ok(r.body.updatedAt);
    assert.ok(r.body.createdAt);
  });

  await t.test("GET persiste los datos anteriores", async () => {
    const r = await call("GET", "/api/viabilidad");
    assert.equal(r.status, 200);
    assert.equal(r.body.id, "main");
    assert.equal(r.body.ideaCanal, "Canal de productividad para freelancers");
    assert.equal(r.body.pvu, "El único canal de herramientas gratuitas para diseñadores");
  });

  await t.test("PATCH segunda vez fusiona sin pisar campos", async () => {
    const r = await call("PATCH", "/api/viabilidad", {
      completado: true,
      autoveredicto: "viable",
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.completado, true);
    assert.equal(r.body.autoveredicto, "viable");
    assert.equal(r.body.ideaCanal, "Canal de productividad para freelancers");
  });

  await t.test("GET refleja el estado completado", async () => {
    const r = await call("GET", "/api/viabilidad");
    assert.equal(r.status, 200);
    assert.equal(r.body.completado, true);
    assert.equal(r.body.autoveredicto, "viable");
  });
});
