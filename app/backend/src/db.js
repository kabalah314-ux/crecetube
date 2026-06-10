// db.js — SQLite estilo documental (08 §8.1): columna data JSON + columnas indexables.
import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { cfg } from "./config.js";
import { nowIso } from "./util.js";

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

const getMeta = (db, key) => db.prepare("SELECT value FROM meta WHERE key=?").get(key)?.value;
const setMeta = (db, key, value) =>
  db.prepare("INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)").run(key, value);

// Carga de seeds con versionado no destructivo (03 §3.3.5).
function seed(db) {
  const curso = JSON.parse(readFileSync(resolve(cfg.SEEDS_DIR, "07_curso_seed.json"), "utf8"));
  if (curso.version > Number(getMeta(db, "courseSeedVersion") ?? 0)) {
    setMeta(db, "courseStructure", JSON.stringify(curso));
    setMeta(db, "courseSeedVersion", String(curso.version));
  }

  const tpls = JSON.parse(readFileSync(resolve(cfg.SEEDS_DIR, "05_plantillas_seed.json"), "utf8"));
  if (tpls.version > Number(getMeta(db, "templatesSeedVersion") ?? 0)) {
    const sel = db.prepare("SELECT data FROM templates WHERE id=?");
    const up = db.prepare("INSERT OR REPLACE INTO templates(id,data,tipo,esPrecargada) VALUES(?,?,?,1)");
    const now = nowIso();
    db.transaction(() => {
      for (const p of tpls.plantillas) {
        const prev = jparse(sel.get(p.id));
        up.run(p.id, JSON.stringify({ ...p, createdAt: prev?.createdAt ?? now, updatedAt: now }), p.tipo);
      }
      setMeta(db, "templatesSeedVersion", String(tpls.version));
    })();
  }
}

export function openDb(dbPath = cfg.DB_PATH) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  seed(db);
  return db;
}

export function getCourseStructure(db) {
  return JSON.parse(getMeta(db, "courseStructure"));
}
