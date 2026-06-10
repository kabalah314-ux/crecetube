// config.js — carga .env de la raíz del repo (sin dependencia dotenv) y expone defaults.
// En local la BD es un fichero (file:). En producción (Vercel) se usa Turso (libsql://) vía env.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "..", "..", "..");

const envFile = resolve(ROOT, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const localDbPath = resolve(ROOT, process.env.DB_PATH || "app/backend/data/crecetube.db").replace(/\\/g, "/");

export const cfg = {
  PORT: Number(process.env.PORT || 8001),
  // libSQL/Turso: file: en local, libsql:// en producción (Vercel env: DB_URL + DB_AUTH_TOKEN).
  DB_URL: process.env.DB_URL || `file:${localDbPath}`,
  DB_AUTH_TOKEN: process.env.DB_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || "",
  LLM_API_KEY: process.env.LLM_API_KEY || "",
  LLM_PROVIDER: process.env.LLM_PROVIDER || "openrouter",
  LLM_MODEL: process.env.LLM_MODEL || "openrouter/free",
  LLM_BASE_URL: process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1",
};
