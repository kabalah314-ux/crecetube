// routes/plantillas.js — 03 §3.2.4. Aplicar variables, descarga md/txt/pdf, protección precargadas.
import { Router } from "express";
import PDFDocument from "pdfkit";
import { ApiError, h, notFound } from "../errors.js";
import { jparse } from "../db.js";
import { nowIso, uuid } from "../util.js";

// Las fuentes estándar del PDF (Helvetica) solo cubren WinAnsi: estos caracteres
// extra sí están (CP1252 0x80-0x9F, en escapes para evitar problemas de comillas);
// el resto se transcribe a ASCII o se omite (emojis).
const WINANSI_EXTRA = new Set(
  "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"
);
const TRANSCRIPCION_PDF = { "→": "->", "➡": "->", "←": "<-", "≤": "<=", "≥": ">=", "━": "-", "─": "-", "✓": "[x]", "✗": "[ ]" };
const textoPdf = (s) =>
  String(s).replace(/[^\x00-\xFF]/gu, (c) => (WINANSI_EXTRA.has(c) ? c : (TRANSCRIPCION_PDF[c] ?? "")));

const TIPOS = [
  "descripcion", "titulo", "miniatura_brief", "guion", "email", "comunidad",
  "pantalla_final", "tarjeta", "checklist", "banner", "trailer",
];

const get = async (db, id) => {
  const t = jparse(await db.get("SELECT data FROM templates WHERE id=?", [id]));
  if (!t) throw notFound("Plantilla", "TEMPLATE_NOT_FOUND");
  return t;
};

const save = (db, t) =>
  db.run("INSERT OR REPLACE INTO templates(id,data,tipo,esPrecargada) VALUES(?,?,?,?)", [
    t.id,
    JSON.stringify(t),
    t.tipo,
    t.esPrecargada ? 1 : 0,
  ]);

// Resuelve {variables}; las no provistas se quedan visibles como {nombre} (08 §8.6).
export function aplicarVariables(contenido, variables = {}) {
  return contenido.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (m, nombre) =>
    Object.prototype.hasOwnProperty.call(variables, nombre) && String(variables[nombre]).length > 0
      ? String(variables[nombre])
      : m
  );
}

const router = Router();

router.get("/", h(async (req, res) => {
  let rows = (await req.app.locals.db.all("SELECT data FROM templates")).map(jparse);
  if (req.query.tipo) rows = rows.filter((t) => t.tipo === req.query.tipo);
  rows.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  res.json(rows);
}));

router.get("/:id", h(async (req, res) => {
  res.json(await get(req.app.locals.db, req.params.id));
}));

router.post("/", h(async (req, res) => {
  const db = req.app.locals.db;
  const { nombre, tipo, contenido, variablesDinamicas, seccionRelacionadaId, duplicaDe } = req.body ?? {};

  if (duplicaDe) {
    const orig = await get(db, duplicaDe);
    const copia = {
      ...structuredClone(orig),
      id: uuid(),
      nombre: `Copia de ${orig.nombre}`,
      esEditable: true,
      esPrecargada: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await save(db, copia);
    return res.status(201).json(copia);
  }

  if (!nombre || !TIPOS.includes(tipo) || typeof contenido !== "string")
    throw new ApiError("VALIDATION_ERROR", 422, "Se espera { nombre, tipo válido, contenido }");
  const t = {
    id: uuid(),
    nombre,
    tipo,
    contenido,
    variablesDinamicas: Array.isArray(variablesDinamicas) ? variablesDinamicas : [],
    seccionRelacionadaId: seccionRelacionadaId ?? null,
    esEditable: true,
    esPrecargada: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await save(db, t);
  res.status(201).json(t);
}));

router.patch("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const t = await get(db, req.params.id);
  if (!t.esEditable) throw new ApiError("TEMPLATE_NOT_EDITABLE", 403, "Las plantillas precargadas no se editan: duplícala");
  const { nombre, contenido, variablesDinamicas, seccionRelacionadaId, tipo } = req.body ?? {};
  if (nombre !== undefined) t.nombre = nombre;
  if (contenido !== undefined) t.contenido = contenido;
  if (variablesDinamicas !== undefined) t.variablesDinamicas = variablesDinamicas;
  if (seccionRelacionadaId !== undefined) t.seccionRelacionadaId = seccionRelacionadaId;
  if (tipo !== undefined && TIPOS.includes(tipo)) t.tipo = tipo;
  t.updatedAt = nowIso();
  await save(db, t);
  res.json(t);
}));

router.delete("/:id", h(async (req, res) => {
  const db = req.app.locals.db;
  const t = await get(db, req.params.id);
  if (t.esPrecargada) throw new ApiError("TEMPLATE_NOT_EDITABLE", 403, "Las plantillas precargadas no se eliminan");
  await db.run("DELETE FROM templates WHERE id=?", [t.id]);
  res.json({ ok: true, id: t.id });
}));

router.post("/:id/aplicar", h(async (req, res) => {
  const t = await get(req.app.locals.db, req.params.id);
  res.json({ texto: aplicarVariables(t.contenido, req.body?.variables ?? {}) });
}));

router.get("/:id/descargar", h(async (req, res) => {
  const t = await get(req.app.locals.db, req.params.id);
  const formato = req.query.formato ?? "md";
  if (formato !== "md" && formato !== "txt" && formato !== "pdf")
    throw new ApiError("VALIDATION_ERROR", 422, "Formato no soportado: usa md, txt o pdf");
  let variables = {};
  try {
    if (req.query.variables) variables = JSON.parse(String(req.query.variables));
  } catch {
    throw new ApiError("VALIDATION_ERROR", 422, "El parámetro variables debe ser JSON");
  }
  const texto = aplicarVariables(t.contenido, variables);
  const slug = t.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

  if (formato === "pdf") {
    res
      .set("Content-Type", "application/pdf")
      .set("Content-Disposition", `attachment; filename="${slug}.pdf"`);
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: { Title: t.nombre, Author: "CRECETUBE Assistant" },
    });
    doc.pipe(res);
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#1a1a1a").text(textoPdf(t.nombre));
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(9).fillColor("#777777").text(`Plantilla CRECETUBE · tipo: ${t.tipo}`);
    doc.moveDown(1);
    doc.font("Helvetica").fontSize(11).fillColor("#1a1a1a").text(textoPdf(texto), { lineGap: 3 });
    doc.end();
    return;
  }

  res
    .set("Content-Type", formato === "md" ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8")
    .set("Content-Disposition", `attachment; filename="${slug}.${formato}"`)
    .send(texto);
}));

export default router;
