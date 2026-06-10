// db.js — libSQL/Turso (compatible SQLite). Local: file: URL. Producción: libsql:// + token.
// Los seeds se importan estáticamente para que el bundler de Vercel los incluya en la función.
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { nowIso } from "./util.js";
import cursoSeed from "../../guia_maestra/07_curso_seed.json" with { type: "json" };
import plantillasSeed from "../../guia_maestra/05_plantillas_seed.json" with { type: "json" };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profile (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  estado TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  publishedAt TEXT
);
CREATE INDEX IF NOT EXISTS idx_videos_estado ON videos(estado);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(createdAt);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(publishedAt);
CREATE TABLE IF NOT EXISTS deleted_videos (id TEXT PRIMARY KEY, data TEXT NOT NULL, deletedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS course_progress (asignaturaId TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  tipo TEXT NOT NULL,
  esPrecargada INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ai_interactions (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  videoProjectId TEXT,
  tipo TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_video ON ai_interactions(videoProjectId, createdAt);
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  videoProjectId TEXT NOT NULL,
  fecha TEXT NOT NULL,
  UNIQUE(videoProjectId, fecha)
);
`;

export const jparse = (row) => (row ? JSON.parse(row.data) : null);

// Crea un cliente libSQL y un helper async ergonómico ({get,all,run,batch,exec}).
// Cada llamada a makeDb es independiente (los tests crean varias instancias).
export function makeDb(url, authToken) {
  if (url.startsWith("file:")) {
    try {
      mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
    } catch {
      /* la carpeta ya existe */
    }
  }
  const client = createClient(url.startsWith("file:") ? { url } : { url, authToken });
  return {
    client,
    async get(sql, args = []) {
      return (await client.execute({ sql, args })).rows[0] ?? null;
    },
    async all(sql, args = []) {
      return (await client.execute({ sql, args })).rows;
    },
    async run(sql, args = []) {
      return client.execute({ sql, args });
    },
    async batch(stmts) {
      return client.batch(stmts, "write");
    },
    async exec(sqlText) {
      return client.executeMultiple(sqlText);
    },
  };
}

const getMeta = async (db, key) => (await db.get("SELECT value FROM meta WHERE key=?", [key]))?.value;
const setMeta = (db, key, value) => db.run("INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)", [key, value]);

// Carga de seeds con versionado no destructivo (03 §3.3.5).
async function seed(db) {
  if (cursoSeed.version > Number((await getMeta(db, "courseSeedVersion")) ?? 0)) {
    await setMeta(db, "courseStructure", JSON.stringify(cursoSeed));
    await setMeta(db, "courseSeedVersion", String(cursoSeed.version));
  }

  if (plantillasSeed.version > Number((await getMeta(db, "templatesSeedVersion")) ?? 0)) {
    const now = nowIso();
    const stmts = [];
    for (const p of plantillasSeed.plantillas) {
      const prev = jparse(await db.get("SELECT data FROM templates WHERE id=?", [p.id]));
      stmts.push({
        sql: "INSERT OR REPLACE INTO templates(id,data,tipo,esPrecargada) VALUES(?,?,?,1)",
        args: [p.id, JSON.stringify({ ...p, createdAt: prev?.createdAt ?? now, updatedAt: now }), p.tipo],
      });
    }
    stmts.push({
      sql: "INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)",
      args: ["templatesSeedVersion", String(plantillasSeed.version)],
    });
    await db.batch(stmts);
  }
}

// Inicializa esquema + seeds. Idempotente (seguro en cada arranque/cold-start serverless).
export async function initDb(db) {
  await db.exec(SCHEMA);
  await seed(db);
}

export async function getCourseStructure(db) {
  return JSON.parse(await getMeta(db, "courseStructure"));
}
