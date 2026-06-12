import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers.mjs";

const cookieDe = (r) => r.setCookie.split(";")[0];

test("auth: registro, sesión, login y modo local", async (t) => {
  const { call, close } = await boot();
  t.after(close);
  let cookie;

  await t.test("me sin sesión → modo local", async () => {
    const r = await call("GET", "/api/auth/me");
    assert.equal(r.status, 200);
    assert.equal(r.body.id, "local");
    assert.equal(r.body.modo, "local");
  });

  await t.test("registro inválido → 422 con details", async () => {
    const r = await call("POST", "/api/auth/registro", { email: "no-es-email", password: "corta" });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "VALIDATION_ERROR");
    assert.equal(r.body.details.length, 2);
  });

  await t.test("registro válido crea cuenta y setea cookie httpOnly", async () => {
    const r = await call("POST", "/api/auth/registro", { email: "Ana@Test.com", password: "supersegura", nombre: "Ana" });
    assert.equal(r.status, 201);
    assert.equal(r.body.email, "ana@test.com"); // normalizado a minúsculas
    assert.equal(r.body.nombre, "Ana");
    assert.equal(r.body.modo, "cuenta");
    assert.ok(r.setCookie?.includes("ct_session="));
    assert.match(r.setCookie, /HttpOnly/i);
    cookie = cookieDe(r);
  });

  await t.test("me con cookie → modo cuenta", async () => {
    const r = await call("GET", "/api/auth/me", undefined, { cookie });
    assert.equal(r.status, 200);
    assert.equal(r.body.modo, "cuenta");
    assert.equal(r.body.email, "ana@test.com");
  });

  await t.test("la cuenta nace con canal por defecto y datos aislados del modo local", async () => {
    await call("POST", "/api/videos", { tituloIdea: "Vídeo del usuario local" }); // sin cookie → modo local
    const propios = await call("GET", "/api/videos", undefined, { cookie });
    assert.equal(propios.body.length, 0);
    const canales = await call("GET", "/api/canales", undefined, { cookie });
    assert.equal(canales.body.length, 1);
    assert.equal(canales.body[0].esPorDefecto, true);
    const locales = await call("GET", "/api/videos");
    assert.equal(locales.body.length, 1);
  });

  await t.test("registro duplicado → 409", async () => {
    const r = await call("POST", "/api/auth/registro", { email: "ana@test.com", password: "otracosa123" });
    assert.equal(r.status, 409);
    assert.equal(r.body.code, "EMAIL_ALREADY_EXISTS");
  });

  await t.test("logout borra la cookie", async () => {
    const r = await call("POST", "/api/auth/logout", {}, { cookie });
    assert.equal(r.body.ok, true);
    assert.ok(r.setCookie.startsWith("ct_session=;") || /Expires=/i.test(r.setCookie));
  });

  await t.test("login con password incorrecta → 401", async () => {
    const r = await call("POST", "/api/auth/login", { email: "ana@test.com", password: "incorrecta1" });
    assert.equal(r.status, 401);
    assert.equal(r.body.code, "INVALID_CREDENTIALS");
  });

  await t.test("login con email inexistente → 401", async () => {
    const r = await call("POST", "/api/auth/login", { email: "nadie@test.com", password: "supersegura" });
    assert.equal(r.status, 401);
  });

  await t.test("login correcto → sesión nueva funcional", async () => {
    const r = await call("POST", "/api/auth/login", { email: "ana@test.com", password: "supersegura" });
    assert.equal(r.status, 200);
    assert.ok(r.setCookie?.includes("ct_session="));
    const me = await call("GET", "/api/auth/me", undefined, { cookie: cookieDe(r) });
    assert.equal(me.body.email, "ana@test.com");
    assert.equal(me.body.modo, "cuenta");
  });

  await t.test("cookie manipulada → modo local (nunca 401)", async () => {
    const r = await call("GET", "/api/auth/me", undefined, { cookie: "ct_session=token-falso" });
    assert.equal(r.status, 200);
    assert.equal(r.body.modo, "local");
  });

  await t.test("google sin GOOGLE_CLIENT_ID → 503 AUTH_NOT_CONFIGURED", async () => {
    const r = await call("POST", "/api/auth/google", { credential: "x" });
    assert.equal(r.status, 503);
    assert.equal(r.body.code, "AUTH_NOT_CONFIGURED");
  });
});
