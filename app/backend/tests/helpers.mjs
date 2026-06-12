// helpers.mjs — arranca la app con BD temporal en puerto efímero (08 §8.2).
process.env.LLM_API_KEY = ""; // los tests nunca llaman a la red real
// Secreto fijo para poder probar las rutas de auth; las peticiones SIN cookie siguen en modo local.
process.env.SESSION_SECRET = "secreto-de-tests-crecetube";
process.env.GOOGLE_CLIENT_ID = "";

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";

const { createApp } = await import("../src/server.js");

export async function boot() {
  const dir = mkdtempSync(join(tmpdir(), "crecetube-test-"));
  const dbUrl = "file:" + join(dir, "test.db").replace(/\\/g, "/");
  const app = await createApp({ dbUrl });
  const srv = app.listen(0);
  await once(srv, "listening");
  const base = `http://127.0.0.1:${srv.address().port}`;

  const call = async (method, path, body, { cookie } = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (cookie) headers.Cookie = cookie;
    const res = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    return { status: res.status, body: json, setCookie: res.headers.get("set-cookie") };
  };

  return { base, call, close: () => new Promise((r) => srv.close(r)) };
}

export const PERFIL_OK = {
  canalNombre: "Canal de prueba",
  nicho: "cocina vegana",
  nivel: "intermedio",
  frecuenciaObjetivo: "semanal",
  objetivoPrincipal: "suscriptores",
  tieneCanalYa: true,
};
