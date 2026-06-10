// build_seeds.mjs — Genera los seeds JSON desde los markdown de la guía maestra.
// Uso: node scripts/build_seeds.mjs  (desde la raíz del repo)
// Salidas: app/guia_maestra/07_curso_seed.json y app/guia_maestra/05_plantillas_seed.json

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const GUIA = resolve(ROOT, "app", "guia_maestra");

// ---------------------------------------------------------------- 07 CURSO
function buildCurso() {
  const md = readFileSync(resolve(GUIA, "07_ESQUELETO_CURSO.md"), "utf8");

  // Tabla 7.1: | `s1` | Primeros pasos en YouTube | pasos | 9 | `--family-pasos` |
  const meta = {};
  for (const m of md.matchAll(/^\|\s*`(s\d+)`\s*\|\s*([^|]+?)\s*\|\s*(\w+)\s*\|\s*\d+\s*\|\s*`(--family-[\w-]+)`\s*\|/gm)) {
    meta[m[1]] = { titulo: m[2], familia: m[3], colorToken: m[4] };
  }

  // Secciones: ### s1 — Título   (+ blurb en la línea "> ..." siguiente)
  const secciones = [];
  const sectionRe = /^### (s\d+) — (.+)$/gm;
  const blocks = [];
  let sm;
  while ((sm = sectionRe.exec(md)) !== null) blocks.push({ id: sm[1], titulo: sm[2].trim(), start: sm.index });
  blocks.forEach((b, i) => (b.end = i + 1 < blocks.length ? blocks[i + 1].start : md.indexOf("## 7.3")));

  for (const b of blocks) {
    const chunk = md.slice(b.start, b.end);
    const blurb = chunk.match(/^> (.+)$/m)?.[1]?.trim() ?? "";
    const asignaturas = [];
    // | `s1_a1` | Título | 8 min | `tpl_x` o — |
    for (const m of chunk.matchAll(/^\|\s*`(s\d+_a\d+)`\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*min\s*\|\s*([^|]+?)\s*\|/gm)) {
      const tplRaw = m[4].trim();
      const tpl = tplRaw.match(/`(tpl_[\w]+)`/)?.[1] ?? null;
      asignaturas.push({
        id: m[1],
        titulo: m[2].trim(),
        duracionEstimadaMin: Number(m[3]),
        plantillaRelacionadaId: tpl,
        contenido: "",
        recursoExtra: null,
        videoReferencia: null,
        completadoPorDefecto: false,
      });
    }
    const info = meta[b.id] ?? {};
    secciones.push({
      id: b.id,
      titulo: info.titulo ?? b.titulo,
      descripcion: blurb,
      familia: info.familia ?? null,
      colorToken: info.colorToken ?? null,
      asignaturas,
    });
  }

  const total = secciones.reduce((n, s) => n + s.asignaturas.length, 0);
  return { version: 1, generadoDesde: "07_ESQUELETO_CURSO.md", totalSecciones: secciones.length, totalAsignaturas: total, secciones };
}

// ---------------------------------------------------------- 05 PLANTILLAS
function buildPlantillas() {
  const md = readFileSync(resolve(GUIA, "05_PLANTILLAS.md"), "utf8");

  // Índice 5.1: | `tpl_x` | Nombre | tipo | sX |
  const index = {};
  for (const m of md.matchAll(/^\|\s*`(tpl_\w+)`\s*\|\s*([^|]+?)\s*\|\s*(\w+)\s*\|\s*(s\d+)\s*\|/gm)) {
    index[m[1]] = { nombre: m[2], tipo: m[3], seccion: m[4] };
  }

  const plantillas = [];
  // Bloques ```yaml ... ``` con posible heading previo ### `tpl_x`
  const fenceRe = /```yaml\n([\s\S]*?)```/g;
  let fm;
  while ((fm = fenceRe.exec(md)) !== null) {
    const body = fm[1];
    const before = md.slice(Math.max(0, fm.index - 400), fm.index);
    const headingId = [...before.matchAll(/###[^\n]*`(tpl_\w+)`/g)].pop()?.[1] ?? null;

    const get = (k) => body.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? null;
    const id = get("id") ?? headingId;
    if (!id) continue;
    const idx = index[id] ?? {};
    const nombre = get("nombre") ?? idx.nombre ?? id;
    const tipo = get("tipo") ?? idx.tipo ?? "descripcion";
    const seccion = get("seccionRelacionadaId") ?? idx.seccion ?? null;

    // contenido: | → líneas siguientes con indentación de 2 espacios
    let contenido = "";
    const cm = body.match(/^contenido: \|\n([\s\S]*)$/m);
    if (cm) {
      contenido = cm[1]
        .split("\n")
        .map((l) => (l.startsWith("  ") ? l.slice(2) : l))
        .join("\n")
        .replace(/\n+$/, "");
    }

    // variablesDinamicas declaradas
    const vars = [];
    for (const vm of body.matchAll(/- \{ nombre: ([^,]+), descripcion: "([^"]*)", valorPorDefecto: "([^"]*)", tipo: (\w+) \}/g)) {
      vars.push({ nombre: vm[1].trim(), descripcion: vm[2], valorPorDefecto: vm[3], tipo: vm[4] });
    }
    // variables usadas en el contenido pero no declaradas → derivarlas
    const declared = new Set(vars.map((v) => v.nombre));
    for (const um of contenido.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)) {
      const n = um[1];
      if (!declared.has(n)) {
        declared.add(n);
        vars.push({
          nombre: n,
          descripcion: "",
          valorPorDefecto: "",
          tipo: /url/i.test(n) ? "url" : "texto",
        });
      }
    }

    plantillas.push({
      id,
      nombre,
      tipo,
      contenido,
      variablesDinamicas: vars,
      seccionRelacionadaId: seccion,
      esEditable: false,
      esPrecargada: true,
    });
  }

  // dedupe por id conservando el primero
  const seen = new Set();
  const unique = plantillas.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  return { version: 1, generadoDesde: "05_PLANTILLAS.md", total: unique.length, plantillas: unique };
}

// ------------------------------------------------------------------- MAIN
const curso = buildCurso();
const plantillas = buildPlantillas();

writeFileSync(resolve(GUIA, "07_curso_seed.json"), JSON.stringify(curso, null, 2) + "\n", "utf8");
writeFileSync(resolve(GUIA, "05_plantillas_seed.json"), JSON.stringify(plantillas, null, 2) + "\n", "utf8");

console.log(`curso:      ${curso.totalSecciones} secciones, ${curso.totalAsignaturas} asignaturas`);
console.log(`plantillas: ${plantillas.total}`);
for (const p of plantillas.plantillas) {
  if (!p.contenido) console.warn(`  AVISO: ${p.id} sin contenido`);
}
if (curso.totalAsignaturas !== 169) console.warn(`  AVISO: se esperaban 169 asignaturas, hay ${curso.totalAsignaturas}`);
if (plantillas.total !== 25) console.warn(`  AVISO: se esperaban 25 plantillas, hay ${plantillas.total}`);
