// campos.js — T024: registro de campos rellenables con IA (generador rellenar_campo).
// Espejo del patrón de requisitos.js: cada campoId define qué necesita tener hecho
// el creador ANTES de pedir sugerencias, qué se le pide a la IA y con qué límites.
// La regla Romuald NO vive aquí: viaja desde el frontend en opciones.reglaCampo
// (consejos.ts es la única fuente de verdad) y la ruta la trunca a ≤1200 chars.
//
// Cada entrada: {
//   requisitos({ video, profile, opciones }) → null (OK) | { falta, pasoSlug, mensaje },
//   instrucciones: string,                       // qué generar (el formato lo añade prompts.js)
//   contexto(video, profile, opciones) → string[]|null,  // líneas extra para el prompt
//   maxTokens, temperatura, n,                   // n = tope de sugerencias devueltas
//   usaCorpus: boolean,                          // true solo en ideación/viabilidad
// }
// Los requisitos de viabilidad.* se evalúan sobre `opciones` del cliente (no sobre
// datos persistidos) porque hay carrera con el autosave (debounce 800ms).
// pasoSlug: "viabilidad" para los campos del estudio; para los del wizard, el slug
// del paso donde se rellena lo que falta (idea | investigacion | titulo | guion | configuracion).

const hayTexto = (s) => typeof s === "string" && s.trim() !== "";

const faltaTituloIdea = (mensaje) => ({ falta: "tituloIdea", pasoSlug: "idea", mensaje });
const faltaTituloFinal = (mensaje) => ({ falta: "tituloFinal", pasoSlug: "titulo", mensaje });
const faltaIdeaCanal = (mensaje) => ({ falta: "ideaCanal", pasoSlug: "viabilidad", mensaje });

// Contexto de los campos de viabilidad: siempre la idea de canal + extras presentes.
const ETIQUETAS_VIABILIDAD = {
  aQuienAyuda: "A quién ayuda",
  formatoPrevisto: "Formato previsto",
  busquedasEncontradas: "Búsquedas comprobadas",
  canalesReferencia: "Canales de referencia",
  subNicho: "Sub-nicho",
  pvu: "PVU",
};
const ctxViabilidad =
  (...claves) =>
  (_video, _profile, opciones) => {
    const lineas = ["DATOS DEL ESTUDIO DE VIABILIDAD (introducidos por el creador)"];
    lineas.push(`- Idea de canal: ${hayTexto(opciones?.ideaCanal) ? opciones.ideaCanal : "(sin especificar)"}`);
    for (const k of claves) {
      if (hayTexto(opciones?.[k])) lineas.push(`- ${ETIQUETAS_VIABILIDAD[k]}: ${opciones[k]}`);
    }
    return lineas;
  };

export const CAMPOS_IA = {
  // ---------- Wizard ----------
  descripcionCorta: {
    requisitos: ({ video }) =>
      hayTexto(video?.tituloIdea)
        ? null
        : faltaTituloIdea(
            "Sin idea de vídeo no hay brief que redactar. Escribe primero el título de trabajo: el brief concreta una idea, no la inventa."
          ),
    instrucciones: `Redacta exactamente 3 versiones del brief de este vídeo (2-3 frases cada una):
qué problema resuelve, a quién ayuda y por qué lo buscaría en YouTube. Concretas, sin paja.`,
    contexto: null,
    maxTokens: 500,
    temperatura: 0.8,
    n: 3,
    usaCorpus: false,
  },

  palabrasClave: {
    requisitos: ({ video }) =>
      hayTexto(video?.tituloIdea)
        ? null
        : faltaTituloIdea(
            "Las palabras clave salen del tema, no del aire. Escribe primero la idea del vídeo o las keywords serán genéricas, y lo genérico no posiciona."
          ),
    instrucciones: `Propón entre 8 y 10 palabras clave para este vídeo, empezando por las de cola larga
(3+ palabras, menos competencia) y cerrando con 1-2 amplias. Minúsculas, sin almohadilla,
sin repetir las que ya aparecen en el contexto. Cada sugerencia es UNA palabra clave.`,
    contexto: null,
    maxTokens: 400,
    temperatura: 0.7,
    n: 10,
    usaCorpus: false,
  },

  "guion.desarrollo": {
    requisitos: ({ video }) => {
      if (!hayTexto(video?.tituloFinal))
        return faltaTituloFinal(
          "El guion desarrolla la promesa del título. Cierra el título final primero o los bloques no apuntarán a ninguna parte."
        );
      if ((video?.seoPreguntas?.length ?? 0) < 1)
        return {
          falta: "seoPreguntas",
          pasoSlug: "investigacion",
          mensaje:
            "Los bloques del guion responden preguntas que tu audiencia ya busca. Anota al menos una pregunta SEO en la investigación o el guion será relleno.",
        };
      return null;
    },
    instrucciones: `Construye el esqueleto del desarrollo del guion: entre 4 y 6 bloques que respondan,
en orden lógico, a las preguntas SEO del contexto. "Entrar a matar": cada bloque empieza
por la respuesta, sin rodeos. Para cada bloque: titulo corto del capítulo, contenido con
2-4 frases de qué contar y cómo, y duracionSegundos estimada (entre 60 y 240).
No repitas bloques que ya existan en el contexto.`,
    contexto: (video) => {
      const bloques = video?.guion?.desarrollo ?? [];
      if (!bloques.length) return null;
      return [
        "BLOQUES QUE YA TIENE EL GUION (PROHIBIDO repetirlos):",
        ...bloques.map((b) => `- ${hayTexto(b?.titulo) ? b.titulo : "(sin título)"}`),
      ];
    },
    maxTokens: 900,
    temperatura: 0.8,
    n: 6,
    usaCorpus: false,
  },

  "guion.seoResultado": {
    requisitos: ({ video }) => {
      if (!hayTexto(video?.tituloFinal))
        return faltaTituloFinal(
          "El SEOresultado demuestra que el título se cumplió. Cierra el título final primero: sin promesa no hay nada que demostrar."
        );
      if (!hayTexto(video?.guion?.seoInicio) && (video?.guion?.desarrollo?.length ?? 0) < 1)
        return {
          falta: "guion.seoInicio",
          pasoSlug: "guion",
          mensaje:
            "El cierre se escribe sobre lo contado. Escribe el SEOinicio o al menos un bloque del desarrollo: sin guion no hay resultado que rematar.",
        };
      return null;
    },
    instrucciones: `Redacta exactamente 3 versiones del SEOresultado (cierre del vídeo): demuestra que la
promesa del título se ha cumplido y enlaza con el siguiente paso del espectador (cadena
de reproducción). 2-4 frases habladas en primera persona, sin despedidas largas.`,
    contexto: (video) => {
      const g = video?.guion ?? {};
      const lineas = [];
      if (hayTexto(g.seoInicio)) lineas.push(`SEOinicio del guion: ${g.seoInicio.slice(0, 400)}`);
      const titulos = (g.desarrollo ?? []).map((b) => b?.titulo).filter(hayTexto);
      if (titulos.length) lineas.push(`Bloques del desarrollo: ${titulos.join(" | ").slice(0, 600)}`);
      return lineas.length ? lineas : null;
    },
    maxTokens: 700,
    temperatura: 0.8,
    n: 3,
    usaCorpus: false,
  },

  "guion.psicoCta": {
    requisitos: ({ video }) =>
      hayTexto(video?.tituloFinal)
        ? null
        : faltaTituloFinal(
            "El PSICO-CTA empuja el vídeo que el título promete. Cierra el título final primero o pedirás suscriptores sin darles motivo."
          ),
    instrucciones: `Redacta exactamente 3 versiones del PSICO-CTA del vídeo: una llamada a la acción
win-win donde suscribirse o comentar le da algo concreto al espectador (no mendigues).
1-3 frases habladas, naturales, en primera persona.`,
    contexto: null,
    maxTokens: 500,
    temperatura: 0.9,
    n: 3,
    usaCorpus: false,
  },

  "guion.cliffhanger": {
    requisitos: ({ video }) =>
      hayTexto(video?.tituloFinal)
        ? null
        : faltaTituloFinal(
            "El cliffhanger encadena este vídeo con el siguiente. Cierra el título final primero: sin promesa cumplida no hay bucle que abrir."
          ),
    instrucciones: `Redacta exactamente 3 cliffhangers para el final del vídeo: un bucle abierto que
empuje a ver el siguiente vídeo del canal (cadena de reproducción). 1-2 frases con
promesa concreta, sin resolverla aquí.`,
    contexto: null,
    maxTokens: 500,
    temperatura: 0.9,
    n: 3,
    usaCorpus: false,
  },

  comentarioFijado: {
    requisitos: ({ video }) =>
      hayTexto(video?.tituloFinal)
        ? null
        : faltaTituloFinal(
            "El comentario fijado empuja la conversación del vídeo. Cierra el título final primero o fijarás ruido en vez de gancho."
          ),
    instrucciones: `Redacta exactamente 3 versiones del comentario fijado del vídeo: una pregunta o
gancho que provoque respuestas y enlace con la cadena del canal (siguiente vídeo o
SEOlista). 1-3 frases, tono cercano, cero corporativismo.`,
    contexto: null,
    maxTokens: 500,
    temperatura: 0.9,
    n: 3,
    usaCorpus: false,
  },

  listaReproduccionNombre: {
    requisitos: ({ video }) =>
      hayTexto(video?.tituloFinal) || (video?.palabrasClave?.length ?? 0) >= 1
        ? null
        : {
            falta: "palabrasClave",
            pasoSlug: "investigacion",
            mensaje:
              "La SEOlista se nombra con lo que la gente busca. Anota al menos una palabra clave en la investigación (o cierra el título): sin keyword el nombre no posiciona.",
          },
    instrucciones: `Propón exactamente 5 nombres para la SEOlista (lista de reproducción) donde vivirá
este vídeo: cortos (2-5 palabras), con la palabra clave del tema, pensados para que se
busquen y se vean en orden. Sin emojis ni comillas.`,
    contexto: null,
    maxTokens: 300,
    temperatura: 0.8,
    n: 5,
    usaCorpus: false,
  },

  // ---------- Viabilidad (T025) — requisitos sobre opciones del cliente ----------
  "viabilidad.ideaCanal": {
    // Lo que falta (el nicho) se rellena en Configuración, no en el estudio.
    requisitos: ({ profile }) =>
      hayTexto(profile?.nicho)
        ? null
        : {
            falta: "nicho",
            pasoSlug: "configuracion",
            mensaje:
              "Sin nicho no hay ideas que valgan. Define tu nicho en Configuración: la IA puede ampliar tu terreno, no elegirlo por ti.",
          },
    instrucciones: `Propón exactamente 4 ideas de canal para este nicho aplicando el conocimiento del
método de arriba (triángulo pasión × demanda × competencia). Cada idea: 1-2 frases con
el tema, a quién sirve y el ángulo que la diferencia.`,
    contexto: null,
    maxTokens: 700,
    temperatura: 0.9,
    n: 4,
    usaCorpus: true,
  },

  "viabilidad.aQuienAyuda": {
    requisitos: ({ opciones }) =>
      hayTexto(opciones?.ideaCanal)
        ? null
        : faltaIdeaCanal("Primero la idea de canal, luego a quién ayuda. Escribe tu idea arriba: sin ella cualquier audiencia es humo."),
    instrucciones: `Describe en exactamente 3 versiones a quién ayuda este canal: persona concreta,
problema concreto y situación en la que busca en YouTube. 1-2 frases por versión,
nada de "todo el mundo".`,
    contexto: ctxViabilidad(),
    maxTokens: 500,
    temperatura: 0.8,
    n: 3,
    usaCorpus: false,
  },

  "viabilidad.formatoPrevisto": {
    requisitos: ({ opciones }) =>
      hayTexto(opciones?.ideaCanal)
        ? null
        : faltaIdeaCanal("El formato sirve a la idea, no al revés. Escribe primero tu idea de canal o elegirás formato a ciegas."),
    instrucciones: `Propón exactamente 3 formatos de vídeo realistas para este canal (ej: tutorial a
cámara, screencast, voz en off con b-roll). Cada sugerencia: el formato y por qué
encaja con la idea, en 1 frase.`,
    contexto: ctxViabilidad("aQuienAyuda"),
    maxTokens: 300,
    temperatura: 0.7,
    n: 3,
    usaCorpus: false,
  },

  "viabilidad.busquedasEncontradas": {
    requisitos: ({ opciones }) =>
      hayTexto(opciones?.ideaCanal)
        ? null
        : faltaIdeaCanal("Las búsquedas se derivan de tu idea de canal. Escríbela primero: sin idea no hay nada que comprobar en YouTube."),
    instrucciones: `Sugiere entre 6 y 8 búsquedas SEMILLA para comprobar en el autocompletar de YouTube.
NO inventes resultados, volúmenes ni datos: tu trabajo es proponer qué teclear; el
creador irá a YouTube y anotará lo que aparezca de verdad. Cada sugerencia: una
búsqueda corta tal y como se escribiría en el buscador.`,
    contexto: ctxViabilidad("aQuienAyuda"),
    maxTokens: 500,
    temperatura: 0.7,
    n: 8,
    usaCorpus: false,
  },

  "viabilidad.canalesReferencia": {
    requisitos: ({ opciones }) =>
      hayTexto(opciones?.ideaCanal)
        ? null
        : faltaIdeaCanal("Para buscar referentes hace falta saber qué buscas. Escribe primero tu idea de canal o mirarás canales que no compiten contigo."),
    instrucciones: `Sugiere entre 4 y 6 CONSULTAS de búsqueda para encontrar canales de referencia de
este nicho en YouTube (ej: "recetas veganas rápidas"). PROHIBIDO inventar nombres de
canales, cifras de suscriptores o datos: el creador buscará y anotará los canales que
existan de verdad. Cada sugerencia: una consulta para el buscador de YouTube.`,
    contexto: ctxViabilidad("busquedasEncontradas"),
    maxTokens: 500,
    temperatura: 0.7,
    n: 6,
    usaCorpus: false,
  },

  "viabilidad.anguloReferencia": {
    requisitos: ({ opciones }) =>
      hayTexto(opciones?.ideaCanal)
        ? null
        : faltaIdeaCanal("El ángulo diferencia TU idea de las demás. Escribe primero tu idea de canal: sin ella no hay nada que diferenciar."),
    instrucciones: `Propón exactamente 3 ángulos diferenciales para este canal frente a los canales de
referencia del contexto: qué hará distinto (formato, enfoque, profundidad o
personalidad). 1-2 frases por ángulo, concretos y defendibles.`,
    contexto: ctxViabilidad("canalesReferencia"),
    maxTokens: 600,
    temperatura: 0.9,
    n: 3,
    usaCorpus: false,
  },

  "viabilidad.subNicho": {
    requisitos: ({ opciones }) =>
      hayTexto(opciones?.ideaCanal)
        ? null
        : faltaIdeaCanal("El sub-nicho recorta tu idea de canal, no la sustituye. Escribe primero la idea o acotarás sobre la nada."),
    instrucciones: `Propón entre 3 y 5 sub-nichos concretos dentro de esta idea de canal aplicando el
conocimiento del método de arriba: lo bastante específicos para destacar, con demanda
real plausible. Cada sugerencia: el sub-nicho en 2-6 palabras.`,
    contexto: ctxViabilidad("busquedasEncontradas"),
    maxTokens: 400,
    temperatura: 0.8,
    n: 5,
    usaCorpus: true,
  },

  "viabilidad.pvu": {
    requisitos: ({ opciones }) =>
      hayTexto(opciones?.ideaCanal)
        ? null
        : faltaIdeaCanal("La PVU resume por qué tú y no otro. Escribe primero tu idea de canal: sin idea no hay propuesta que defender."),
    instrucciones: `Redacta exactamente 3 propuestas de valor única (PVU) para este canal: UNA frase
cada una que responda "por qué verte a ti y no a otro", concreta y sin humo.`,
    contexto: ctxViabilidad("subNicho", "aQuienAyuda"),
    maxTokens: 400,
    temperatura: 0.8,
    n: 3,
    usaCorpus: true,
  },
};
