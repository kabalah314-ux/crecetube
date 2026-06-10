import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, PERFIL_OK } from "./helpers.mjs";

test("perfil: ciclo de vida completo", async (t) => {
  const { call, close } = await boot();
  t.after(close);

  await t.test("GET sin perfil → 404 PROFILE_NOT_FOUND", async () => {
    const r = await call("GET", "/api/profile");
    assert.equal(r.status, 404);
    assert.equal(r.body.code, "PROFILE_NOT_FOUND");
  });

  await t.test("health ok", async () => {
    const r = await call("GET", "/api/health");
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
  });

  await t.test("POST inválido → 422 con details", async () => {
    const r = await call("POST", "/api/profile", { canalNombre: "", nicho: "x", nivel: "dios" });
    assert.equal(r.status, 422);
    assert.equal(r.body.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(r.body.details) && r.body.details.length >= 2);
  });

  await t.test("POST válido crea perfil con defaults", async () => {
    const r = await call("POST", "/api/profile", PERFIL_OK);
    assert.equal(r.status, 201);
    assert.equal(r.body.idioma, "es");
    assert.equal(r.body.preferenciasUi.tema, "dark");
    assert.equal(r.body.iaConfig.modelo, "openrouter/free");
    assert.equal(r.body.iaConfig.apiKey, ""); // sin clave → cadena vacía visible
  });

  await t.test("segundo POST → 409", async () => {
    const r = await call("POST", "/api/profile", PERFIL_OK);
    assert.equal(r.status, 409);
    assert.equal(r.body.code, "PROFILE_ALREADY_EXISTS");
  });

  await t.test("PATCH anidado funde sin pisar el resto", async () => {
    const r = await call("PATCH", "/api/profile", { preferenciasUi: { tema: "light" } });
    assert.equal(r.status, 200);
    assert.equal(r.body.preferenciasUi.tema, "light");
    assert.equal(r.body.preferenciasUi.densidad, "comoda");
    assert.equal(r.body.canalNombre, PERFIL_OK.canalNombre);
  });

  await t.test("la apiKey se enmascara y '***' no la machaca", async () => {
    let r = await call("PATCH", "/api/profile", { iaConfig: { apiKey: "sk-or-secreta" } });
    assert.equal(r.body.iaConfig.apiKey, "***");
    r = await call("PATCH", "/api/profile", { iaConfig: { apiKey: "***", temperatura: 0.3 } });
    assert.equal(r.body.iaConfig.temperatura, 0.3);
    const status = await call("GET", "/api/profile/ia-status");
    assert.equal(status.body.configured, true); // la clave real sigue guardada
  });

  await t.test("ia-status y test-conexion sin clave", async () => {
    await call("PATCH", "/api/profile", { iaConfig: { apiKey: "" } });
    const s = await call("GET", "/api/profile/ia-status");
    assert.equal(s.body.configured, false);
    const r = await call("POST", "/api/ia/test-conexion", {});
    assert.equal(r.status, 503);
    assert.equal(r.body.code, "AI_NOT_CONFIGURED");
  });
});
