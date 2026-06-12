// demoSeed.js — datos de muestra para la cuenta demo (T023).
// Nicho de ejemplo: "cocina rápida para gente sin tiempo". Canal principal "Recetas en 15".
// Estructura de vídeos: la REAL de videoDefaults.js (nuevoVideo + overrides), nunca campos inventados.
import { cfg } from "./config.js";
import { nuevoVideo } from "./videoDefaults.js";
import { nowIso, uuid } from "./util.js";

const DIA_MS = 24 * 60 * 60 * 1000;
const haceDias = (n) => new Date(Date.now() - n * DIA_MS).toISOString();
const fechaHaceDias = (n) => haceDias(n).slice(0, 10);

// Snapshot con la misma forma que crea routes/metricas.js.
function snapshot(videoId, dias, fechaDiasAtras, datos) {
  return {
    id: uuid(),
    videoProjectId: videoId,
    fecha: fechaHaceDias(fechaDiasAtras),
    diasDesdePublicacion: dias,
    vistas: datos.vistas,
    impresiones: datos.impresiones,
    ctr: datos.ctr,
    retencionMediaPct: datos.retencionMediaPct,
    duracionMediaSeg: datos.duracionMediaSeg ?? 0,
    velocidadVisualizacion: Number((datos.vistas / Math.max(dias, 1)).toFixed(2)),
    suscriptoresGanados: datos.suscriptoresGanados ?? 0,
    comentarios: datos.comentarios ?? 0,
    likes: datos.likes ?? 0,
    ingresosEstimados: datos.ingresosEstimados ?? null,
    rpm: datos.rpm ?? null,
    notas: datos.notas ?? "",
  };
}

const NICHO = "cocina rápida para gente sin tiempo";

function construirPerfil() {
  const now = nowIso();
  return {
    id: uuid(),
    canalNombre: "Recetas en 15",
    canalUrl: "https://www.youtube.com/@recetasen15",
    nicho: NICHO,
    nivel: "intermedio",
    frecuenciaObjetivo: "semanal",
    objetivoPrincipal: "suscriptores",
    idioma: "es",
    tieneCanalYa: true,
    gestionMulticanal: true,
    preferenciasUi: { tema: "dark", densidad: "comoda", sonidos: false },
    iaConfig: {
      proveedor: cfg.LLM_PROVIDER,
      modelo: cfg.LLM_MODEL,
      apiKey: cfg.LLM_API_KEY,
      baseUrl: cfg.LLM_BASE_URL,
      temperatura: 0.7,
    },
    createdAt: now,
    updatedAt: now,
  };
}

// Vídeo 1 — PUBLICADO hace ~20 días, ciclo completo con difusión y descripción.
function videoPublicado(canalId) {
  const v = nuevoVideo({
    tituloIdea: "Cenas en 15 minutos para toda la semana",
    nicho: NICHO,
    tipo: "mixto",
    descripcionCorta: "Cinco cenas reales que salen en 15 minutos cronometrados, con la lista de la compra incluida.",
  });
  v.canalId = canalId;
  v.estado = "publicado";
  v.createdAt = haceDias(27);
  v.updatedAt = haceDias(2);
  v.publishedAt = haceDias(20);
  v.tituloFinal = "5 cenas en 15 minutos con 6 ingredientes (sin horno)";
  v.titulosAlternativos = [
    "Cenas rápidas: 5 recetas en 15 minutos de verdad",
    "6 ingredientes y 15 minutos: el plan de cenas que me salvó",
    "Qué cenar hoy: 5 ideas exprés sin encender el horno",
  ];
  v.palabrasClave = ["cenas en 15 minutos", "cenas rápidas y fáciles", "recetas para la semana", "qué cenar hoy"];
  v.seoPreguntas = [
    "¿Qué puedo cenar hoy rápido y sano?",
    "¿Cómo organizar las cenas de toda la semana sin pasar la tarde en la cocina?",
    "¿Qué recetas salen en menos de 15 minutos de verdad?",
  ];
  v.competenciaRefs = [
    { url: "https://www.youtube.com/watch?v=demo-cenas-1", notas: "Promete 10 minutos pero usa 18 ingredientes: nuestro ángulo es cronometrar en cámara." },
    { url: "https://www.youtube.com/watch?v=demo-cenas-2", notas: "Buen CTR con miniatura de plato terminado + número grande. Replicar con SEOmarco amarillo." },
  ];
  v.estrategiasAplicadas = ["SEOmarco", "SEOshock", "cliffhanger"];
  v.guion = {
    seoInicio: "Si llegas a casa a las nueve y lo último que quieres es cocinar, este vídeo es tu plan: cinco cenas en 15 minutos cronometrados, con seis ingredientes como máximo.",
    seoLoop: "Y al final te enseño el truco del domingo que hace que las cinco salgan todavía más rápido.",
    seoShock: "La tercera receta la cronometro en cámara: si me paso de 15 minutos, la elimino del vídeo. Sin trampas.",
    desarrollo: [
      { titulo: "Pasta cremosa de atún", duracionSegundos: 90, contenido: "Mientras hierve la pasta se hace la salsa: atún, nata ligera y una cucharada del agua de cocción. Plato completo en lo que tarda el hervor.", roturaPatron: false, seoReset: false, seoZoom: true },
      { titulo: "Tortilla rellena exprés (cronometrada)", duracionSegundos: 120, contenido: "Aquí va el cronómetro en pantalla. Rotura de patrón: cambio de plano cenital y cuenta atrás sonando.", roturaPatron: true, seoReset: false, seoZoom: false },
      { titulo: "Salteado de garbanzos de bote", duracionSegundos: 95, contenido: "Garbanzos cocidos, espinacas y pimentón. SEOreset: repaso en 10 segundos de las tres recetas que llevamos.", roturaPatron: false, seoReset: true, seoZoom: false },
    ],
    seoResultado: "Cinco cenas, ningún horno y la compra entera por menos de lo que cuesta pedir a domicilio una sola noche.",
    cliffhanger: "La semana que viene: desayunos para llevar que preparas el domingo en una hora.",
    psicoCta: "Si esta semana cenas mejor con esto, suscríbete: cada jueves hay un plan nuevo de 15 minutos.",
    duracionTotalEstimadaSeg: 480,
  };
  v.miniatura = {
    estrategia: "SEOmarco",
    palabrasMiniatura: "15 MINUTOS REALES",
    briefIA: "Marco amarillo grueso (20 px). Plato terminado humeante a la derecha, cronómetro grande a la izquierda. Texto: 15 MINUTOS REALES en blanco con borde negro.",
    urlPrincipal: null,
    urlsAlternativas: [],
  };
  v.descripcionPublicada =
    "Cenas en 15 minutos de verdad: en este vídeo preparo 5 cenas rápidas y fáciles con 6 ingredientes como máximo, sin horno y cronometradas en cámara.\n\n" +
    "Lista de la compra completa y trucos para que salgan a la primera:\n" +
    "1. Pasta cremosa de atún\n2. Tortilla rellena exprés\n3. Salteado de garbanzos de bote\n4. Quesadillas de pollo asado\n5. Crema de calabacín al microondas\n\n" +
    "Cada jueves publico un plan nuevo para cenar bien aunque llegues tarde a casa.\n\n#cenasrapidas #recetasfaciles #cocinafacil";
  v.hashtags = { descripcion: ["#cenasrapidas", "#recetasfaciles", "#cocinafacil"], titulo: [], geolocalizacion: null };
  v.timestamps = [
    { tiempo: "00:00", titulo: "El plan de la semana" },
    { tiempo: "01:10", titulo: "Pasta cremosa de atún" },
    { tiempo: "02:45", titulo: "Tortilla exprés cronometrada" },
    { tiempo: "04:30", titulo: "Garbanzos salteados" },
    { tiempo: "06:00", titulo: "El truco del domingo" },
  ];
  v.listaReproduccionNombre = "Cenas en 15 minutos";
  v.comentarioFijado = "¿Cuál vas a probar esta semana? Te leo y la más votada tendrá versión ampliada.";
  v.pantallasFinales = {
    configuracion: "binaria",
    elementos: [
      { tipo: "video", destino: "Batch cooking para principiantes", posicion: "izq" },
      { tipo: "suscripcion", destino: "", posicion: "der" },
    ],
  };
  v.tarjetas = [{ tipo: "SEOjeta", momentoSegundos: 185, destino: "Batch cooking para principiantes", cta: "El truco completo del domingo, aquí" }];
  v.difusion = {
    emailEnviado: true,
    postComunidad: { enviado: true, tipo: "SEOlaunch", contenido: "Ya está fuera el plan de cenas de esta semana: 5 recetas, 15 minutos, 0 hornos. ¿Cuál pruebas primero?" },
    redesCompartido: { instagram: true, twitter: true, tiktok: false, otros: [] },
    adsActivados: false,
    plataformasAds: [],
  };
  v.checklistEstado = {
    idea: { "idea-validada-3-fuentes": true },
    investigacion: { "demanda-validada": true, "angulo-diferencial-definido": true },
    titulo: { "hashtag-titulo-decidido": true },
    miniatura: { "alternativa-ab-creada": true, "test-grilla-superado": true },
    guion: { "cliffhanger-decidido": true },
    grabacion: { "lugar-preparado": true, "vestuario-decidido": true, "broll-listado": true, "audio-verificado": true, "iluminacion-verificada": true, "energia-camara": true, "material-grabado": true, "broll-grabado": true },
    edicion: { "corte-general-hecho": true, "roturas-patron-aplicadas": true, "seozoom-aplicado": true, "seoreset-aplicado": true, "audio-normalizado": true, "subtitulos-revisados": true, "ultimo-frame-reservado": true, "render-exportado": true },
    publicacion: { "checklist-prepublicacion-repasada": true, "video-subido-youtube": true },
    sprint: { "sin-cambios-24h": true, "comentarios-dia1-respondidos": true, "snapshot-dia2": true, "seorepesca-publicada": true, "snapshot-dia4": true, "ctr-evaluado": true, "snapshot-dia7": true, "aprendizajes-anotados": true },
  };
  v.seoHora = { diaSemana: 4, horaPublicacion: "18:00" };
  v.notas = "El SEOshock del cronómetro funcionó: la retención aguanta hasta el minuto 4. Repetir el formato en el próximo plan.";
  return v;
}

// Vídeo 2 — SPRINT día 3: publicado hace 3 días, difusión a medias.
function videoSprint(canalId) {
  const v = nuevoVideo({
    tituloIdea: "Desayunos para llevar (meal prep exprés)",
    nicho: NICHO,
    tipo: "sprint",
    descripcionCorta: "Tres desayunos que se preparan el domingo en una hora y aguantan toda la semana en la nevera.",
  });
  v.canalId = canalId;
  v.estado = "publicado";
  v.createdAt = haceDias(10);
  v.updatedAt = haceDias(1);
  v.publishedAt = haceDias(3);
  v.tituloFinal = "3 desayunos para llevar que preparas el domingo";
  v.titulosAlternativos = [
    "Desayunos para llevar: una hora el domingo, semana resuelta",
    "Meal prep de desayunos para gente sin tiempo",
    "Deja de saltarte el desayuno: 3 ideas para llevar",
  ];
  v.palabrasClave = ["desayunos para llevar", "meal prep desayuno", "desayunos rápidos"];
  v.seoPreguntas = [
    "¿Qué desayunar cuando no hay tiempo por la mañana?",
    "¿Cuántos días aguanta un overnight oats en la nevera?",
  ];
  v.guion.seoInicio = "Una hora del domingo y no vuelves a salir de casa sin desayunar en toda la semana. Tres recetas, tres tuppers, cero excusas.";
  v.guion.seoShock = "El tercero cuesta menos de un euro por ración. Lo he calculado tique en mano.";
  v.guion.desarrollo = [
    { titulo: "Overnight oats de cacao", duracionSegundos: 100, contenido: "Avena, leche, cacao y plátano. Se monta en capas y la nevera trabaja por ti.", roturaPatron: false, seoReset: false, seoZoom: true },
    { titulo: "Mini frittatas al horno", duracionSegundos: 110, contenido: "Molde de magdalenas, huevo batido y lo que haya en la nevera. Rotura de patrón: plano rápido del precio por ración.", roturaPatron: true, seoReset: false, seoZoom: false },
  ];
  v.guion.seoResultado = "Tres tuppers listos, menos de cinco euros y ninguna mañana más con el estómago vacío.";
  v.guion.psicoCta = "Cuéntame en comentarios cuál te llevas mañana y te respondo con una variante.";
  v.guion.duracionTotalEstimadaSeg = 420;
  v.miniatura = {
    estrategia: "SEOmarco",
    palabrasMiniatura: "1 HORA, 5 DÍAS",
    briefIA: "Marco amarillo de serie. Tres tuppers en fila, mano cogiendo el primero. Texto: 1 HORA, 5 DÍAS.",
    urlPrincipal: null,
    urlsAlternativas: [],
  };
  v.descripcionPublicada =
    "Desayunos para llevar con meal prep exprés: tres recetas que preparas el domingo en una hora y desayunas toda la semana.\n\n" +
    "Con cantidades exactas, precio por ración y cuántos días aguanta cada una en la nevera.\n\n#mealprep #desayunossaludables #recetasfaciles";
  v.hashtags = { descripcion: ["#mealprep", "#desayunossaludables", "#recetasfaciles"], titulo: [], geolocalizacion: null };
  v.timestamps = [
    { tiempo: "00:00", titulo: "El plan del domingo" },
    { tiempo: "01:05", titulo: "Overnight oats de cacao" },
    { tiempo: "03:00", titulo: "Mini frittatas" },
  ];
  v.listaReproduccionNombre = "Desayunos sin excusas";
  v.comentarioFijado = "¿Equipo dulce o equipo salado? El ganador decide el próximo vídeo de la serie.";
  v.difusion = {
    emailEnviado: true,
    postComunidad: { enviado: true, tipo: "SEOlaunch", contenido: "Nuevo vídeo: 3 desayunos para llevar. El domingo cocinas una hora, el resto de la semana solo abres la nevera." },
    redesCompartido: { instagram: true, twitter: false, tiktok: false, otros: [] },
    adsActivados: false,
    plataformasAds: [],
  };
  v.checklistEstado = {
    idea: { "idea-validada-3-fuentes": true },
    investigacion: { "demanda-validada": true, "angulo-diferencial-definido": true },
    titulo: { "hashtag-titulo-decidido": true },
    miniatura: { "alternativa-ab-creada": true, "test-grilla-superado": true },
    guion: { "cliffhanger-decidido": true },
    publicacion: { "checklist-prepublicacion-repasada": true, "video-subido-youtube": true },
    sprint: { "sin-cambios-24h": true, "comentarios-dia1-respondidos": true, "snapshot-dia2": true },
  };
  v.seoHora = { diaSemana: 0, horaPublicacion: "10:00" };
  v.notas = "Sprint en marcha: queda la SEOrepesca del día 3 y el snapshot del día 4-5.";
  return v;
}

// Vídeo 3 — GUION a medias.
function videoGuion(canalId) {
  const v = nuevoVideo({
    tituloIdea: "Errores al congelar comida que arruinan el sabor",
    nicho: NICHO,
    tipo: "evergreen",
    descripcionCorta: "Los siete errores más comunes al congelar táperes y cómo evitarlos para que el batch cooking sepa a recién hecho.",
  });
  v.canalId = canalId;
  v.estado = "guion";
  v.createdAt = haceDias(5);
  v.updatedAt = haceDias(1);
  v.tituloFinal = "7 errores al congelar comida (y cómo evitarlos)";
  v.titulosAlternativos = [
    "Congelar comida: lo que estás haciendo mal",
    "Por qué tu batch cooking sabe a nevera (7 errores)",
    "Errores al congelar que estropean cualquier receta",
  ];
  v.palabrasClave = ["congelar comida", "errores al congelar", "batch cooking"];
  v.seoPreguntas = [
    "¿Por qué la comida congelada pierde sabor?",
    "¿Qué alimentos no se deben congelar nunca?",
  ];
  v.guion.seoInicio = "Si tu batch cooking sabe a nevera, no es culpa de la receta: es de cómo congelas. Estos son los siete errores que lo estropean todo.";
  v.guion.seoShock = "El error número 5 lo comete hasta gente que lleva años cocinando, y se arregla con un gesto de dos segundos.";
  v.guion.desarrollo = [
    { titulo: "Errores 1-3: temperatura y prisa", duracionSegundos: 150, contenido: "Congelar en caliente, llenar el táper hasta arriba y no etiquetar con fecha. Demostración con dos táperes gemelos.", roturaPatron: false, seoReset: false, seoZoom: true },
  ];
  v.checklistEstado = {
    idea: { "idea-validada-3-fuentes": true },
    investigacion: { "demanda-validada": true },
    titulo: { "hashtag-titulo-decidido": true },
  };
  v.notas = "Pendiente: cerrar los errores 4-7, el SEOresultado y el PsicoCTA. Grabar los táperes gemelos antes del jueves.";
  return v;
}

// Vídeo 4 — IDEA recién creada.
function videoIdea(canalId) {
  const v = nuevoVideo({
    tituloIdea: "Menú semanal con 25 euros: compra y recetas",
    nicho: NICHO,
    tipo: "evergreen",
    descripcionCorta: "Reto: comer toda la semana con 25 euros. Compra real en el supermercado, tique en mano, y el menú completo día a día.",
  });
  v.canalId = canalId;
  v.createdAt = haceDias(1);
  v.updatedAt = haceDias(1);
  v.notas = "Idea del recomendador: validar con autocompletado antes de pasar a investigación.";
  return v;
}

// Vídeo 5 — Evergreen veterano (35+ días): en optimización, candidato a banner.
function videoEvergreen(canalId) {
  const v = nuevoVideo({
    tituloIdea: "Tupper de la semana: batch cooking básico",
    nicho: NICHO,
    tipo: "evergreen",
    descripcionCorta: "La guía de batch cooking para empezar: cinco platos base en dos horas de domingo, con tabla de conservación.",
  });
  v.canalId = canalId;
  v.estado = "optimizacion"; // publicado hace 40 días → transición automática a optimización
  v.createdAt = haceDias(48);
  v.updatedAt = haceDias(8);
  v.publishedAt = haceDias(40);
  v.tituloFinal = "Batch cooking para principiantes: 5 platos en 2 horas";
  v.titulosAlternativos = [
    "Batch cooking básico: tu primer domingo de táperes",
    "Cocina una vez, come toda la semana (guía completa)",
    "Batch cooking sin agobios para empezar hoy",
  ];
  v.palabrasClave = ["batch cooking", "batch cooking principiantes", "cocinar para toda la semana"];
  v.seoPreguntas = [
    "¿Cómo empezar a hacer batch cooking?",
    "¿Cuánto aguanta la comida preparada en la nevera?",
    "¿Qué platos congelan bien?",
  ];
  v.guion.seoInicio = "Dos horas el domingo y la semana entera resuelta: esto es batch cooking para gente que nunca lo ha hecho.";
  v.guion.seoShock = "Y no necesitas veinte táperes de cristal: con cinco vale, y te enseño exactamente cuáles.";
  v.guion.desarrollo = [
    { titulo: "La compra única", duracionSegundos: 120, contenido: "Lista cerrada de 18 ingredientes que dan para cinco platos distintos.", roturaPatron: false, seoReset: false, seoZoom: true },
    { titulo: "Las dos horas en marcha", duracionSegundos: 240, contenido: "Orden exacto: horno primero, fuegos después. Rotura de patrón con timelapse de la cocina.", roturaPatron: true, seoReset: true, seoZoom: false },
  ];
  v.guion.seoResultado = "Cinco platos, una tabla de conservación y la sensación de tener la semana ganada antes de que empiece.";
  v.guion.psicoCta = "Guárdate este vídeo para el domingo y cuéntame qué plato repites más.";
  v.guion.duracionTotalEstimadaSeg = 540;
  v.miniatura = {
    estrategia: "SEOmarco",
    palabrasMiniatura: "2 HORAS, 5 PLATOS",
    briefIA: "Marco amarillo. Encimera con cinco táperes alineados y reloj de cocina en primer plano. Texto: 2 HORAS, 5 PLATOS.",
    urlPrincipal: null,
    urlsAlternativas: [],
  };
  v.descripcionPublicada =
    "Batch cooking para principiantes paso a paso: cinco platos base en dos horas de domingo, con la compra exacta y la tabla de cuánto aguanta cada plato.\n\n" +
    "Ideal si quieres comer casero entre semana sin cocinar cada noche.\n\n#batchcooking #mealprep #cocinafacil";
  v.hashtags = { descripcion: ["#batchcooking", "#mealprep", "#cocinafacil"], titulo: [], geolocalizacion: null };
  v.timestamps = [
    { tiempo: "00:00", titulo: "Qué es el batch cooking" },
    { tiempo: "01:30", titulo: "La compra única" },
    { tiempo: "03:40", titulo: "Las dos horas en marcha" },
    { tiempo: "07:00", titulo: "Tabla de conservación" },
  ];
  v.listaReproduccionNombre = "Batch cooking";
  v.comentarioFijado = "La tabla de conservación en alta resolución está en el post de la comunidad de esta semana.";
  v.difusion = {
    emailEnviado: true,
    postComunidad: { enviado: true, tipo: "SEOencuesta", contenido: "¿Qué te cuesta más del batch cooking? A) decidir el menú B) las dos horas de cocina C) que no sepa a recalentado" },
    redesCompartido: { instagram: true, twitter: true, tiktok: true, otros: [] },
    adsActivados: false,
    plataformasAds: [],
  };
  v.checklistEstado = {
    idea: { "idea-validada-3-fuentes": true },
    investigacion: { "demanda-validada": true, "angulo-diferencial-definido": true },
    titulo: { "hashtag-titulo-decidido": true },
    miniatura: { "alternativa-ab-creada": true, "test-grilla-superado": true },
    guion: { "cliffhanger-decidido": true },
    publicacion: { "checklist-prepublicacion-repasada": true, "video-subido-youtube": true },
    sprint: { "sin-cambios-24h": true, "comentarios-dia1-respondidos": true, "snapshot-dia2": true, "seorepesca-publicada": true, "snapshot-dia4": true, "ctr-evaluado": true, "snapshot-dia7": true, "aprendizajes-anotados": true },
    evergreen: { "snapshot-dia30": true, "comparativa-canal-revisada": true },
  };
  v.seoHora = { diaSemana: 6, horaPublicacion: "09:00" };
  v.notas = "Acelerando en búsquedas de \"batch cooking\". Pendiente: análisis de retención y decidir si refresco la miniatura.";
  return v;
}

// Vídeo 6 — en MINIATURA con estrategia elegida (canal secundario).
function videoMiniatura(canalId) {
  const v = nuevoVideo({
    tituloIdea: "Bizcocho de yogur sin báscula",
    nicho: "repostería fácil",
    tipo: "evergreen",
    descripcionCorta: "El clásico bizcocho del vasito de yogur: sin báscula, sin batidora y con tres variantes que nunca fallan.",
  });
  v.canalId = canalId;
  v.estado = "guion";
  v.createdAt = haceDias(4);
  v.updatedAt = haceDias(1);
  v.tituloFinal = "Bizcocho de yogur sin báscula: imposible fallar";
  v.titulosAlternativos = [
    "El bizcocho del vasito de yogur (receta de siempre)",
    "Bizcocho sin báscula ni batidora: el truco del yogur",
    "Tu primer bizcocho: medidas con el vasito de yogur",
  ];
  v.palabrasClave = ["bizcocho de yogur", "bizcocho sin báscula", "repostería fácil"];
  v.seoPreguntas = [
    "¿Cómo hacer un bizcocho sin báscula?",
    "¿Por qué el bizcocho de yogur no sube?",
  ];
  v.miniatura = {
    estrategia: "SEOcara",
    palabrasMiniatura: "SIN BÁSCULA",
    briefIA: "Primer plano de cara sorprendida mordiendo el bizcocho, vasito de yogur en la otra mano. Texto: SIN BÁSCULA en amarillo. Probar variante con flecha al vasito para el test A/B.",
    urlPrincipal: null,
    urlsAlternativas: [],
  };
  v.checklistEstado = {
    idea: { "idea-validada-3-fuentes": true },
    investigacion: { "demanda-validada": true, "angulo-diferencial-definido": true },
    titulo: { "hashtag-titulo-decidido": true },
  };
  v.notas = "Primer vídeo del canal de repostería. Estrategia SEOcara para diferenciarlo del marco amarillo de Recetas en 15.";
  return v;
}

function progresoCurso() {
  const nota = {
    s1_a8: "Aplicado: la serie de cenas en 15 minutos son capítulos conectados con cliffhanger al final de cada uno.",
    s5_a1: "Mi Pescaseo base: marco amarillo + 3 palabras. En el canal de repostería pruebo SEOcara para no repetirme.",
  };
  const completadas = [
    ["s1_a7", "s1", 35],
    ["s1_a8", "s1", 34],
    ["s1_a9", "s1", 33],
    ["s5_a1", "s5", 16],
    ["s5_a2", "s5", 15],
    ["s5_a7", "s5", 12],
    ["s5_a8", "s5", 11],
  ];
  return completadas.map(([asignaturaId, seccionId, dias]) => ({
    id: uuid(),
    asignaturaId,
    seccionId,
    completado: true,
    notaPersonal: nota[asignaturaId] ?? "",
    fechaCompletado: haceDias(dias),
    vinculadoAVideoIds: [],
  }));
}

function estudioViabilidad() {
  return {
    id: "main",
    ideaCanal: "Recetas reales de 15 minutos para gente que llega a casa tarde y sin ganas de cocinar",
    aQuienAyuda: "Personas que trabajan fuera de casa y quieren comer casero sin dedicar la tarde a la cocina",
    formatoPrevisto: "Vídeos de 6-8 minutos con receta cronometrada y lista de la compra",
    busquedasEncontradas: "cenas rápidas y fáciles, recetas en 15 minutos, batch cooking para la semana, qué cenar hoy",
    canalesReferencia: "Tres canales grandes de cocina general; ninguno cronometra las recetas en cámara",
    anguloReferencia: "Casi todos prometen \"rápido\" pero usan 18-20 ingredientes; nadie enseña el reloj",
    subNicho: "cocina exprés con 6 ingredientes o menos",
    pvu: "Recetas cronometradas en cámara: si no sale en 15 minutos, no se publica",
    checklistVeredicto: { demanda: true, canales: true, hueco: true, subnicho: true, pvu: true },
    autoveredicto: "viable",
    saltado: false,
    completado: true,
    createdAt: haceDias(50),
    updatedAt: haceDias(45),
  };
}

// Siembra TODOS los datos de la cuenta demo: perfil, 2 canales, 6 vídeos, snapshots,
// progreso del curso y estudio de viabilidad. Una sola transacción (batch).
export async function sembrarDemo(db, userId) {
  const canalPrincipal = { id: uuid(), nombre: "Recetas en 15", esPorDefecto: 1, createdAt: haceDias(50) };
  const canalSecundario = { id: uuid(), nombre: "Repostería fácil", esPorDefecto: 0, createdAt: haceDias(6) };

  const v1 = videoPublicado(canalPrincipal.id);
  const v2 = videoSprint(canalPrincipal.id);
  const v3 = videoGuion(canalPrincipal.id);
  const v4 = videoIdea(canalPrincipal.id);
  const v5 = videoEvergreen(canalPrincipal.id);
  const v6 = videoMiniatura(canalSecundario.id);

  // Snapshots con progresión creíble (vídeo publicado y evergreen) + día 2 del sprint.
  const snaps = [
    snapshot(v1.id, 2, 18, { vistas: 412, impresiones: 9800, ctr: 4.2, retencionMediaPct: 52, duracionMediaSeg: 230, suscriptoresGanados: 11, comentarios: 9, likes: 38, notas: "Arranque normal para el canal." }),
    snapshot(v1.id, 7, 13, { vistas: 1530, impresiones: 28400, ctr: 5.1, retencionMediaPct: 49, duracionMediaSeg: 222, suscriptoresGanados: 42, comentarios: 31, likes: 130, notas: "El CTR sube tras la SEOrepesca del día 3." }),
    snapshot(v1.id, 20, 0, { vistas: 4870, impresiones: 76300, ctr: 5.6, retencionMediaPct: 47, duracionMediaSeg: 218, suscriptoresGanados: 118, comentarios: 64, likes: 365, ingresosEstimados: 9.4, rpm: 1.93, notas: "Sigue entrando por búsqueda de \"qué cenar hoy\"." }),
    snapshot(v2.id, 2, 1, { vistas: 380, impresiones: 7600, ctr: 5.0, retencionMediaPct: 55, duracionMediaSeg: 205, suscriptoresGanados: 14, comentarios: 12, likes: 41, notas: "Snapshot del día 2 del sprint." }),
    snapshot(v5.id, 7, 33, { vistas: 980, impresiones: 21000, ctr: 4.7, retencionMediaPct: 51, duracionMediaSeg: 270, suscriptoresGanados: 25, comentarios: 18, likes: 84, notas: "Semana 1 discreta." }),
    snapshot(v5.id, 30, 10, { vistas: 6200, impresiones: 98500, ctr: 6.3, retencionMediaPct: 50, duracionMediaSeg: 264, suscriptoresGanados: 210, comentarios: 95, likes: 540, ingresosEstimados: 14.8, rpm: 2.39, notas: "Acelerando: candidato a optimización evergreen." }),
  ];
  for (const s of snaps) {
    const video = [v1, v2, v5].find((v) => v.id === s.videoProjectId);
    video.metricasIds.push(s.id);
  }

  const stmts = [];
  for (const c of [canalPrincipal, canalSecundario]) {
    stmts.push({
      sql: "INSERT INTO channels(id,userId,nombre,esPorDefecto,createdAt) VALUES(?,?,?,?,?)",
      args: [c.id, userId, c.nombre, c.esPorDefecto, c.createdAt],
    });
  }
  const perfil = construirPerfil();
  stmts.push({ sql: "INSERT INTO profile(id,userId,data) VALUES(?,?,?)", args: [perfil.id, userId, JSON.stringify(perfil)] });
  for (const v of [v1, v2, v3, v4, v5, v6]) {
    stmts.push({
      sql: "INSERT INTO videos(id,data,estado,createdAt,updatedAt,publishedAt,userId,canalId) VALUES(?,?,?,?,?,?,?,?)",
      args: [v.id, JSON.stringify(v), v.estado, v.createdAt, v.updatedAt, v.publishedAt, userId, v.canalId],
    });
  }
  for (const s of snaps) {
    stmts.push({
      sql: "INSERT INTO metric_snapshots(id,data,videoProjectId,fecha,userId) VALUES(?,?,?,?,?)",
      args: [s.id, JSON.stringify(s), s.videoProjectId, s.fecha, userId],
    });
  }
  for (const p of progresoCurso()) {
    stmts.push({
      sql: "INSERT INTO course_progress(userId,asignaturaId,data) VALUES(?,?,?)",
      args: [userId, p.asignaturaId, JSON.stringify(p)],
    });
  }
  const estudio = estudioViabilidad();
  stmts.push({
    sql: "INSERT INTO viabilidad(id,userId,data,completado,createdAt,updatedAt) VALUES(?,?,?,?,?,?)",
    args: [estudio.id, userId, JSON.stringify(estudio), 1, estudio.createdAt, estudio.updatedAt],
  });

  await db.batch(stmts);
}
