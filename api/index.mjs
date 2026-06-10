// api/index.mjs — entrada serverless de Vercel. Monta la app Express (que ya enruta /api/*).
// Inicialización perezosa y cacheada entre invocaciones "calientes" (la BD es Turso/libSQL).
import { createApp } from "../app/backend/src/server.js";

let appPromise;

export default async function handler(req, res) {
  if (!appPromise) appPromise = createApp();
  const app = await appPromise;
  return app(req, res);
}
