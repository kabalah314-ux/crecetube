// T012 — Extrae metadatos y transcripciones de los videos de YouTube aportados por el usuario
// y los guarda en app/guia_maestra/transcripciones/ (carpeta fuera de git, material de trabajo).
// Uso: node scripts/extraer-transcripciones.mjs [videoId ...]  (sin args usa la tanda 1)

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TANDA_1 = [
  "j9egqbiinNg", "T96etud4TIA", "okgJEBSt8Uw", "1IjW1pZMbHg", "3otpxces3JM",
  "_vEvd3dTR2o", "4BTwZXyMPuY", "oPgQjZB79vI", "YsNWjMXcSPE", "vcAcobgcxLw",
  "NhP-CpYL2YU", "-F9ImCYPt54", "lQZinh2eZ1E", "l3X96Jz3-jQ", "WqjPo9pl7wU",
  "X9aiT7a_AUI", "ZWTY9wh5Zfg", "5Lel-0zbskw", "pchYeK591DM"
];
const IDS = process.argv.length > 2 ? process.argv.slice(2) : TANDA_1;

const DEST = path.resolve("app/guia_maestra/transcripciones");
const UA_WEB =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

async function player(id) {
  const r = await fetch("https://www.youtube.com/youtubei/v1/player", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip"
    },
    body: JSON.stringify({
      context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30, hl: "es" } },
      videoId: id
    })
  });
  return r.json();
}

async function fechaPublicacion(id, data) {
  const mf = data?.microformat?.playerMicroformatRenderer;
  if (mf?.publishDate) return mf.publishDate.slice(0, 10);
  if (mf?.uploadDate) return mf.uploadDate.slice(0, 10);
  try {
    const html = await (
      await fetch(`https://www.youtube.com/watch?v=${id}&hl=es`, {
        headers: { "user-agent": UA_WEB, "accept-language": "es-ES,es;q=0.9", cookie: "SOCS=CAI" }
      })
    ).text();
    const m = html.match(/"(?:publishDate|uploadDate)":"([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    if (m) return m[1];
  } catch {
    /* la fecha es deseable, no imprescindible */
  }
  return null;
}

function elegirPista(tracks) {
  return (
    tracks.find((t) => t.languageCode.startsWith("es") && t.kind !== "asr") ??
    tracks.find((t) => t.languageCode.startsWith("es")) ??
    tracks[0]
  );
}

async function transcripcion(track) {
  // Reintentos con espera creciente: YouTube limita el endpoint de subtitulos si hay muchas peticiones
  const esperas = [0, 30_000, 60_000, 120_000, 240_000];
  let xml = "";
  for (const espera of esperas) {
    if (espera) {
      process.stdout.write(`[limite de peticiones, reintento en ${espera / 1000}s] `);
      await new Promise((res) => setTimeout(res, espera));
    }
    xml = await (
      await fetch(track.baseUrl, { headers: { "user-agent": UA_WEB, "accept-language": "es-ES,es;q=0.9" } })
    ).text();
    if (!/automated queries|unusual traffic/i.test(xml)) break;
  }
  if (/automated queries|unusual traffic/i.test(xml)) throw new Error("rate limit persistente en subtitulos");
  const parts = [...xml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim())
    .filter(Boolean);
  // lineas de ~10 segmentos para que el archivo sea legible con herramientas de lectura
  const lineas = [];
  for (let i = 0; i < parts.length; i += 10) lineas.push(parts.slice(i, i + 10).join(" "));
  return lineas.join("\n");
}

await mkdir(DEST, { recursive: true });
const indice = [];
for (const id of IDS) {
  process.stdout.write(id + " ... ");
  try {
    const data = await player(id);
    const det = data?.videoDetails;
    const status = data?.playabilityStatus?.status;
    if (!det || (status && status !== "OK")) {
      indice.push({ id, estado: "no_disponible", detalle: status ?? "sin videoDetails" });
      console.log("NO DISPONIBLE (" + (status ?? "?") + ")");
      continue;
    }
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) {
      indice.push({ id, titulo: det.title, canal: det.author, estado: "sin_subtitulos" });
      console.log("SIN SUBTITULOS - " + det.title.slice(0, 50));
      continue;
    }
    const pista = elegirPista(tracks);
    const texto = await transcripcion(pista);
    const fecha = await fechaPublicacion(id, data);
    const palabras = texto.split(/\s+/).length;
    const min = Math.round(Number(det.lengthSeconds ?? 0) / 60);
    const cab = [
      "TITULO: " + det.title,
      "CANAL: " + det.author,
      "FECHA: " + (fecha ?? "desconocida"),
      "DURACION_MIN: " + min,
      "URL: https://www.youtube.com/watch?v=" + id,
      "PISTA: " + pista.languageCode + (pista.kind === "asr" ? " (auto)" : " (manual)"),
      "PALABRAS: " + palabras,
      "----"
    ].join("\n");
    await writeFile(path.join(DEST, id + ".txt"), cab + "\n" + texto + "\n", "utf8");
    indice.push({
      id,
      titulo: det.title,
      canal: det.author,
      fecha,
      duracion_min: min,
      palabras,
      pista: pista.languageCode + (pista.kind === "asr" ? "/auto" : ""),
      estado: "ok"
    });
    console.log("OK - " + det.title.slice(0, 60) + " [" + (fecha ?? "?") + ", " + palabras + " palabras]");
  } catch (e) {
    indice.push({ id, estado: "error", detalle: String(e?.message ?? e) });
    console.log("ERROR: " + (e?.message ?? e));
  }
  await new Promise((res) => setTimeout(res, 400));
}
await writeFile(path.join(DEST, "_indice.json"), JSON.stringify(indice, null, 2), "utf8");
const ok = indice.filter((v) => v.estado === "ok").length;
console.log("\nResumen: " + ok + "/" + IDS.length + " transcripciones OK. Indice en _indice.json");
