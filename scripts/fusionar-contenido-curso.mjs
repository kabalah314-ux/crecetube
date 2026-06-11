// T012 — Fusiona los fragmentos redactados (contenido_fragmentos/G*.json) en 07_curso_seed.json.
// Reglas: en conflicto entre lotes gana el video mas NUEVO (fecha_video); a igual fecha, el contenido mas largo.
// Sube "version" del seed para que la BD (local y Turso) recargue sola en el siguiente arranque (db.js §3.3.5).
// Uso: node scripts/fusionar-contenido-curso.mjs

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const SEED = path.resolve("app/guia_maestra/07_curso_seed.json");
const FRAGS = path.resolve("app/guia_maestra/contenido_fragmentos");

const seed = JSON.parse(await readFile(SEED, "utf8"));
const porId = new Map();
for (const s of seed.secciones) for (const a of s.asignaturas) porId.set(a.id, { a, seccion: s });

// 1) Recoger candidatos de todos los fragmentos
const candidatos = new Map(); // id -> [{contenido, videoReferencia, fecha_video, lote}]
const archivos = (await readdir(FRAGS)).filter((f) => /^G\d+\.json$/.test(f)).sort();
if (!archivos.length) {
  console.error("No hay fragmentos G*.json en " + FRAGS);
  process.exit(1);
}
const avisos = [];
for (const f of archivos) {
  const frag = JSON.parse(await readFile(path.join(FRAGS, f), "utf8"));
  const lote = frag.lote ?? f.replace(".json", "");
  for (const [id, c] of Object.entries(frag.asignaturas ?? {})) {
    if (!porId.has(id)) {
      avisos.push(`[${lote}] ID inexistente en el seed: ${id} (descartado)`);
      continue;
    }
    if (typeof c.contenido !== "string" || c.contenido.trim().length < 100) {
      avisos.push(`[${lote}] ${id}: contenido vacio o demasiado corto (descartado)`);
      continue;
    }
    if (/^#{1,6} |\*\*[^*]+\*\*/m.test(c.contenido)) {
      avisos.push(`[${lote}] ${id}: parece contener markdown (revisar)`);
    }
    if (!candidatos.has(id)) candidatos.set(id, []);
    candidatos.get(id).push({
      contenido: c.contenido,
      videoReferencia: c.videoReferencia ?? null,
      fecha: c.fecha_video ?? "0000-00-00",
      lote
    });
  }
}

// 2) Resolver conflictos: gana la fecha mas nueva; a igual fecha, el contenido mas largo
const conflictos = [];
let aplicadas = 0;
for (const [id, lista] of candidatos) {
  lista.sort((x, y) => (y.fecha.localeCompare(x.fecha)) || (y.contenido.length - x.contenido.length));
  const ganador = lista[0];
  if (lista.length > 1) {
    conflictos.push(
      `${id}: gana ${ganador.lote} (${ganador.fecha}) sobre ` +
        lista.slice(1).map((c) => `${c.lote} (${c.fecha})`).join(", ")
    );
  }
  const { a } = porId.get(id);
  a.contenido = ganador.contenido;
  a.videoReferencia = ganador.videoReferencia;
  aplicadas++;
}

// 3) Validar invariantes del seed
if (seed.secciones.length !== 20) throw new Error("Invariante rota: secciones != 20");
const totalAsigs = seed.secciones.reduce((n, s) => n + s.asignaturas.length, 0);
if (totalAsigs !== 169) throw new Error("Invariante rota: asignaturas != 169");

// 4) Subir version y escribir
seed.version = Number(seed.version ?? 0) + 1;
await writeFile(SEED, JSON.stringify(seed, null, 2) + "\n", "utf8");

// 5) Informe + lista de pendientes
const pendientes = [];
for (const s of seed.secciones)
  for (const a of s.asignaturas)
    if (!a.contenido) pendientes.push(`${a.id} | ${a.titulo} | ${a.duracionEstimadaMin} min | seccion: ${s.titulo}`);

const md = [
  "# Asignaturas SIN contenido (pendientes de video)",
  "",
  `Rellenadas: ${169 - pendientes.length}/169 — Pendientes: ${pendientes.length}`,
  "",
  ...pendientes.map((p) => "- " + p),
  ""
].join("\n");
await writeFile(path.join(FRAGS, "_pendientes.md"), md, "utf8");

console.log(`Fragmentos: ${archivos.join(", ")}`);
console.log(`Asignaturas rellenadas: ${aplicadas} (version del seed -> ${seed.version})`);
console.log(`Pendientes sin contenido: ${pendientes.length} (lista en contenido_fragmentos/_pendientes.md)`);
if (conflictos.length) console.log("\nConflictos resueltos (gana el video mas nuevo):\n  - " + conflictos.join("\n  - "));
if (avisos.length) console.log("\nAvisos:\n  - " + avisos.join("\n  - "));
