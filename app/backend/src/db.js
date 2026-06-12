// db.js — libSQL/Turso (compatible SQLite). Local: file: URL. Producción: libsql:// + token.
// Los seeds se importan estáticamente para que el bundler de Vercel los incluya en la función.
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { nowIso, uuid } from "./util.js";
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
CREATE TABLE IF NOT EXISTS viabilidad (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  completado INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
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

// ---------- Multi-usuario / multi-canal: helpers compartidos ----------

// Canal por defecto del usuario: lo crea si no existe. Devuelve { id, userId, nombre, esPorDefecto, createdAt }.
export async function ensureDefaultChannel(db, userId, nombre = "Mi canal") {
  const row = await db.get(
    "SELECT id, userId, nombre, esPorDefecto, createdAt FROM channels WHERE userId=? AND esPorDefecto=1",
    [userId]
  );
  if (row) return row;
  const canal = { id: uuid(), userId, nombre, esPorDefecto: 1, createdAt: nowIso() };
  await db.run("INSERT INTO channels(id,userId,nombre,esPorDefecto,createdAt) VALUES(?,?,?,1,?)", [
    canal.id,
    canal.userId,
    canal.nombre,
    canal.createdAt,
  ]);
  return canal;
}

// Asigna el canal por defecto a los vídeos del usuario sin canal (columna + JSON interno).
export async function adoptVideosSinCanal(db, userId) {
  const def = await ensureDefaultChannel(db, userId);
  const rows = await db.all("SELECT id, data FROM videos WHERE userId=? AND canalId IS NULL", [userId]);
  for (const row of rows) {
    const v = JSON.parse(row.data);
    v.canalId = def.id;
    await db.run("UPDATE videos SET canalId=?, data=? WHERE id=?", [def.id, JSON.stringify(v), row.id]);
  }
  return def;
}

// ---------- Migraciones versionadas ----------
// El SCHEMA de arriba conserva la forma original (v0): tanto una BD nueva como una
// existente pasan por la MISMA lista de migraciones (meta.schemaVersion las aplica una vez).

// ALTER TABLE ADD COLUMN tolerante a reejecución (si una migración quedó a medias).
async function addColumn(db, table, columnDdl) {
  try {
    await db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDdl}`);
  } catch (e) {
    if (!String(e.message).includes("duplicate column")) throw e;
  }
}

const MIGRATIONS = [
  {
    version: 1, // multi-usuario: tabla users + columna userId en las tablas de datos
    async up(db) {
      await db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        nombre TEXT,
        googleSub TEXT UNIQUE,
        passwordHash TEXT,
        createdAt TEXT NOT NULL
      )`);
      await db.run("INSERT OR IGNORE INTO users(id,nombre,createdAt) VALUES('local','Usuario local',?)", [nowIso()]);
      for (const t of ["profile", "videos", "deleted_videos", "templates", "ai_interactions", "metric_snapshots"]) {
        await addColumn(db, t, "userId TEXT NOT NULL DEFAULT 'local'");
      }
      await db.run("CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(userId)");
    },
  },
  {
    version: 2, // multi-canal: tabla channels + canal por defecto del usuario local + videos.canalId
    async up(db) {
      await db.run(`CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        nombre TEXT NOT NULL,
        esPorDefecto INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
      )`);
      await db.run("CREATE INDEX IF NOT EXISTS idx_channels_user ON channels(userId)");
      await addColumn(db, "videos", "canalId TEXT");
      const perfil = jparse(await db.get("SELECT data FROM profile WHERE userId='local'"));
      await ensureDefaultChannel(db, "local", perfil?.canalNombre || "Mi canal");
      await adoptVideosSinCanal(db, "local");
    },
  },
  {
    version: 3, // course_progress: PK compuesta (userId, asignaturaId) — recreación de tabla
    async up(db) {
      await db.run(`CREATE TABLE IF NOT EXISTS course_progress_new (
        userId TEXT NOT NULL DEFAULT 'local',
        asignaturaId TEXT NOT NULL,
        data TEXT NOT NULL,
        PRIMARY KEY (userId, asignaturaId)
      )`);
      await db.run(
        "INSERT OR IGNORE INTO course_progress_new(userId,asignaturaId,data) SELECT 'local', asignaturaId, data FROM course_progress"
      );
      await db.run("DROP TABLE course_progress");
      await db.run("ALTER TABLE course_progress_new RENAME TO course_progress");
    },
  },
  {
    version: 4, // viabilidad: PK compuesta (userId, id) — cada usuario tiene su estudio singleton
    async up(db) {
      await db.run(`CREATE TABLE IF NOT EXISTS viabilidad_new (
        id TEXT NOT NULL,
        userId TEXT NOT NULL DEFAULT 'local',
        data TEXT NOT NULL,
        completado INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        PRIMARY KEY (userId, id)
      )`);
      await db.run(
        "INSERT OR IGNORE INTO viabilidad_new(id,userId,data,completado,createdAt,updatedAt) SELECT id, 'local', data, completado, createdAt, updatedAt FROM viabilidad"
      );
      await db.run("DROP TABLE viabilidad");
      await db.run("ALTER TABLE viabilidad_new RENAME TO viabilidad");
    },
  },
];

async function migrate(db) {
  const actual = Number((await getMeta(db, "schemaVersion")) ?? 0);
  for (const m of MIGRATIONS) {
    if (m.version <= actual) continue;
    await m.up(db);
    await setMeta(db, "schemaVersion", String(m.version));
  }
}

// Inicializa esquema + migraciones + seeds. Idempotente (seguro en cada arranque/cold-start serverless).
export async function initDb(db) {
  await db.exec(SCHEMA);
  await migrate(db);
  await seed(db);
}

export async function getCourseStructure(db) {
  return JSON.parse(await getMeta(db, "courseStructure"));
}
