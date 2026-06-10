// smoke.mjs — arranca el backend y verifica los endpoints básicos. Uso: node scripts/smoke.mjs
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const BASE = "http://127.0.0.1:8001";

process.env.DB_PATH = "app/backend/data/smoke.db";
const srv = spawn(process.execPath, ["src/server.js"], {
  cwd: resolve(ROOT, "app", "backend"),
  env: process.env,
  stdio: "inherit",
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fin = (code) => {
  srv.kill();
  process.exit(code);
};

try {
  let up = false;
  for (let i = 0; i < 20 && !up; i++) {
    await wait(300);
    up = await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false);
  }
  if (!up) throw new Error("el backend no arrancó");

  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  console.log("health:", JSON.stringify(health));

  const p404 = await fetch(`${BASE}/api/profile`).then((r) => r.status);
  console.log("GET perfil sin crear (esperado 404):", p404);

  const creado = await fetch(`${BASE}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      canalNombre: "Smoke Test",
      nicho: "pruebas",
      nivel: "intermedio",
      frecuenciaObjetivo: "semanal",
      objetivoPrincipal: "suscriptores",
    }),
  }).then((r) => r.json());
  console.log("perfil creado:", creado.canalNombre, "| tema:", creado.preferenciasUi?.tema, "| modelo IA:", creado.iaConfig?.modelo);

  const test = await fetch(`${BASE}/api/ia/test-conexion`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  console.log("test-conexion sin clave (esperado 503):", test.status, (await test.json()).code);

  console.log("SMOKE OK");
  fin(0);
} catch (e) {
  console.error("SMOKE FALLO:", e.message);
  fin(1);
}
