// viabilidadReglas — T025: textos del método para el estudio de viabilidad.
// Única fuente de verdad compartida entre los TipViabilidad de Viabilidad.tsx y las
// reglas Romuald que viajan a la IA en opciones.reglaCampo (wizard/camposIA.ts).
// Archivo propio (no se exporta desde Viabilidad.tsx) para evitar el ciclo de imports
// Viabilidad.tsx → FieldIA.tsx → camposIA.ts → Viabilidad.tsx.

export const TIPS_VIABILIDAD = {
  /** Paso 1 — Tu idea */
  idea: "Romuald insiste: 'Cuanto más específico el nicho, menor la competencia y mayor el RPM de los anunciantes.' No busques un tema que te guste, busca el hueco donde la demanda supera la oferta.",
  /** Paso 2 — Demanda */
  demanda:
    "Método de validación triple de Romuald: 1) YouTube Autocomplete — escribe tu tema y anota las sugerencias que aparecen. 2) Google Keyword Planner — ¿hay anunciantes pujando por esas palabras? 3) Analiza los primeros resultados — ¿hay vídeos con pocas vistas a pesar de tener meses? Ahí está el hueco.",
  /** Paso 3 — Competencia y hueco */
  hueco:
    "Ángulo diferencial = rotura de patrón conceptual. Pregúntate: ¿qué hace el 90% de los canales de mi nicho en sus miniaturas, títulos y estructuras? Haz lo opuesto o mejóralo radicalmente. Sin hueco identificado, eres uno más.",
  /** Paso 4 — Sub-nicho y PVU */
  triangulo:
    "El método del triángulo de Romuald: pasión (¿lo harás aunque no pagues?) × demanda activa (¿la gente lo busca ya?) × competencia manejable (¿puedes diferenciarte?). Si los tres lados son positivos, tienes un negocio. Si falta uno, ajusta.",
} as const;

// Regla por campo = tip del paso correspondiente + matiz específico del campo
// (incluida la guardia anti-alucinación de búsquedas/canales del lote B de T024).
// El backend trunca opciones.reglaCampo a ≤1200 chars; el combo más largo ronda los 550.
export const REGLAS_CAMPO_VIABILIDAD: Record<string, string> = {
  "viabilidad.ideaCanal": TIPS_VIABILIDAD.idea,
  "viabilidad.aQuienAyuda": `${TIPS_VIABILIDAD.idea} Describe a una persona concreta con un problema concreto que el canal le resuelve; nada de "todo el mundo".`,
  // Sin TipViabilidad propio en pantalla: el formato no tiene tip de paso asociado.
  "viabilidad.formatoPrevisto":
    "Formato realista para empezar: duración, estilo (tutorial, vlog, con o sin cámara) y si será evergreen o tendencia. Consistencia > volumen.",
  "viabilidad.busquedasEncontradas": `${TIPS_VIABILIDAD.demanda} Sugiere búsquedas semilla PARA COMPROBAR en el autocompletar de YouTube; nunca inventes resultados ni cifras de demanda.`,
  "viabilidad.canalesReferencia": `${TIPS_VIABILIDAD.demanda} Si no hay competencia, es señal de peligro: la competencia valida el mercado. Sugiere consultas de búsqueda para ENCONTRAR canales que ya funcionan en el nicho; nunca inventes nombres de canales ni cifras.`,
  "viabilidad.anguloReferencia": TIPS_VIABILIDAD.hueco,
  "viabilidad.subNicho": `${TIPS_VIABILIDAD.triangulo} Ennicharse: cuanto más específico el sub-nicho, menos competencia directa y más fácil posicionar. Propón sub-nichos concretos partiendo de la idea inicial, no categorías amplias.`,
  "viabilidad.pvu": `${TIPS_VIABILIDAD.triangulo} La PVU es UNA sola frase que deja claro por qué este canal y no otro: «el único canal que…».`,
};
