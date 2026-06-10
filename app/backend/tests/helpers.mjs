// helpers.mjs — arranca la app con BD temporal en puerto efímero (08 §8.2).
process.env.LLM_API_KEY = ""; // los tests nunca llaman a la red real

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";

const { createApp } = await import("../src/server.js");

export async function boot() {
  const dir = mkdtempSync(join(tmpdir(), "crecetube-test-"));
  const app = createApp({ dbPath: join(dir, "test.db") });
  const srv = app.listen(0);
  await once(srv, "listening");
  const base = `http://127.0.0.1:${srv.address().port}`;

  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    return { status: res.status, body: json };
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
