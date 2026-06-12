# Explorer Log — T019: Recomendador IA de temas con el conocimiento recopilado

**Tarea:** T019 — Generador IA que recomiende temas de vídeo usando el corpus del método Romuald + datos del canal del usuario.

---

## 1. LOS 9 GENERADORES ACTUALES Y CÓMO ENCAJA UNO NUEVO

**Estructura actual** (`app/backend/src/prompts.js` + `app/backend/src/routes/ia.js`):

- Cada generador en `GENERADORES` tiene: `maxTokens`, `temperatura`, `user(opciones, ctx)` (función que devuelve el prompt de usuario), `normalizar(parsed)` (validador → devuelve `resultados[]` o `null`).
- El endpoint `POST /api/ia/generar` recibe `{ tipo, videoProjectId, opciones }`. Carga el perfil, carga el vídeo si `videoProjectId` existe, llama a `construirContexto(profile, video)` y ejecuta el generador.
- El historial se guarda en `ai_interactions` con `videoProjectId` que puede ser `null`.
- Todos los generadores actuales asumen un vídeo concreto en contexto (excepto `evaluacion_nicho`, que usa opciones ad-hoc sin `videoProjectId`).

**Patrón clave encontrado en `evaluacion_nicho`:** es el precedente perfecto. Recibe `opciones` directamente (nicho, ideaCanal, nivel, etc.) sin depender de ningún `videoProjectId`. Su `videoProjectId` queda como `null` en el historial. El generador `temas_canal` puede seguir exactamente el mismo patrón.

**Encaje del generador `temas_canal`:**
- `videoProjectId`: siempre `null` (no está ligado a un vídeo).
- `opciones` recibidas: `{ titulosExistentes?: string[], metricasResumen?: string }` — el frontend los construye y los envía.
- El perfil ya cargado por el endpoint aporta: `canalNombre`, `nicho`, `nivel`, `objetivoPrincipal`.
- `construirContexto(profile, null)` ya genera el bloque `CONTEXTO DEL CANAL` automáticamente — se reutiliza sin cambios.
- El prompt de usuario añade encima el corpus distilado del seed + la lista de títulos existentes.

**Sin cambios al enrutamiento**: el endpoint `POST /api/ia/generar` ya maneja `videoProjectId = null` correctamente (línea 67: `videoProjectId: video?.id ?? null`). Solo hay que añadir el generador al objeto `GENERADORES`.

---

## 2. EL CORPUS: MEDICIÓN Y ESTRATEGIA DE INYECCIÓN

**Contenido real en `07_curso_seed.json`** (63 asignaturas con `contenido` no vacío de 169 totales):

Las secciones más relevantes para ideación de temas y su contenido redactado:

| Sección | Título | Asignaturas con contenido |
|---------|--------|--------------------------|
| s1 | Primeros pasos | 1 (s1_a7 ~3.200 chars) |
| s3 | Estrategia de contenido | 4 (s3_a1 sprint/evergreen ~2.800, s3_a4 fase sprint ~3.600, s3_a8 series ~3.200, s3_a9 SEOhora ~2.100) |
| s4 | Nichos y posicionamiento | 5 (s4_a1 ~2.800, s4_a2 triángulo ~3.000, s4_a4 sub-nichos ~2.600, s4_a5 PVU ~2.700, s4_a8 validación ~2.700) |
| s6 | Títulos irresistibles | 5 (s6_a1 psicología clic ~2.700, s6_a2 fórmulas ~2.800, s6_a3 SEO en títulos ~3.100, s6_a7 IA+títulos ~2.700, s6_a8 provisional vs final ~2.800) |

**Total útil para ideación**: ~38.800 caracteres brutos en estas 3 secciones (aprox. 9.700 tokens). Excesivo para un solo prompt si se incluye todo.

**Estrategia de distilado propuesta (módulo `corpus.js`):**

Crear `app/backend/src/corpus.js` que:
1. Importa el seed desde `../../guia_maestra/07_curso_seed.json` (importación estática JSON).
2. Expone `extraerCorpusIdeacion(maxChars = 4000)`:
   - Filtra secciones `["s3", "s4", "s6"]`.
   - Para cada sección: incluye solo asignaturas con `contenido` no vacío.
   - De cada asignatura: toma `titulo` + los primeros N caracteres de `contenido` (proporcional al presupuesto).
   - Trunca globalmente hasta `maxChars`.
   - Retorna un string formateado `## [titulo sección]\n### [titulo asignatura]\n[contenido truncado]\n`.
3. La función se llama en runtime cada vez que se genera, por lo que **mejora automáticamente** cuando se añade contenido al seed sin tocar código.

**Presupuesto de tokens propuesto:**
- Corpus distilado: 4.000 chars (~1.000 tokens)  
- Contexto del canal (perfil): ~200 chars  
- Lista de títulos existentes: máx. 2.000 chars (~500 tokens)  
- Instrucción del generador: ~600 chars  
- **Total prompt usuario: ~6.800 chars (~1.700 tokens)**  
- `maxTokens` para respuesta: 1.200 tokens (7 temas con campos)  
- Budget total: ~3.000 tokens por llamada. Cómodo para cualquier modelo.

**`consejos.ts`** — ya está en el frontend (no se puede importar desde el backend directamente). El corpus del seed es la fuente canónica de conocimiento; `consejos.ts` es complementario para el wizard. No necesita incluirse en el prompt backend.

**Glosario `GLOSARIO_ROMUALD`** — 9 entradas, ~800 chars. Se puede incluir íntegro en el SYSTEM_BASE sin presupuesto adicional, o simplemente en el prompt de sistema ya que `SYSTEM_BASE` ya incluye los términos clave (Pescaseo, SEO Swap, SEOTE, etc.).

---

## 3. DATOS DEL USUARIO A INCLUIR

**Perfil** (`/api/profile` → `getProfileRow(db)`): disponible en el endpoint `/api/ia/generar` — ya se carga. Campos útiles: `canalNombre`, `nicho`, `nivel`, `objetivoPrincipal`. Ya los recoge `construirContexto(profile, null)`.

**Títulos existentes**: el endpoint necesita hacer `db.all("SELECT data FROM videos WHERE estado != 'archivado'")` y extraer `tituloFinal ?? tituloIdea` de cada vídeo. Esto se hace dentro del generador en el route handler, igual que lo hace `analisis_retencion` con los snapshots. Se serializan como lista bulleted y se pasan como `opciones.titulosExistentes` al `user()` del generador.

**Métricas**: `GET /api/metricas/resumen` ya devuelve `vistasTotales`, `ctrMedio`, `retencionMedia`, `videosConMetricas`. Se puede pasar como `opciones.metricasResumen` (string serializado) pero es opcional — si no hay métricas, se omite sin romper nada.

**Carga en el route handler**: el implementor añade en `routes/ia.js`, dentro del bloque `POST /generar`, un bloque específico para `tipo === "temas_canal"` (igual al bloque de `analisis_retencion`):
```js
if (tipo === "temas_canal") {
  const videos = await db.all("SELECT data FROM videos WHERE estado != 'archivado'");
  const titulos = videos.map(jparse).map(v => v.tituloFinal ?? v.tituloIdea).filter(Boolean);
  opciones.titulosExistentes = titulos;
}
```

**Compatibilidad multi-usuario (T020 futura)**: `getProfileRow` y la query de vídeos deberán escoparse por `req.userId` cuando llegue ese cambio. El diseño de T019 no introduce acoplamiento nuevo: usa las mismas funciones singleton que el resto de rutas. El reviewr deberá anotar en su log que cuando llegue multi-usuario hay que añadir `WHERE userId=req.userId` aquí.

---

## 4. UI: DÓNDE Y CÓMO ENCAJA

**`AiBlock` actual** (en `app/frontend/src/wizard/AiBlock.tsx`):
- Requiere `tipo: string`, `videoProjectId: string`, `etiqueta`, `render`, opciones opcionales.
- **Problema**: `videoProjectId` es requerido en la interfaz Props. Para el recomendador de temas, no hay vídeo. Hay que cambiar `videoProjectId` a `videoProjectId?: string | null` y actualizar el cuerpo del `api.post` para omitirlo o enviarlo como `null`.

**Opciones de UI evaluadas:**

| Opción | Fricción | Contexto natural | Verdict |
|--------|----------|-----------------|---------|
| Bloque en Dashboard | Mínima (un clic desde home) | Sí: justo al iniciar sesión buscas ideas | **MEJOR** |
| Página propia `/ideas` | Media (nueva ruta) | Sí, pero overhead de navegación | Secundaria |
| StepIdea del wizard | Media (dentro del wizard) | Parcial: ya tienes idea si estás aquí | No ideal |
| Botón en VideosList | Media | Razonable pero no prioritario | Alternativa |

**Recomendación de UI**: un bloque `IdeaBlock` en el Dashboard, debajo de los KPIs y antes de "Continuar donde lo dejaste", con botón "Sugerir temas para mi canal". No requiere ruta nueva. Al pulsar llama al endpoint, muestra las cards de temas debajo.

**Alternativa mínima (sin nuevo componente)**: reutilizar `AiBlock` con `videoProjectId={null}` si se hace la interfaz opcional. Las cards del render serían el nuevo componente de presentación de temas.

**data-testids propuestos:**
- `ai-ideas-generate` — botón principal
- `ai-ideas-result` — contenedor de resultados
- `ai-idea-card-{n}` — cada card de tema
- `ai-idea-card-cta-{n}` — CTA "Crear vídeo con esta idea" que pre-rellena el wizard

---

## 5. SALIDA DEL GENERADOR Y NORMALIZADOR

**Nombre del tipo:** `temas_canal`

**JSON de salida propuesto:**
```json
{
  "temas": [
    {
      "titulo": "Cómo ganar 4.500€ al mes con YouTube siendo pequeño",
      "angulo": "dato concreto + promesa alcanzable",
      "porQueFunciona": "Usa fórmula número+resultado del método. Alta demanda evergreen. KW directa.",
      "formato": "long",
      "tipo": "evergreen",
      "dificultad": "media"
    }
  ]
}
```

**Campos por tema:** `titulo` (string, ≤100 chars), `angulo` (string corto), `porQueFunciona` (string, criterio del método), `formato` ("long"|"short"|"live"), `tipo` ("evergreen"|"sprint"|"mixto"), `dificultad` ("baja"|"media"|"alta").

**Normalizador:**
```js
normalizar: (p) => {
  const lista = Array.isArray(p?.temas) ? p.temas : null;
  if (!lista) return null;
  const FORMATOS = ["long","short","live","podcast"];
  const TIPOS = ["evergreen","sprint","mixto"];
  const DIFS = ["baja","media","alta"];
  const out = lista
    .filter(t => typeof t?.titulo === "string" && t.titulo.trim())
    .map(t => ({
      titulo: t.titulo.trim().slice(0, 100),
      angulo: typeof t.angulo === "string" ? t.angulo.slice(0, 120) : null,
      porQueFunciona: typeof t.porQueFunciona === "string" ? t.porQueFunciona.slice(0, 300) : null,
      formato: FORMATOS.includes(t.formato) ? t.formato : "long",
      tipo: TIPOS.includes(t.tipo) ? t.tipo : "evergreen",
      dificultad: DIFS.includes(t.dificultad) ? t.dificultad : "media",
    }));
  return out.length ? out : null;
}
```

---

## 6. COMPATIBILIDAD CON TAREA MULTI-USUARIO EN CURSO

La tarea paralela añade `userId`/`canalId` al backend. El diseño de T019:
- Usa `getProfileRow(db)` — cuando se escopé por userId, esa función cambiará de firma. El implementor NO debe cambiar `getProfileRow`; solo usar la misma llamada que el resto de routes.
- La query de vídeos usa `db.all("SELECT data FROM videos...")` — igual que `routes/videos.js`. Cuando llegue multi-usuario, se añade `WHERE canalId=req.canalId` en ambos sitios simultáneamente.
- No hay acoplamiento estructural nuevo: T019 sigue exactamente el mismo patrón singleton que el resto.

---

## 7. IMPACTO EN TESTS

**Tests a añadir en `app/backend/tests/ia-metricas.test.mjs`** (misma suite, al final del bloque existente):

1. `temas_canal sin títulos existentes → resultados normalizados (≥3 temas)` — stub que devuelve JSON válido con 5 temas.
2. `temas_canal videoProjectId omitido → registra en historial con videoProjectId=null` — verificar que `interaction.videoProjectId` sea null.
3. `temas_canal JSON inválido → degradación elegante (parseFallido=true)` — igual que el test de hook existente.

**Cambio en `AiBlock.tsx`**: `videoProjectId?: string | null`. Revisar que ningún uso actual de AiBlock rompa con TypeScript al volver el campo opcional (todos los usos actuales están en steps del wizard donde ya tienen el id — compatible).

---

## 8. ARCHIVOS A CREAR O MODIFICAR

| Archivo | Acción | Motivo |
|---------|--------|--------|
| `app/backend/src/corpus.js` | **CREAR** | Módulo que destila el seed para el prompt. Se importa en `prompts.js`. |
| `app/backend/src/prompts.js` | **MODIFICAR** | Añadir generador `temas_canal` al objeto `GENERADORES` (import `extraerCorpusIdeacion` desde `corpus.js`). |
| `app/backend/src/routes/ia.js` | **MODIFICAR** | Añadir bloque específico `if (tipo === "temas_canal")` para cargar títulos existentes en `opciones` antes de llamar al generador. |
| `app/frontend/src/wizard/AiBlock.tsx` | **MODIFICAR** | `videoProjectId?: string \| null` (campo opcional). Pasar `null` al body del POST si no hay id. |
| `app/frontend/src/routes/Dashboard.tsx` | **MODIFICAR** | Añadir bloque `IdeaBlock` o inline `AiBlock` con `tipo="temas_canal"` y render de cards de temas. |
| `app/frontend/src/i18n/es.ts` | **MODIFICAR** | Añadir strings: etiqueta del generador, labels de cards (formato, tipo, dificultad), CTA "Crear vídeo". |
| `app/backend/tests/ia-metricas.test.mjs` | **MODIFICAR** | 3 nuevos subtests para `temas_canal`. |

---

## 9. CONVENCIONES A RESPETAR

- **Generadores**: función `user(opciones)` pura que devuelve string, sin side-effects. `normalizar(parsed)` devuelve array o null, nunca lanza.
- **`truncar(s, n)`** de `prompts.js` ya existe y debe usarse para recortar el corpus en el prompt.
- **`extraerJson`** de `prompts.js` ya maneja fences y bloques — no reinventar.
- **Patrón route**: `h(async (req,res) => {...})` con `ApiError` para errores. Ver `viabilidad.js` como patrón más simple.
- **data-testid**: kebab-case con prefijo del componente, e.g. `ai-ideas-generate`.
- **i18n**: todos los strings visibles van a `es.ts` — no hardcodear texto en componentes.
- **Import del seed**: `import seedJson from "../../guia_maestra/07_curso_seed.json" assert { type: "json" }` (Node ≥18 con flag). Alternativa más segura: `createRequire` o `fs.readFileSync` + `JSON.parse` en la función, así no falla si el archivo crece. El patrón de `routes/curso.js` resuelve cómo lo hace el proyecto actualmente.

---

## 10. RIESGOS Y ZONAS FRÁGILES

1. **Tamaño del seed en runtime**: 07_curso_seed.json ya tiene 63 asignaturas con contenido. Con 169 completas puede llegar a ~500KB. La función `extraerCorpusIdeacion` DEBE truncar a `maxChars` para no exceder el context window. Nunca pasar el seed completo al LLM.
2. **Import JSON en ESM (Node)**: el proyecto usa ESM (`"type": "module"` esperado). Los assert de importación JSON están deprecados en Node 22+. Preferir `fs.readFileSync` + `JSON.parse` en `corpus.js` para máxima compatibilidad.
3. **AiBlock con videoProjectId null**: el tipo actual es `string` no opcional. TypeScript fallará en los usos del Dashboard si no se hace la interfaz opcional. Hay que hacer el cambio coordinado (interfaz + todos los usos actuales son compatibles porque tienen id real).
4. **Historial sin videoProjectId**: la query `GET /api/ia/historial?videoProjectId=X` filtra por id — las interacciones de `temas_canal` (videoProjectId=null) no aparecerían en ese filtro. Correcto: no están asociadas a ningún vídeo. El Dashboard puede hacer `GET /api/ia/historial?tipo=temas_canal` para recuperarlas.
5. **Patrón de import del seed en corpus.js**: verificar cómo `routes/curso.js` carga el seed actualmente para replicar exactamente el mismo patrón.

---

## RECOMENDACIÓN: PLAN DE IMPLEMENTACIÓN EN PASOS

**Paso 1 — `corpus.js`**: crear el módulo backend con `extraerCorpusIdeacion(maxChars=4000)`. Lee el seed con `fs.readFileSync`, filtra secciones `s3/s4/s6`, extrae solo asignaturas con contenido, trunca globalmente. Exportar también `VERSION_CORPUS` = `seed.version` para que el prompt lo mencione (útil para debug).

**Paso 2 — `prompts.js`**: añadir `temas_canal` al objeto `GENERADORES`. El prompt `user()` usa `extraerCorpusIdeacion()` + `opciones.titulosExistentes` + `opciones.metricasResumen`. Pedir `{"temas": [...]}` con la estructura definida. `maxTokens: 1200`, `temperatura: 0.9`.

**Paso 3 — `routes/ia.js`**: añadir bloque `if (tipo === "temas_canal")` para poblar `opciones.titulosExistentes` antes de construir el prompt.

**Paso 4 — `AiBlock.tsx`**: hacer `videoProjectId` opcional. Pasar `null` si no se provee. Sin cambios en el comportamiento para los usos existentes.

**Paso 5 — `Dashboard.tsx`**: añadir bloque de recomendación de temas. Usar `AiBlock` con `videoProjectId={null}` y `tipo="temas_canal"`. El `render` pinta cards con los 5-7 temas sugeridos, cada uno con botón "Crear vídeo con esta idea" que navega a `/videos/nuevo?idea=encodedTitle`.

**Paso 6 — `es.ts`**: añadir strings necesarios.

**Paso 7 — Tests**: 3 subtests en `ia-metricas.test.mjs`.

**Paso 8 — Verificar**: `tsc --noEmit`, `node --test app/backend/tests/ia-metricas.test.mjs`.
