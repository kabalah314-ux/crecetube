// consejos.ts — Biblia Crecetube (metodología Romuald Fons).
// ÚNICA fuente de verdad de la capa de consejos. NO editar textos sin revisar
// la guía de tono (GUIA_MAESTRA_IMPLEMENTACION.md §6).
import type { StepId } from "../types";

export interface ConsejosEtapa {
  banner: string;
  bannerDetalle?: string;
  campos: Record<string, string>;
  checks: Record<string, string>;
}

export const CONSEJOS: Record<StepId, ConsejosEtapa> = {
  idea: {
    banner:
      "Romuald dice: 'Si no hay competencia en tu tema, es una señal de peligro.' La competencia valida que hay mercado. Busca el hueco dentro del mercado, no un mercado sin nadie.",
    campos: {
      tituloIdea:
        "¿Hay gente buscando esto? Antes de escribir nada, comprueba el autocompletar de YouTube. Si aparece la búsqueda sola, hay demanda real.",
      descripcionCorta:
        "No grabes lo que tú quieres, graba lo que tu audiencia necesita. Este brief debe responder: ¿qué problema resuelve? ¿quién lo busca?",
      tipoEvergreen:
        "Evergreen es patrimonio. Un vídeo evergreen bien posicionado genera visitas y dinero constante aunque no subas nada en semanas.",
      tipoSprint:
        "Sprint = vídeo de tendencia. Vive en los primeros 7 días. Si solo haces sprints, te conviertes en esclavo de la actualidad.",
      tipoMixto:
        "Lo ideal: estructura de cadena donde evergreens generan base estable y sprints aprovechan picos de tráfico.",
      nicho:
        "Cuanto más específico el nicho, menor la competencia y mayor el RPM de anunciantes. 'Gaming' es demasiado amplio. 'Trucos para subir de rango en Valorant' es un nicho.",
    },
    checks: {
      "idea-validada-3-fuentes":
        "Método de validación triple de Romuald: 1) YouTube Autocomplete — ¿aparece sola la búsqueda? 2) Google Keyword Planner — ¿hay anunciantes pujando? 3) Analiza resultados actuales — ¿hay huecos que nadie cubre bien?",
    },
  },

  investigacion: {
    banner:
      "Romuald sobre la investigación: 'No busques lo que te gusta, busca lo que la gente ya está buscando y no encuentra bien respondido.' El hueco de mercado es tu oportunidad.",
    campos: {
      palabrasClave:
        "Prioriza keywords de cola larga al empezar. 'Cómo ganar dinero en YouTube siendo pequeño' posiciona más fácil que 'ganar dinero YouTube'.",
      seoPreguntas:
        "Estas preguntas son el esqueleto del guion. Si el vídeo responde exactamente lo que el usuario buscó, la retención sube automáticamente.",
      competenciaRefs:
        "Analiza la competencia con ViewStats u otras herramientas. Busca lo que hacen todos y ejecuta algo radicalmente distinto. Eso es el ángulo diferencial.",
    },
    checks: {
      "angulo-diferencial-definido":
        "Ángulo diferencial = rotura de patrón conceptual. Pregúntate: ¿qué hace el 90% de los canales de mi nicho en sus miniaturas, títulos y estructuras? Haz lo opuesto o mejóralo radicalmente.",
      "demanda-validada":
        "Validación triple: 1) YouTube Autocomplete — ¿aparece sola la búsqueda? 2) Google Keyword Planner — ¿hay anunciantes pujando? 3) ¿Hay huecos que nadie cubre bien en los resultados actuales?",
    },
  },

  titulo: {
    banner:
      "Método de título Romuald — Pescaseo: la miniatura llama la atención, el título convence de hacer clic. Juntos cuentan una historia, pero ninguno la completa. Usa copywriting de curiosidad o miedo. Genera múltiples opciones antes de elegir.",
    campos: {
      tituloFinal:
        "El título debe integrar la palabra clave principal Y generar un loop abierto de curiosidad. El usuario debe pensar: 'Tengo que ver esto.' Miniatura y título no se repiten — cuentan juntos una historia incompleta (Pescaseo).",
      palabraClave:
        "La palabra clave principal es el factor SEO más importante en YouTube. Ponla al principio si puedes. Luego añade variantes long tail: más específico = menos competencia = más fácil de posicionar.",
      hashtagTitulo:
        "Romuald advierte: los hashtags en el título son puntos de fuga. El usuario puede hacer clic en el hashtag y salir de tu vídeo antes de verlo. Úsalos solo si tienen un propósito SEO muy claro.",
      generarIA:
        "Romuald insiste en el brainstorming múltiple — igual que los grandes periódicos. El primer título raramente es el mejor. Genera al menos 3 opciones optimizadas y elige la que genere más curiosidad.",
    },
    checks: {
      "longitud-optima":
        "Sin número mágico de caracteres, pero cada palabra debe ganarse su sitio. En móvil los títulos largos se cortan. Usa mayúsculas selectivas en la palabra que dispara la emoción clave para facilitar el escaneo visual.",
      "palabra-clave-incluida":
        "La palabra clave principal es el factor SEO más importante en YouTube. Ponla al principio si puedes. Más específico = menos competencia = más fácil de posicionar.",
      "hashtag-titulo-decidido":
        "Pregúntate: ¿este hashtag ayuda al SEO o es un punto de fuga? Si no tienes una respuesta clara, no lo pongas.",
    },
  },

  miniatura: {
    banner:
      "Romuald sobre miniaturas: 'Alto contraste, pocas palabras, máxima intriga.' La función no es que sea bonita, sino que rompa el patrón visual del feed. El objetivo es hacer IMPOSIBLE no hacer clic.",
    campos: {
      estrategiaSeomarco:
        "Marco de color llamativo = destácate en el feed. El cerebro detecta contornos antes que contenido. Un borde brillante en un feed neutro llama la atención automáticamente. Alto contraste es la prioridad número uno.",
      estrategiaSeocara:
        "Rostro humano con expresión exagerada = conexión emocional instantánea. Los ojos deben mirar hacia el texto para dirigir la atención del espectador. El 40-60% de la miniatura debería ser cara. Expresiones de sorpresa, miedo o entusiasmo disparan el CTR.",
      estrategiaSeoflecha:
        "La flecha o dedo señalador guía la mirada exactamente donde tú quieres — hacia el texto clave o el elemento principal. Sin dirección visual, el ojo no sabe dónde ir y la miniatura pierde impacto.",
      palabrasMiniatura:
        "Pocas palabras que generen intriga, no que expliquen. Ejemplos de Romuald: 'Soy rico', 'La verdad'. Si la miniatura lo explica todo, el usuario no necesita ver el vídeo.",
    },
    checks: {
      "test-grilla-superado":
        "La prueba decisiva: ¿tu miniatura funciona a tamaño móvil? El 80% de las visualizaciones vienen de móvil, donde las miniaturas son pequeñas y el botón de suscribirse puede tapar parte de la imagen. Si no impacta en pequeño, falla donde más importa.",
      "alternativa-ab-creada":
        "SEO Swap: si tras 24h el vídeo tiene métricas malas (flechas rojas en YouTube Studio), cambia miniatura y título por versiones más agresivas. No esperes más. YouTube te da una segunda oportunidad en tiempo real — aprovéchala.",
    },
  },

  guion: {
    banner:
      "Estructura obligatoria Romuald — 'Entrar a matar': SEOshock (0-10s) → SEOinicio (confirmación) → SEOloop (promesa diferida) → Desarrollo con roturas de patrón cada 1.5-3 min → SEOresultado → CTA psicológica win-win → Cliffhanger. Sin esta estructura, la retención cae.",
    campos: {
      seoShock:
        "Entrar a matar. Los primeros 10 segundos son todo. Haz una promesa directa y potente de lo que el espectador va a aprender. Si fallas aquí, nada de lo demás importa. (s9_a3)",
      seoInicio:
        "Confirma al usuario que está en el lugar correcto: su tiempo será bien invertido. Reduce la ansiedad de 'me equivoqué de vídeo' que aparece en los primeros 30 segundos. (s9_a2)",
      seoLoop:
        "Loop abierto = no revelar la información más valiosa al principio, sino PROMETER que llegará. 'Al final del vídeo te cuento el truco que lo cambió todo' — el cerebro necesita cerrar ese bucle. (s9_a4)",
      roturaPatron:
        "Cada 1.5 a 3 minutos. Cambio brusco visual, sonoro o emocional para 'limpiar' la atención. Sin roturas de patrón el cerebro entra en modo pasivo y el usuario sale.",
      seoResultado:
        "Cumple la promesa inicial del vídeo — el espectador que llegó hasta aquí la merece. Y justo después, no te despidas: enlaza con el siguiente vídeo para continuar la cadena de sesión. El final no es un punto de fuga, es el inicio de una nueva visualización. (s9_a8)",
      psicoCta:
        "La CTA de Romuald es win-win. No pidas la suscripción vacía. Ofrece algo de valor: 'Si quieres saber X, suscríbete porque la semana que viene…' El usuario actúa cuando recibe algo a cambio. (s9_a9)",
      cliffhanger:
        "Enseña algo valioso pero incompleto. El usuario debe necesitar el siguiente vídeo para cerrar el bucle. Así se construyen cadenas de reproducción y sesiones largas. (s9_a10)",
      duracionEstimada:
        "No existe duración ideal. Un vídeo de 2 horas con buena retención genera más tiempo de sesión que uno de 10 minutos que aburre. Si puedes hacer una masterclass que mantenga al usuario enganchado, YouTube la promocionará agresivamente.",
    },
    checks: {},
  },

  grabacion: {
    banner:
      "Consejo Romuald: 'El mejor equipo es el que tienes.' La producción debe centrarse en lo que la audiencia necesita escuchar, no en lo que el creador quiere decir. Graba ya. Los datos te dirán si necesitas mejorar.",
    bannerDetalle:
      "Romuald es claro: para empezar basta un móvil. El error típico es perder meses buscando el setup perfecto antes de tener datos reales. El contenido y la intención de búsqueda valen más que cualquier cámara.",
    campos: {},
    checks: {
      "audio-verificado":
        "El audio malo destruye retención más que la imagen mala. El espectador perdona una imagen mediocre, pero no soporta audio con eco o ruido. Es la inversión técnica que más impacto tiene en retención.",
      "broll-grabado":
        "El broll es tu herramienta de rotura de patrón en edición. Evita que la imagen sea estática para que el cerebro del usuario no entre en modo pasivo. Si no lo grabas ahora, no podrás usarlo después. Graba más de lo que crees necesitar.",
      "energia-camara":
        "Las roturas de patrón también son de energía: cambios de intensidad emocional, bromas, movimientos de cámara. El cerebro necesita estos cambios cada 1.5-3 minutos para seguir atento. Planifícalos antes de grabar.",
    },
  },

  edicion: {
    banner:
      "SEOTE: si detectas una caída brusca en la curva de retención, puedes recortar ese trozo del vídeo ya publicado desde YouTube Studio sin re-subirlo. Edita guiado por datos, no por cariño al contenido grabado.",
    bannerDetalle:
      "La edición de Romuald se basa en la curva de retención de Analytics. Abre YouTube Analytics, mira dónde cae la curva y corta esos fragmentos. La edición perfecta no existe antes de ver los datos. Elimina todo lo que no aporte retención: si un bloque no engancha, córtalo sin piedad.",
    campos: {
      tuGuionPide:
        "Ejecuta cada rotura marcada en el guion: el cerebro necesita el cambio para seguir atento.",
    },
    checks: {
      "roturas-patron-aplicadas":
        "El guion marcó dónde van las roturas. En edición, ejecútalas: corte brusco, cambio de plano, zoom, efecto sonoro, gráfico. El cerebro necesita el cambio para seguir atento — como el cine de acción de Hollywood.",
      "seozoom-aplicado":
        "SEOzoom = acercamiento brusco de cámara para enfatizar un mensaje clave y romper la monotonía visual. Úsalo en los momentos de mayor información para que el usuario no entre en modo pasivo.",
      "seoreset-aplicado":
        "SEOreset = cualquier elemento visual o sonoro que 'limpie' la atención y prepare para el siguiente bloque. Puede ser un corte a negro, una transición, música, un gráfico en pantalla. El objetivo es resetear la concentración.",
      "subtitulos-revisados":
        "Los subtítulos amplían el alcance a audiencias de otros idiomas, especialmente en vídeos con mucha carga visual. Romuald los considera herramienta de expansión de alcance, no solo de accesibilidad.",
      "ultimo-frame-reservado":
        "El último frame es donde YouTube coloca las pantallas finales. Déjalo libre y limpio — es tu espacio de conversión hacia el siguiente eslabón de la cadena. Un cliffhanger verbal justo antes multiplica el porcentaje de clics.",
    },
  },

  publicacion: {
    banner:
      "La publicación no es el final — es el disparo de salida del sprint. Todo lo que configures aquí (descripción, timestamps, pantallas finales, comentario fijado) debe estar al servicio de una sola cosa: que el usuario no abandone tu ecosistema de contenido.",
    campos: {
      descripcion:
        "Las dos primeras líneas son críticas: YouTube las muestra en los resultados de búsqueda antes del 'mostrar más'. Deben incluir la palabra clave principal y un gancho emocional. Los enlaces externos van siempre después del fold — antes son puntos de fuga.",
      hashtagsDescripcion:
        "Cuidado con los hashtags — son puntos de fuga. Úsalos con criterio, no por cantidad. Pocos y relevantes al nicho. Si el usuario hace clic en un hashtag y sale de tu contenido, pierdes tiempo de sesión.",
      timestamps:
        "Los capítulos mejoran la indexación en Google (aparecen como secciones en los resultados de búsqueda) y la experiencia del usuario. Romuald los recomienda: son SEO externo gratuito.",
      pantallasYTarjetas:
        "Configuración óptima según Romuald: 3 elementos — vídeo sugerido por YouTube, vídeo siguiente de tu serie y botón de suscripción. Las tarjetas también pueden ser puntos de fuga — úsalas para conectar vídeos de la misma cadena, no para salir del ecosistema.",
      seoHora:
        "Publica una hora antes del pico máximo de visualización de tu canal — ese dato está en YouTube Analytics → Audiencia. No hay una hora universal; la tuya depende de dónde está tu audiencia.",
      comentarioFijado:
        "El comentario fijado es una herramienta potente de cadena de reproducción. Úsalo para enlazar al siguiente vídeo de la serie con un gancho: '¿Quieres saber qué pasó después? Aquí te lo cuento.' Fuerza la cadena desde el propio hilo de comentarios.",
    },
    checks: {
      "seohora-elegida":
        "Publica una hora antes del pico máximo de visualización de tu canal (YouTube Analytics → Audiencia). No hay una hora universal; la tuya depende de dónde está tu audiencia.",
    },
  },

  sprint: {
    banner:
      "El sprint no es pasivo. Día 1: publica → espera 24h sin tocar nada → mira métricas → si flechas rojas, ejecuta SEO Swap. Usa comunidad y email para inyectar tráfico de calidad. YouTube premia el impulso inicial — dáselo tú primero.",
    bannerDetalle:
      "Los primeros 7 días son críticos porque YouTube da una exposición aumentada (boost) para recabar datos de CTR y retención. Es la ventana donde el algoritmo decide si tu vídeo merece ser recomendado. Todo lo que hagas en estos 7 días multiplica su impacto.",
    campos: {
      postComunidad:
        "Usa la pestaña de comunidad para lanzar encuestas relacionadas con el tema del vídeo el mismo día de publicación. Genera conversación y envía tráfico activo al vídeo en su momento más crítico.",
      emailMarketing:
        "El email marketing es el arma secreta del sprint. Enviar tráfico externo de calidad (suscriptores que ya te conocen) en las primeras horas hace que YouTube detecte un interés inusualmente alto y amplifique la distribución del vídeo.",
      metricasSprint:
        "Las dos métricas clave durante el sprint: CTR (porcentaje de clics sobre impresiones) y velocidad de visualización. Un CTR por encima del 5-7% es buena señal. Flechas rojas tras 24h = ejecutar SEO Swap inmediatamente.",
    },
    checks: {
      "sin-cambios-24h":
        "Regla de Romuald: durante las primeras 24h NO cambies nada — miniatura, título ni descripción. El sistema de notificaciones necesita ese tiempo para distribuirse. Si cambias antes, desvirtúas los datos del boost inicial.",
      "ctr-evaluado":
        "SEO Swap de emergencia: si el vídeo falla en sus primeras 24h (métricas con flechas rojas), cambia completamente miniatura y título por versiones más agresivas hasta que el tráfico en tiempo real suba. No esperes más de 24h para actuar.",
      "seorepesca-publicada":
        "SEOrepesca: post de comunidad para repescar a la audiencia que aún no ha visto el vídeo. Lánzalo el día 3, cuando el empuje inicial afloja — reactiva la conversación y envía una segunda ola de tráfico.",
    },
  },

  evergreen: {
    banner:
      "El evergreen es tu patrimonio. Cada vídeo bien posicionado es un activo que trabaja por ti sin que publiques nada nuevo. La estrategia Romuald: construir una base sólida de evergreens que empujen el tráfico hacia los sprints más recientes.",
    bannerDetalle:
      "A partir del día 30, el vídeo entra en modo patrimonio. Si tiene el 'ingrediente analítico' adecuado (retención y CTR decentes), puedes reactivarlo modificando metadatos. Los vídeos evergreen bien posicionados generan ingresos y visitas constantes aunque no subas nada en semanas.",
    campos: {
      archivar:
        "Si un vídeo tiene retención muy baja, CTR pésimo Y el tema ya no es relevante, considera archivarlo. Pero antes prueba un SEO Swap. Un vídeo con pocas visitas pero buena retención tiene potencial — trabájalo antes de tirarlo.",
    },
    checks: {
      "snapshot-dia30":
        "Abre la curva de retención en YouTube Analytics. Busca las caídas bruscas — ahí está el problema. Si hay un bloque que pierde el 30% de la audiencia, puedes recortarlo con SEOTE (el editor de YouTube permite cortar fragmentos de vídeos ya publicados).",
      "analisis-retencion-hecho":
        "Abre la curva de retención en YouTube Analytics. Busca las caídas bruscas — ahí está el problema. Si hay un bloque que pierde el 30% de la audiencia, puedes recortarlo con SEOTE sin re-subir el vídeo.",
      "decision-miniatura":
        "Cambia miniatura o título de un vídeo antiguo solo si: a) el CTR ha bajado mucho y el vídeo sigue teniendo tráfico de búsqueda, o b) quieres reactivar un vídeo estancado. Haz una versión más agresiva y dale 48h para ver si el CTR sube.",
      "decision-titulo":
        "Cambia miniatura o título de un vídeo antiguo solo si: a) el CTR ha bajado mucho y el vídeo sigue teniendo tráfico de búsqueda, o b) quieres reactivar un vídeo estancado. Haz una versión más agresiva y dale 48h para ver si el CTR sube.",
      "tarjetas-entrantes-anadidas":
        "Estrategia clave de Romuald: usa tarjetas en tus vídeos evergreen con mucho tráfico para enviar usuarios hacia tus nuevos lanzamientos en fase de sprint. El patrimonio evergreen actúa como un 'empujador' de tráfico para el contenido nuevo.",
    },
  },
};

export const GLOSARIO_ROMUALD: Array<{ termino: string; significado: string }> = [
  { termino: "Furiosos y furiosas del marketing", significado: "Así llama Romuald a su audiencia." },
  { termino: "Entrar a matar", significado: "El gancho inicial de los primeros 10 segundos." },
  { termino: "SEO cerdo", significado: "Aprovechar todo el contenido al máximo, sin desperdiciar nada." },
  { termino: "Pescaseo", significado: "La combinación estratégica de miniatura + título para pescar clics." },
  { termino: "Cadenas de reproducción", significado: "Serie de vídeos conectados para maximizar tiempo de sesión." },
  { termino: "Ennicharse", significado: "Especializarse en un nicho muy específico." },
  { termino: "SEO Swap", significado: "Cambiar miniatura y título de emergencia cuando las métricas fallan." },
  { termino: "SEOTE", significado: "Recorte de un vídeo ya publicado desde YouTube Studio, sin re-subirlo." },
  { termino: "Patrimonio", significado: "Los vídeos evergreen que generan ingresos pasivos constantes." },
];
