import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers.mjs";

test("vídeos: CRUD, merge, checklist, estados, duplicar, soft delete", async (t) => {
  const { call, close } = await boot();
  t.after(close);
  let id;

  await t.test("POST crea con defaults de 03 §3.5", async () => {
    const r = await call("POST", "/api/videos", { tituloIdea: "Cómo grabar audio pro", nicho: "tech" });
    assert.equal(r.status, 201);
    id = r.body.id;
    assert.equal(r.body.estado, "idea");
    assert.equal(r.body.pantallasFinales.configuracion, "binaria");
    assert.deepEqual(r.body.checklistEstado, {});
  });

  await t.test("POST sin título → 422", async () => {
    const r = await call("POST", "/api/videos", {});
    assert.equal(r.status, 422);
  });

  await t.test("PATCH merge parcial profundo no pisa hermanos", async () => {
    await call("PATCH", `/api/videos/${id}`, { guion: { seoShock: "Dato brutal" } });
    const r = await call("PATCH", `/api/videos/${id}`, { guion: { seoLoop: "Al final verás X" } });
    assert.equal(r.body.guion.seoShock, "Dato brutal");
    assert.equal(r.body.guion.seoLoop, "Al final verás X");
  });

  await t.test("PATCH no puede tocar estado ni checklist", async () => {
    const r = await call("PATCH", `/api/videos/${id}`, { estado: "publicado", checklistEstado: { x: { y: true } } });
    assert.equal(r.body.estado, "idea");
    assert.deepEqual(r.body.checklistEstado, {});
  });

  await t.test("validaciones duras: timestamps 00:00 y hashtags", async () => {
    let r = await call("PATCH", `/api/videos/${id}`, { timestamps: [{ tiempo: "01:00", titulo: "Intro" }] });
    assert.equal(r.status, 422);
    r = await call("PATCH", `/api/videos/${id}`, { hashtags: { descripcion: ["sin-almohadilla"] } });
    assert.equal(r.status, 422);
    r = await call("PATCH", `/api/videos/${id}`, {
      timestamps: [{ tiempo: "00:00", titulo: "Intro" }],
      hashtags: { descripcion: ["#audio", "#micro", "#grabacion"] },
    });
    assert.equal(r.status, 200);
  });

  await t.test("tarjetas: primer minuto y distancia 2min", async () => {
    let r = await call("PATCH", `/api/videos/${id}`, {
      tarjetas: [{ tipo: "SEOjeta", momentoSegundos: 30, destino: "x", cta: "mira" }],
    });
    assert.equal(r.status, 422);
    r = await call("PATCH", `/api/videos/${id}`, {
      tarjetas: [
        { tipo: "SEOjeta", momentoSegundos: 90, destino: "x", cta: "mira" },
        { tipo: "Psicojetas", momentoSegundos: 150, destino: "y", cta: "ve" },
      ],
    });
    assert.equal(r.status, 422);
    r = await call("PATCH", `/api/videos/${id}`, {
      tarjetas: [
        { tipo: "SEOjeta", momentoSegundos: 90, destino: "x", cta: "mira" },
        { tipo: "Psicojetas", momentoSegundos: 240, destino: "y", cta: "ve" },
      ],
    });
    assert.equal(r.status, 200);
  });

  await t.test("checklist persiste por stepId/itemKey", async () => {
    const r = await call("PATCH", `/api/videos/${id}/checklist`, {
      stepId: "idea",
      itemKey: "idea-validada-3-fuentes",
      valor: true,
    });
    assert.equal(r.body.checklistEstado.idea["idea-validada-3-fuentes"], true);
  });

  await t.test("cambio de estado: publicado fija publishedAt; desconocido → 422", async () => {
    let r = await call("PATCH", `/api/videos/${id}/estado`, { estado: "volando" });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "INVALID_STATE_TRANSITION");
    r = await call("PATCH", `/api/videos/${id}/estado`, { estado: "publicado" });
    assert.ok(r.body.publishedAt);
  });

  await t.test("filtros de listado", async () => {
    await call("POST", "/api/videos", { tituloIdea: "Short de cocina", tipo: "sprint", formato: "short" });
    const porEstado = await call("GET", "/api/videos?estado=publicado");
    assert.equal(porEstado.body.length, 1);
    const porQ = await call("GET", "/api/videos?q=cocina");
    assert.equal(porQ.body.length, 1);
  });

  await t.test("duplicar resetea estado y checklist", async () => {
    const r = await call("POST", `/api/videos/${id}/duplicar`);
    assert.equal(r.status, 201);
    assert.equal(r.body.estado, "idea");
    assert.ok(r.body.tituloIdea.startsWith("Copia de"));
    assert.equal(r.body.publishedAt, null);
  });

  await t.test("soft delete + restaurar", async () => {
    const del = await call("DELETE", `/api/videos/${id}`);
    assert.equal(del.body.ok, true);
    const gone = await call("GET", `/api/videos/${id}`);
    assert.equal(gone.status, 404);
    const rest = await call("POST", `/api/videos/${id}/restaurar`);
    assert.equal(rest.status, 200);
    const back = await call("GET", `/api/videos/${id}`);
    assert.equal(back.status, 200);
    assert.equal(back.body.estado, "publicado");
  });
});
