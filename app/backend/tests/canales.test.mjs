import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, PERFIL_OK } from "./helpers.mjs";

test("canales: CRUD, canal por defecto y vídeos por canal", async (t) => {
  const { call, close } = await boot();
  t.after(close);
  let defaultId;
  let segundo;

  await t.test("el usuario local nace con canal por defecto", async () => {
    const r = await call("GET", "/api/canales");
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 1);
    assert.equal(r.body[0].nombre, "Mi canal");
    assert.equal(r.body[0].esPorDefecto, true);
    defaultId = r.body[0].id;
  });

  await t.test("POST sin nombre → 422", async () => {
    const r = await call("POST", "/api/canales", {});
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "VALIDATION_ERROR");
  });

  await t.test("POST crea un segundo canal (no por defecto)", async () => {
    const r = await call("POST", "/api/canales", { nombre: "Canal gaming" });
    assert.equal(r.status, 201);
    assert.equal(r.body.nombre, "Canal gaming");
    assert.equal(r.body.esPorDefecto, false);
    segundo = r.body;
  });

  await t.test("PATCH renombra; canal inexistente → 404", async () => {
    const r = await call("PATCH", `/api/canales/${segundo.id}`, { nombre: "Canal retro" });
    assert.equal(r.status, 200);
    assert.equal(r.body.nombre, "Canal retro");
    const nf = await call("PATCH", "/api/canales/no-existe", { nombre: "x" });
    assert.equal(nf.status, 404);
    assert.equal(nf.body.code, "CHANNEL_NOT_FOUND");
  });

  await t.test("vídeo sin canalId va al canal por defecto", async () => {
    const r = await call("POST", "/api/videos", { tituloIdea: "Sin canal explícito" });
    assert.equal(r.status, 201);
    assert.equal(r.body.canalId, defaultId);
  });

  await t.test("vídeo con canalId explícito + filtro GET ?canalId=", async () => {
    const v = await call("POST", "/api/videos", { tituloIdea: "Para el canal retro", canalId: segundo.id });
    assert.equal(v.body.canalId, segundo.id);
    const delRetro = await call("GET", `/api/videos?canalId=${segundo.id}`);
    assert.equal(delRetro.body.length, 1);
    assert.equal(delRetro.body[0].id, v.body.id);
    const delDefault = await call("GET", `/api/videos?canalId=${defaultId}`);
    assert.equal(delDefault.body.length, 1);
    const todos = await call("GET", "/api/videos");
    assert.equal(todos.body.length, 2);
  });

  await t.test("canalId desconocido al crear vídeo → 422", async () => {
    const r = await call("POST", "/api/videos", { tituloIdea: "x", canalId: "no-existe" });
    assert.equal(r.status, 422);
  });

  await t.test("DELETE canal por defecto → 422", async () => {
    const r = await call("DELETE", `/api/canales/${defaultId}`);
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "CHANNEL_NOT_DELETABLE");
  });

  await t.test("DELETE canal con vídeos → 422", async () => {
    const r = await call("DELETE", `/api/canales/${segundo.id}`);
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "CHANNEL_NOT_DELETABLE");
  });

  await t.test("DELETE canal vacío → ok", async () => {
    const tercero = (await call("POST", "/api/canales", { nombre: "Efímero" })).body;
    const del = await call("DELETE", `/api/canales/${tercero.id}`);
    assert.equal(del.body.ok, true);
    const lista = await call("GET", "/api/canales");
    assert.equal(lista.body.length, 2);
  });

  await t.test("perfil acepta gestionMulticanal (default false)", async () => {
    const creado = await call("POST", "/api/profile", PERFIL_OK);
    assert.equal(creado.status, 201);
    assert.equal(creado.body.gestionMulticanal, false);
    const r = await call("PATCH", "/api/profile", { gestionMulticanal: true });
    assert.equal(r.status, 200);
    assert.equal(r.body.gestionMulticanal, true);
    const malo = await call("PATCH", "/api/profile", { gestionMulticanal: "si" });
    assert.equal(malo.status, 422);
  });
});
