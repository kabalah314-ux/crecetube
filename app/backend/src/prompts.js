// prompts.js — 04 §4.4-4.6 LITERAL: system base, contexto y los 9 generadores.

export const SYSTEM_BASE = `Eres el asistente experto del método CRECETUBE para creadores de YouTube en español.
Respondes SIEMPRE en español neutro, con tono cercano y didáctico, nunca robótico.
Conoces y aplicas las reglas del método:
- Títulos: idealmente ≤60 caracteres, nunca >100. Concretos, con palabra clave, sin clickbait vacío.
- Miniaturas: 3-5 palabras impresas, legibles a 100px de ancho.
- Ganchos: los primeros 15 segundos deciden la retención.
- Hashtags: regla del 3 → uno amplio, uno medio, uno específico. Empiezan por # y no llevan espacios.
- Descripciones: las 2 primeras líneas (SEOextracto) son las únicas visibles antes del "ver más".
- Capítulos: el primero siempre es 00:00.
CUANDO SE TE PIDE JSON: devuelves EXCLUSIVAMENTE un objeto JSON válido, sin texto antes ni después,
sin markdown, sin \`\`\`. Si un campo no aplica, usa null.`;

export function construirContexto(profile, video) {
  const lineas = [];
  if (profile) {
    lineas.push("CONTEXTO DEL CANAL");
    lineas.push(
      `- Canal: ${profile.canalNombre} · Nicho: ${profile.nicho} · Nivel: ${profile.nivel} · Objetivo: ${profile.objetivoPrincipal}`
    );
  }
  if (video) {
    lineas.push("", "CONTEXTO DEL VÍDEO");
    if (video.tituloIdea) lineas.push(`- Idea: ${video.tituloIdea}`);
    if (video.descripcionCorta) lineas.push(`- Brief: ${video.descripcionCorta}`);
    lineas.push(`- Tipo: ${video.tipo} · Formato: ${video.formato}`);
    if (video.tituloFinal) lineas.push(`- Título final: ${video.tituloFinal}`);
    if (video.palabrasClave?.length) lineas.push(`- Palabras clave: ${video.palabrasClave.join(", ")}`);
    if (video.seoPreguntas?.length) lineas.push(`- Preguntas SEO: ${video.seoPreguntas.join(" | ")}`);
  }
  return lineas.join("\n");
}

const truncar = (s, n) => (typeof s === "string" ? s.slice(0, n) : s);
const HASHTAG_RE = /^#[a-z0-9_]+$/;

// Cada generador: { maxTokens, temperatura, user(opciones, ctx), normalizar(parsed) → resultados[] }
export const GENERADORES = {
  seo_preguntas: {
    maxTokens: 600,
    temperatura: 0.8,
    user: () => `Genera exactamente 10 preguntas que la audiencia de este nicho escribiría en YouTube
o Google y que este vídeo puede responder. Mezcla: 4 preguntas básicas (principiantes),
4 intermedias y 2 específicas/long-tail. Formato de salida:
{"preguntas": ["...", "..."]}`,
    normalizar: (p) => {
      const lista = Array.isArray(p?.preguntas) ? p.preguntas : null;
      if (!lista) return null;
      const unicas = [...new Set(lista.filter((x) => typeof x === "string" && x.trim()))].slice(0, 10);
      return unicas.length ? unicas.map((texto) => ({ texto })) : null;
    },
  },

  titulo: {
    maxTokens: 800,
    temperatura: 0.9,
    user: () => `Genera exactamente 9 títulos para este vídeo. Reparte así:
- 3 con beneficio directo (qué gana el espectador)
- 2 con curiosidad/intriga (sin clickbait vacío: la promesa se cumple)
- 2 con número o dato concreto
- 2 con pregunta
Cada título: ≤60 caracteres ideal (NUNCA >100), incluye si es natural alguna de las
palabras clave del contexto, sin comillas, sin emojis.
Formato de salida:
{"titulos": [{"texto": "...", "angulo": "beneficio|curiosidad|dato|pregunta"}]}`,
    normalizar: (p) => {
      const lista = Array.isArray(p?.titulos) ? p.titulos : null;
      if (!lista) return null;
      const vistos = new Set();
      const out = [];
      for (const t of lista) {
        const texto = truncar(t?.texto?.trim(), 100);
        if (texto && !vistos.has(texto)) {
          vistos.add(texto);
          out.push({ texto, angulo: t?.angulo ?? "beneficio" });
        }
      }
      return out.length ? out : null;
    },
  },

  miniatura_brief: {
    maxTokens: 700,
    temperatura: 0.7,
    user: (op) => `Redacta un brief de diseño para la miniatura de este vídeo usando la estrategia ${op.estrategia ?? "otra"}.
Reglas de la estrategia:
- SEOmarco: borde grueso de color llamativo alrededor de toda la miniatura.
- SEOcara: rostro humano al 40-60% del área con expresión exagerada; texto al lado opuesto;
  la mirada apunta al texto.
- SEOflecha: una única flecha de color contrastante apuntando al elemento clave.
- otra: composición libre pero siguiendo las buenas prácticas generales.
El brief debe poder dárselo el creador a un diseñador (o a una IA de imagen) sin más contexto.
Incluye: composición, paleta (con códigos hex), texto impreso (3-5 palabras) y qué NO hacer.
Formato de salida:
{"brief": "texto del brief en 6-10 líneas", "palabrasSugeridas": ["3 a 5 palabras para imprimir"]}`,
    normalizar: (p) =>
      typeof p?.brief === "string" && p.brief.trim()
        ? [{ texto: p.brief, palabrasSugeridas: Array.isArray(p.palabrasSugeridas) ? p.palabrasSugeridas.slice(0, 5) : [] }]
        : null,
  },

  hook: {
    maxTokens: 700,
    temperatura: 0.9,
    user: () => `Genera exactamente 5 ganchos de apertura para los primeros 15 segundos de este vídeo.
Tipos a cubrir (uno por gancho): dato impactante, conflicto/problema, pregunta directa,
demostración ("mira esto"), historia personal.
Cada gancho: 1-3 frases habladas en primera persona, lenguaje natural de YouTube en español.
Para cada uno indica dónde encaja mejor: seoShock (gancho fuerte), seoInicio (apertura que
promete el resultado) o seoLoop (promesa diferida que se resuelve al final).
Formato de salida:
{"hooks": [{"texto": "...", "tipo": "dato|conflicto|pregunta|demostracion|historia", "usoSugerido": "seoShock|seoInicio|seoLoop"}]}`,
    normalizar: (p) => {
      const lista = Array.isArray(p?.hooks) ? p.hooks : null;
      if (!lista) return null;
      const out = lista
        .filter((h) => typeof h?.texto === "string" && h.texto.trim())
        .map((h) => ({
          texto: h.texto,
          tipo: h.tipo ?? "dato",
          usoSugerido: ["seoShock", "seoInicio", "seoLoop"].includes(h.usoSugerido) ? h.usoSugerido : "seoShock",
        }));
      return out.length ? out : null;
    },
  },

  descripcion: {
    maxTokens: 1200,
    temperatura: 0.7,
    user: (op) => `RESUMEN DEL GUION
${truncar(op.resumenGuion ?? "(sin guion todavía)", 1500)}

Escribe la descripción de YouTube para este vídeo siguiendo la estructura CRECETUBE:
1. SEOextracto: 1-2 líneas potentes con la palabra clave principal (es lo único visible
   antes del "ver más"; máximo 110 caracteres la primera línea).
2. Párrafo de 2-3 frases ampliando qué aprenderá el espectador.
3. Sección CAPÍTULOS con marcadores de tiempo placeholder:
   00:00 Introducción y luego XX:XX por cada bloque del guion (usa sus títulos).
4. Llamada a suscribirse en 1 frase, natural, sin mendigar.
5. Línea final con 3 hashtags (amplio, medio, específico).
NO inventes enlaces ni redes sociales: usa el marcador {enlaces} donde irían.
Formato de salida:
{"seoExtracto": "...", "descripcion": "texto completo con saltos de línea \\n"}`,
    normalizar: (p) =>
      typeof p?.descripcion === "string" && p.descripcion.trim()
        ? [{ texto: truncar(p.descripcion, 5000), seoExtracto: p.seoExtracto ?? null }]
        : null,
  },

  hashtags: {
    maxTokens: 200,
    temperatura: 0.6,
    user: () => `Propón hashtags para este vídeo siguiendo la regla del 3 del método CRECETUBE:
- amplio: categoría grande del nicho (ej: #cocina)
- medio: subtema (ej: #cocinavegana)
- especifico: el tema exacto del vídeo (ej: #lasañavegana)
Todo en minúsculas, sin espacios, sin tildes, empezando por #.
Da también 1 hashtag candidato para el título (el más corto y reconocible de los tres).
Formato de salida:
{"amplio": "#...", "medio": "#...", "especifico": "#...", "titulo": "#..."}`,
    normalizar: (p) => {
      if (!p || typeof p !== "object") return null;
      const limpio = {};
      for (const k of ["amplio", "medio", "especifico", "titulo"]) {
        limpio[k] = typeof p[k] === "string" && HASHTAG_RE.test(p[k]) ? p[k] : null;
      }
      return limpio.amplio || limpio.medio || limpio.especifico ? [limpio] : null;
    },
  },

  email: {
    maxTokens: 800,
    temperatura: 0.8,
    user: (op) => `Escribe el email de aviso de nuevo vídeo para la lista de correo de este canal,
estilo creador cercano (NO corporativo, NO spam). Estructura:
- asunto: ≤55 caracteres, despierta curiosidad sin engañar
- preheader: 1 frase complementaria al asunto
- cuerpo: saludo breve, 1-2 frases de gancho, enlace ${op.urlVideo || "{urlVideo}"}, posdata personal
  que invite a responder. Máximo 120 palabras. Trata al lector de tú.
Formato de salida:
{"asunto": "...", "preheader": "...", "cuerpo": "texto con \\n"}`,
    normalizar: (p) =>
      typeof p?.cuerpo === "string" && p.cuerpo.trim()
        ? [{ asunto: truncar(p.asunto ?? "", 80), preheader: p.preheader ?? "", cuerpo: p.cuerpo }]
        : null,
  },

  comunidad: {
    maxTokens: 500,
    temperatura: 0.9,
    user: (op) => `Escribe un post para la pestaña Comunidad de YouTube de tipo ${op.tipoPost ?? "SEOlaunch"}.
Reglas por tipo:
- Giftcalipsis: frase ultra-corta (≤80 caracteres) pensada para acompañar un GIF llamativo,
  con pregunta cebo opcional.
- SEOencuesta: contexto de 1-2 frases + pregunta + 2-4 opciones de respuesta cortas.
- SEOlaunch: anuncio de estreno con expectativa, pide un gesto en comentarios (ej: "pon ✋").
- SEOrepesca: rescata el vídeo 24-72h después para quien no lo vio; incluye un dato/momento
  llamativo del vídeo y el marcador {urlVideo}.
Tono: cercano, directo, 0 corporativismo. En español.
Formato de salida:
{"contenido": "texto del post con \\n", "opcionesEncuesta": ["..."] o null, "horaSugerida": "franja horaria recomendada en 1 frase"}`,
    normalizar: (p) =>
      typeof p?.contenido === "string" && p.contenido.trim()
        ? [{ contenido: p.contenido, opcionesEncuesta: Array.isArray(p.opcionesEncuesta) ? p.opcionesEncuesta : null, horaSugerida: p.horaSugerida ?? null }]
        : null,
  },

  analisis_retencion: {
    maxTokens: 1200,
    temperatura: 0.4,
    user: (op) => `DATOS DEL CREADOR (pegados de YouTube Analytics, formato libre):
${truncar(op.datosPegados ?? "(sin datos)", 3000)}

SNAPSHOTS REGISTRADOS EN LA APP:
${op.snapshotsSerializados ?? "(ninguno)"}

Analiza estos datos como coach de YouTube del método CRECETUBE. Devuelve entre 3 y 6
insights ACCIONABLES. Cada insight: qué se observa en los datos (hallazgo), qué hacer
exactamente (accion) y su prioridad. Prohibido el consejo genérico ("haz mejores vídeos"):
cada acción debe poder hacerse esta semana. Si los datos son insuficientes para alguna
conclusión, dilo en el resumen en lugar de inventar.
Formato de salida:
{"resumen": "2-3 frases de diagnóstico global", "insights": [{"hallazgo": "...", "accion": "...", "prioridad": "alta|media|baja"}]}`,
    normalizar: (p) => {
      const insights = Array.isArray(p?.insights)
        ? p.insights
            .filter((i) => i?.hallazgo && i?.accion)
            .map((i) => ({ hallazgo: i.hallazgo, accion: i.accion, prioridad: ["alta", "media", "baja"].includes(i.prioridad) ? i.prioridad : "media" }))
        : [];
      return p?.resumen || insights.length ? [{ resumen: p?.resumen ?? "", insights }] : null;
    },
  },
};

// Extracción robusta de JSON (04 §4.5.2.1): quita fences y recorta el primer bloque balanceado.
export function extraerJson(content) {
  if (typeof content !== "string") return null;
  let s = content.replace(/```(?:json)?/gi, "");
  const inicio = s.search(/[{[]/);
  if (inicio === -1) return null;
  s = s.slice(inicio);
  const apertura = s[0];
  const cierre = apertura === "{" ? "}" : "]";
  let depth = 0;
  let enString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') enString = !enString;
    if (enString) continue;
    if (c === apertura) depth++;
    if (c === cierre) {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(s.slice(0, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
