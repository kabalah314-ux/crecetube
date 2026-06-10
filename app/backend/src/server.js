// server.js — app Express. createApp() exportable para tests; listen solo si es el entrypoint.
import express from "express";
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { cfg } from "./config.js";
import { openDb } from "./db.js";
import { errorHandler } from "./errors.js";
import profileRoutes from "./routes/profile.js";
import iaRoutes from "./routes/ia.js";
import systemRoutes from "./routes/system.js";
import videosRoutes from "./routes/videos.js";
import cursoRoutes from "./routes/curso.js";
import plantillasRoutes from "./routes/plantillas.js";
import metricasRoutes from "./routes/metricas.js";

export function createApp({ dbPath } = {}) {
  const db = openDb(dbPath);
  const app = express();
  app.locals.db = db;

  app.use(express.json({ limit: "25mb" }));
  mkdirSync(cfg.UPLOADS_DIR, { recursive: true });
  app.use("/uploads", express.static(cfg.UPLOADS_DIR));

  app.use("/api", systemRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/ia", iaRoutes);
  app.use("/api/videos", videosRoutes);
  app.use("/api/curso", cursoRoutes);
  app.use("/api/plantillas", plantillasRoutes);
  app.use("/api/metricas", metricasRoutes);

  app.use("/api", (req, res) =>
    res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`, code: "NOT_FOUND" })
  );
  app.use(errorHandler);
  return app;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  createApp().listen(cfg.PORT, () =>
    console.log(`API CRECETUBE Assistant escuchando en http://localhost:${cfg.PORT}`)
  );
}
