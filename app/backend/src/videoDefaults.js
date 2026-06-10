// videoDefaults.js — VideoProject recién creado (03 §3.5) + máquina de estados (01 §1.6).
import { uuid, nowIso } from "./util.js";

export const ESTADOS = [
  "idea",
  "investigacion",
  "guion",
  "grabacion",
  "edicion",
  "publicado",
  "optimizacion",
  "archivado",
];

export const ordenEstado = (e) => ESTADOS.indexOf(e);

export function nuevoVideo({ tituloIdea, nicho = "", tipo = "evergreen", formato = "long", descripcionCorta = "" }) {
  const now = nowIso();
  return {
    id: uuid(),
    tituloIdea,
    tituloFinal: null,
    titulosAlternativos: [],
    descripcionCorta,
    nicho,
    tipo,
    estado: "idea",
    formato,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    archivedAt: null,
    palabrasClave: [],
    seoPreguntas: [],
    competenciaRefs: [],
    estrategiasAplicadas: [],
    guion: {
      seoInicio: "",
      seoLoop: "",
      seoShock: "",
      desarrollo: [],
      seoResultado: "",
      cliffhanger: null,
      psicoCta: "",
      duracionTotalEstimadaSeg: 0,
    },
    miniatura: {
      estrategia: null,
      palabrasMiniatura: "",
      briefIA: null,
      urlPrincipal: null,
      urlsAlternativas: [],
    },
    descripcionPublicada: "",
    hashtags: { descripcion: [], titulo: [], geolocalizacion: null },
    timestamps: [],
    listaReproduccionNombre: null,
    comentarioFijado: null,
    pantallasFinales: { configuracion: "binaria", elementos: [] },
    tarjetas: [],
    checklistEstado: {},
    difusion: {
      emailEnviado: false,
      postComunidad: { enviado: false, tipo: null, contenido: "" },
      redesCompartido: { instagram: false, twitter: false, tiktok: false, otros: [] },
      adsActivados: false,
      plataformasAds: [],
    },
    metricasIds: [],
    notas: "",
    seoHora: { diaSemana: null, horaPublicacion: null },
  };
}

// Validaciones duras de 03 §3.1.2 sobre el documento completo (tras merge).
export function validarVideo(v) {
  const errors = [];
  const push = (campo, mensaje) => errors.push({ campo, mensaje });

  if (!v.tituloIdea || v.tituloIdea.length > 200) push("tituloIdea", "Obligatorio, 1-200 caracteres");
  if (v.tituloFinal !== null && (v.tituloFinal.length < 1 || v.tituloFinal.length > 100))
    push("tituloFinal", "Entre 1 y 100 caracteres (límite YouTube)");
  if (v.descripcionPublicada.length > 5000) push("descripcionPublicada", "Máximo 5000 caracteres");
  if (v.palabrasClave.length > 15) push("palabrasClave", "Máximo 15");
  if (v.seoPreguntas.length > 10) push("seoPreguntas", "Máximo 10");
  if (v.titulosAlternativos.length > 9) push("titulosAlternativos", "Máximo 9");
  if (v.hashtags.descripcion.length > 15) push("hashtags.descripcion", "Máximo 15");
  if (v.hashtags.titulo.length > 1) push("hashtags.titulo", "Máximo 1");
  for (const tag of [...v.hashtags.descripcion, ...v.hashtags.titulo]) {
    if (!/^#[^\s#]+$/.test(tag)) push("hashtags", `"${tag}" debe empezar por # y no llevar espacios`);
  }
  if (v.timestamps.length > 0 && v.timestamps[0].tiempo !== "00:00")
    push("timestamps", 'El primer capítulo debe ser "00:00" (YouTube lo exige)');
  for (const ts of v.timestamps) {
    if (!/^\d{1,3}:\d{2}$/.test(ts.tiempo)) push("timestamps", `"${ts.tiempo}" no tiene formato MM:SS`);
  }
  if (v.tarjetas.length > 5) push("tarjetas", "Máximo 5 tarjetas (límite YouTube)");
  const momentos = v.tarjetas.map((t) => t.momentoSegundos).sort((a, b) => a - b);
  for (const m of momentos) {
    if (m < 60) push("tarjetas", "Ninguna tarjeta en el primer minuto (02 §2.4.8)");
  }
  for (let i = 1; i < momentos.length; i++) {
    if (momentos[i] - momentos[i - 1] < 120) push("tarjetas", "Distancia mínima entre tarjetas: 2 minutos");
  }
  if (!ESTADOS.includes(v.estado)) push("estado", `Estado desconocido: ${v.estado}`);
  return errors;
}
