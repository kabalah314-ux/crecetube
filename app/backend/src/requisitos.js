// requisitos.js — T022: cadena del método. Única fuente de verdad de lo que cada
// generador IA necesita tener hecho ANTES de ejecutarse (bloqueo duro).
// Cada regla devuelve null (OK) o { falta, pasoSlug, mensaje } con tono Romuald:
// corto, directo y con la consecuencia de saltarse el método.
// pasoSlug ∈ idea | investigacion | titulo | guion | publicacion | configuracion | viabilidad
// (los dos últimos solo los usan los campos de rellenar_campo, definidos en campos.js).
import { CAMPOS_IA } from "./campos.js";

const hayTexto = (s) => typeof s === "string" && s.trim() !== "";

const faltaTituloFinal = (mensaje) => ({ falta: "tituloFinal", pasoSlug: "titulo", mensaje });

const REQUISITOS = {
  seo_preguntas: ({ video }) =>
    (video?.palabrasClave?.length ?? 0) >= 1
      ? null
      : {
          falta: "palabrasClave",
          pasoSlug: "investigacion",
          mensaje:
            "Sin palabra clave no hay preguntas que valgan. Anota al menos una en la investigación: la IA no adivina lo que tu audiencia ya busca.",
        },

  titulo: ({ video }) =>
    (video?.palabrasClave?.length ?? 0) >= 3 && (video?.seoPreguntas?.length ?? 0) >= 1
      ? null
      : {
          falta: "palabrasClave",
          pasoSlug: "investigacion",
          mensaje:
            "Sin keyword no hay título. La investigación es lo primero: reúne 3 palabras clave y 1 pregunta SEO, porque el título se construye sobre lo que la gente ya busca.",
        },

  miniatura_brief: ({ video }) =>
    hayTexto(video?.tituloFinal)
      ? null
      : faltaTituloFinal(
          "Sin título final no hay Pescaseo. Miniatura y título se diseñan juntos: cierra el título primero o la miniatura prometerá otra cosa."
        ),

  hook: ({ video }) =>
    hayTexto(video?.tituloFinal)
      ? null
      : faltaTituloFinal(
          "El gancho cumple lo que el título promete. Cierra el título final primero o regalarás la retención de los primeros 15 segundos."
        ),

  descripcion: ({ video }) => {
    if (!hayTexto(video?.tituloFinal))
      return faltaTituloFinal(
        "La descripción arranca con la palabra clave del título. Cierra el título final primero: sin él, el SEOextracto nace cojo."
      );
    if (!hayTexto(video?.guion?.seoInicio) && (video?.guion?.desarrollo?.length ?? 0) < 1)
      return {
        falta: "guion.seoInicio",
        pasoSlug: "guion",
        mensaje:
          "Sin guion no hay capítulos ni SEOextracto que valgan. Escribe al menos el SEOinicio o un bloque del desarrollo: la descripción se saca del guion, no del aire.",
      };
    return null;
  },

  hashtags: ({ video }) =>
    hayTexto(video?.tituloFinal)
      ? null
      : faltaTituloFinal("Los hashtags se derivan del título. Sin título final solo añadirías ruido, y el ruido no posiciona."),

  email: ({ video }) => {
    if (!hayTexto(video?.tituloFinal))
      return faltaTituloFinal("El email vende el título del vídeo. Ciérralo primero: sin promesa clara nadie hace clic.");
    if (!video?.publishedAt)
      return {
        falta: "publishedAt",
        pasoSlug: "publicacion",
        mensaje:
          "El email se envía cuando el vídeo ya está fuera. Publica primero: avisar de algo que no existe quema tu lista.",
      };
    return null;
  },

  comunidad: ({ video }) =>
    hayTexto(video?.tituloFinal)
      ? null
      : faltaTituloFinal("El post de comunidad empuja un vídeo concreto. Cierra el título final primero: sin él no hay nada que anunciar."),

  analisis_retencion: ({ video }) =>
    video?.publishedAt
      ? null
      : {
          falta: "publishedAt",
          pasoSlug: "publicacion",
          mensaje:
            "Sin vídeo publicado no hay datos que analizar. Publica, deja que YouTube hable y vuelve: lo demás es adivinar.",
        },

  temas_canal: ({ profile }) =>
    hayTexto(profile?.nicho)
      ? null
      : {
          falta: "nicho",
          pasoSlug: "configuracion",
          mensaje:
            "Sin nicho definido los temas saldrán genéricos, y lo genérico no posiciona. Define tu nicho en Configuración antes de pedir ideas.",
        },

  sugerir_nombres_canal: ({ profile }) =>
    hayTexto(profile?.nicho)
      ? null
      : {
          falta: "nicho",
          pasoSlug: "configuracion",
          mensaje:
            "Un nombre sin nicho es una lotería. Define primero tu nicho en Configuración: el nombre debe dejar claro de qué va el canal.",
        },

  // T024 — rellenar_campo delega en el registro de campos (campos.js).
  // Un campoId desconocido no bloquea aquí: la ruta lo rechaza con 422 VALIDATION_ERROR.
  rellenar_campo: ({ video, profile, opciones }) =>
    CAMPOS_IA[opciones?.campoId]?.requisitos?.({ video, profile, opciones }) ?? null,

  // Sin requisitos: evalúan lo que haya, aunque esté a medias.
  romu_aprueba: () => null,
  evaluacion_nicho: () => null,
};

// Devuelve null si el generador puede ejecutarse, o { falta, pasoSlug, mensaje } si no.
export function evaluarRequisitos(tipo, { video, profile, opciones } = {}) {
  const regla = REQUISITOS[tipo];
  return regla ? regla({ video, profile, opciones }) : null;
}
