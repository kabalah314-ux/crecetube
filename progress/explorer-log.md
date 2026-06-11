# Explorer Log — T018: Fase de viabilidad del canal

**Tarea:** T018 — Fase SALTABLE de validación de idea/nicho para usuarios sin canal aún

---

## 1. Onboarding: cómo sabe la app que el usuario "no tiene canal"

`app/frontend/src/routes/Onboarding.tsx`

- **Paso 1** pregunta exactamente: "¿Ya tienes canal de YouTube?" con dos opciones: `tieneCanalYa = true` / `tieneCanalYa = false`. El campo `tieneCanalYa` se guarda en el perfil.
- **Paso 2** muestra el campo de URL del canal SOLO si `tieneCanalYa === true`. Si es falso, la URL queda `null`.
- Todos los campos del draft (`tieneCanalYa`, `canalNombre`, `canalUrl`, `nicho`, `nivel`, `frecuenciaObjetivo`, `objetivoPrincipal`, `iaKey`) se persisten en `localStorage` con key `crecetube.onboarding.draft`.
- Al llamar `createProfile()`, se envía `tieneCanalYa: Boolean(draft.tieneCanalYa)` al backend.
- **El campo `tieneCanalYa: boolean` existe en `UserProfile` (types.ts línea 17) y en el perfil del backend (profile.js línea 59).**

**Condición de entrada para la fase de viabilidad:** `profile.tieneCanalYa === false`. Se puede leer directamente del store: `useStore(s => s.profile).tieneCanalYa`.

---

## 2. Estructura de navegación y patrón para añadir ruta nueva

`app/frontend/src/App.tsx`

- Todas las rutas autenticadas viven dentro de `<RequireProfile>` → `<Layout />` como nested routes.
- Patrón exacto: añadir `<Route path="/viabilidad" element={<Viabilidad />} />` dentro del grupo que ya contiene `/dashboard`, `/videos`, `/curso`, etc. (App.tsx líneas 59–71).
- `RequireProfile` redirige a `/onboarding` si `profileStatus === "missing"`. Sin cambios necesarios aquí.

`app/frontend/src/components/Layout.tsx`

- El sidebar se construye a partir del array `NAV` (líneas 17–23). Para añadir un enlace de viabilidad: añadir una entrada `{ to: "/viabilidad", label: "Viabilidad", icon: Target, testid: "nav-viabilidad" }`.
- **El enlace debe mostrarse condicionalmente** si `profile.tieneCanalYa === false` O si el estudio no está completado. Actualmente NAV es un array de constantes fuera del componente; habría que pasarlo a dentro del componente o filtrar dentro del JSX usando `profile` del store. Es el único cambio no trivial en Layout.

---

## 3. Maquinaria del wizard de vídeos: reutilizable o no

`app/frontend/src/wizard/config.ts`, `app/frontend/src/routes/VideoWizard.tsx`, `app/frontend/src/wizard/Checklist.tsx`

El wizard de vídeos es **data-driven y muy acoplado al modelo `VideoProject`**:
- `STEPS: StepDef[]` en config.ts define 10 etapas. Cada `StepDef` referencia campos de `VideoProject` para los checks automáticos (`auto: (v: VideoProject) => boolean`).
- `useVideoProject` hace autosave via `PATCH /api/videos/:id` en cada cambio del proyecto.
- `Checklist` renderiza items con referencias directas a campos de `VideoProject`.
- `AiBlock` llama a `POST /api/ia/generar` pasando `videoProjectId`.

**Conclusión:** el wizard de vídeos NO es reutilizable directamente para viabilidad porque depende de `VideoProject`. Lo recomendable es **una página propia con pasos y estado local**, análoga al Onboarding (sin reusing de VideoWizard). Sí son reutilizables:
- `TipBanner` (con un objeto de consejos análogo a CONSEJOS)
- El patrón visual de `radio-card`, `card`, `field`, `progress-thin`, `btn` de los estilos existentes
- `AiBlock` para el paso de evaluación IA (pasando un `videoProjectId` vacío o fijo)

---

## 4. Persistencia: dónde encaja guardar el estudio de viabilidad

`app/backend/src/db.js`

**Esquema actual relevante:**
- `meta (key TEXT PRIMARY KEY, value TEXT)` — key-value global (courseStructure, seed versions)
- `profile (id TEXT PRIMARY KEY, data TEXT)` — perfil singleton JSON
- `course_progress (asignaturaId TEXT PRIMARY KEY, data TEXT)` — progreso por asignatura (key-value)

**Opciones evaluadas:**

**Opción A — tabla nueva `viabilidad` (RECOMENDADA):**
```sql
CREATE TABLE IF NOT EXISTS viabilidad (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  completado INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```
Singleton (solo un registro con `id = 'main'`). Fácil de leer/escribir con el mismo patrón `jparse`. Limpio y sin ambigüedad.

**Opción B — campo en el perfil:** añadir `viabilidad: {...}` al JSON de profile. Sencillo pero mezcla responsabilidades; el perfil tiene validaciones en profile.js que habría que ampliar.

**Opción C — tabla `meta`:** guardar como `meta('viabilidad', JSON.stringify({...}))`. Sin cambios de esquema pero semánticamente incorrecto (meta es para configuración del sistema).

**Recomendación: Opción A.** El backend añadiría `app/backend/src/routes/viabilidad.js` con `GET /api/viabilidad` y `PATCH /api/viabilidad` (upsert con `id = 'main'`). Siguiendo el mismo patrón de `course_progress` y el helper `jparse`.

---

## 5. Contenido disponible de s3/s4 en el curso seed

`app/guia_maestra/07_curso_seed.json`

### Asignaturas de s3 CON contenido (`contenido != ""`):
- `s3_a1` — "Tipos de vídeo: sprint vs evergreen vs mixto" — CONTENIDO COMPLETO
- `s3_a4` — "La fase sprint: los 7 días que definen tu vídeo" — CONTENIDO COMPLETO
- `s3_a8` — "Series vs vídeos sueltos: pros, contras y datos" — CONTENIDO COMPLETO
- `s3_a9` — "SEOhora: cuándo publicar según tu audiencia" — CONTENIDO COMPLETO

### Asignaturas de s3 SIN contenido (solo título):
- `s3_a2` (calendario editorial), `s3_a3` (método de las 3 fuentes), `s3_a5`, `s3_a6`, `s3_a7`, `s3_a10`

### Asignaturas de s4 CON contenido:
- `s4_a1` — "¿Qué es un nicho en YouTube? Mitos y realidad" — CONTENIDO COMPLETO (ennicharse, RPM, patrocinadores, sub-nichos)
- `s4_a2` — "El método del triángulo: pasión × demanda × competencia" — CONTENIDO COMPLETO

### Asignaturas de s4 SIN contenido (solo título):
- `s4_a3` (investigación demanda), `s4_a4` (sub-nichos), `s4_a5` (PVU), `s4_a6` (repositioning), `s4_a7`, `s4_a8` (validación rápida)

### Material en `app/frontend/src/wizard/consejos.ts` directamente reutilizable:
- `CONSEJOS.idea.campos.nicho` — "Cuanto más específico el nicho, menor la competencia..."
- `CONSEJOS.idea.checks["idea-validada-3-fuentes"]` — método de validación triple (YouTube Autocomplete, Google Keyword Planner, análisis de resultados)
- `CONSEJOS.investigacion.checks["angulo-diferencial-definido"]` — "rotura de patrón conceptual"
- `CONSEJOS.investigacion.checks["demanda-validada"]` — validación triple idéntica

**El implementor puede copiar/referenciar estos textos en un nuevo `consejosViabilidad.ts` o directamente en el componente.**

---

## 6. Patrón IA: AiBlock y generadores existentes

`app/frontend/src/wizard/AiBlock.tsx`

- Recibe `tipo`, `videoProjectId`, `etiqueta`, `opciones`, `render`, `disabledExtra`, `tip`.
- Detecta IA configurada: `profile?.iaConfig.apiKey === "***"`.
- Si no está configurada: botón disabled + link a `/configuracion`. **Degradación elegante ya implementada — reutilizable tal cual.**
- El `videoProjectId` puede ser `""` o un string fijo como `"viabilidad"`, ya que el backend solo lo usa para guardar la interacción y buscar snapshots (solo en `analisis_retencion`).

`app/backend/src/prompts.js` — `GENERADORES`

Los 9 generadores existentes: `seo_preguntas`, `titulo`, `miniatura_brief`, `hook`, `descripcion`, `hashtags`, `email`, `comunidad`, `analisis_retencion`.

**Se necesita un generador nuevo** (`evaluacion_nicho`) que el implementor debe añadir al objeto `GENERADORES`. Esquema sugerido:

```js
evaluacion_nicho: {
  maxTokens: 1000,
  temperatura: 0.6,
  user: (op) => `IDEA DE CANAL
Nicho declarado: ${op.nicho}
Idea: ${op.ideaCanal ?? "(sin especificar)"}
Nivel del creador: ${op.nivel ?? "principiante"}

Analiza la viabilidad de esta idea usando el método del triángulo (pasión × demanda × competencia).
Formato de salida EXCLUSIVAMENTE JSON:
{"demanda":{"nota":1-5,"razon":"..."},"competencia":{"nota":1-5,"razon":"..."},"diferenciacion":["sub-nicho 1","sub-nicho 2","sub-nicho 3"],"pvu":"propuesta de valor única en 1 frase","advertencias":["riesgo 1","riesgo 2"]}`,
  normalizar: (p) => (p?.pvu && p?.demanda ? [p] : null),
}
```

El endpoint `POST /api/ia/generar` ya acepta cualquier `tipo` registrado en `GENERADORES`, sin cambios en `ia.js`.

---

## 7. Impacto en tests

No hay archivos en `tests/` (Glob retornó vacío). No existen tests E2E con Playwright ni specs unitarios en el repositorio actualmente. **No hay riesgo de romper tests existentes.** Los data-testids a crear (sección 8) son los relevantes para futuros tests.

---

## 8. Recomendación concreta para el implementor

### Arquitectura propuesta

**Ruta frontend:** `/viabilidad` — página nueva `app/frontend/src/routes/Viabilidad.tsx`

**Condición de entrada y visibilidad:**
- Visible/ofrecida solo si `profile.tieneCanalYa === false`.
- Punto de entrada principal: banner en el Dashboard justo debajo del saludo, si `profile.tieneCanalYa === false && !viabilidadCompletada`.
- También accesible desde el sidebar (ítem condicional).
- **SALTABLE:** botón "Omitir por ahora" que navega a `/dashboard` sin guardar.
- Si el usuario ya completó el estudio (`viabilidad.completado === 1` en BD), no mostrar el banner del Dashboard, y opcionalmente ofrecer "Ver mi estudio" en el sidebar.

**5 pasos del estudio (estado local en React + PATCH al backend al avanzar):**

| Paso | ID | Contenido del paso | Fuente del texto guía |
|------|----|--------------------|----------------------|
| 1 | `idea` | Textarea: "Describe tu idea de canal" (nicho, tema, audiencia) | `CONSEJOS.idea.campos.nicho`; s4_a1 |
| 2 | `triangulo` | Check triple: pasión/conocimiento, demanda activa, competencia manejable — 3 preguntas con radio sí/no/parcial | s4_a2 contenido completo |
| 3 | `demanda` | Checklist de 3 fuentes: 1) YouTube Autocomplete, 2) Google Keyword Planner, 3) análisis de resultados | `CONSEJOS.idea.checks["idea-validada-3-fuentes"]`; s4_a3 |
| 4 | `diferenciacion` | Campo de texto: sub-nicho elegido + PVU en 1 frase | `CONSEJOS.investigacion.checks["angulo-diferencial-definido"]`; s4_a4, s4_a5 |
| 5 | `ia` | AiBlock con tipo `evaluacion_nicho` (saltable si no hay clave) | AiBlock reutilizado directamente |

**Estado del componente:**
```tsx
const [paso, setPaso] = useState(0);
const [datos, setDatos] = useState<EstudioViabilidad>({
  ideaCanal: "",
  trianguloRespuestas: {},
  fuentesValidadas: [],
  subNicho: "",
  pvu: "",
  evaluacionIA: null,
});
```

**Modelo de datos guardado en BD (`viabilidad` tabla):**
```json
{
  "ideaCanal": "string",
  "trianguloRespuestas": { "pasion": "si|no|parcial", "demanda": "si|no|parcial", "competencia": "si|no|parcial" },
  "fuentesValidadas": ["autocomplete", "keyword_planner", "analisis_resultados"],
  "subNicho": "string",
  "pvu": "string",
  "evaluacionIA": { /* respuesta parseada del generador */ }
}
```

### Archivos a crear

| Ruta | Motivo |
|------|--------|
| `app/frontend/src/routes/Viabilidad.tsx` | Página principal con stepper propio (sin VideoProject) |
| `app/backend/src/routes/viabilidad.js` | GET y PATCH del estudio singleton (`id='main'`) |

### Archivos a modificar

| Ruta | Qué añadir |
|------|-----------|
| `app/frontend/src/App.tsx` | `<Route path="/viabilidad" element={<Viabilidad />} />` dentro del grupo RequireProfile |
| `app/frontend/src/components/Layout.tsx` | Ítem condicional en NAV: usar `profile` del store dentro del componente para filtrar |
| `app/backend/src/db.js` | Añadir tabla `viabilidad` al SCHEMA (bloque CREATE TABLE) |
| `app/backend/src/server.js` | `import viabilidadRoutes` + `app.use("/api/viabilidad", viabilidadRoutes)` |
| `app/backend/src/prompts.js` | Añadir entrada `evaluacion_nicho` al objeto `GENERADORES` |
| `app/frontend/src/i18n/es.ts` | Añadir bloque `viabilidad: { ... }` con todos los strings |
| `app/frontend/src/routes/Dashboard.tsx` | Banner condicional si `profile.tieneCanalYa === false && !completado` |

### data-testids a crear

- `nav-viabilidad` — ítem del sidebar
- `viabilidad-skip` — botón "Omitir por ahora"
- `viabilidad-step-{0..4}` — cada paso del stepper
- `viabilidad-next` — botón Siguiente
- `viabilidad-back` — botón Atrás
- `viabilidad-complete` — botón "Finalizar estudio"
- `ai-generate-evaluacion_nicho` — ya generado automáticamente por AiBlock con la convención `ai-generate-${tipo}`
- `dashboard-viabilidad-banner` — banner en el Dashboard

---

## Convenciones a respetar

- Exports nombrados: `export function Viabilidad()` — sin default export (igual que el resto de routes)
- Strings en `es.ts`, nunca literales en JSX
- localStorage prefix `ct.` para cualquier estado persistido localmente
- CSS: clases kebab-case, variables de tokens CSS, sin valores hardcodeados
- TypeScript sin `any`; interfaces inline para las props
- El generador `evaluacion_nicho` debe añadirse ANTES de que el frontend lo use, o el backend responderá `VALIDATION_ERROR: Generador desconocido`

---

## Riesgos

1. **Layout.tsx NAV estático:** actualmente es un array de constantes FUERA del componente. Para hacerlo condicional hay que moverlo DENTRO de `Layout()` o filtrar dentro del JSX con `profile` del store. Zona frágil porque afecta a toda la navegación; cambio mínimo pero hay que hacerlo bien.

2. **`tieneCanalYa` puede cambiar:** si el usuario actualiza su perfil en `/configuracion` y marca que ya tiene canal, el ítem de sidebar debería desaparecer. Esto funciona automáticamente si el filtro usa `profile` del store (reactivo).

3. **AiBlock sin videoProjectId real:** `videoProjectId` quedaría `"viabilidad"` (string fijo) o `""`. El backend lo acepta en `ai_interactions.videoProjectId` como cualquier string. No hay problema funcional.

4. **Generador `evaluacion_nicho` faltante:** si el frontend se despliega antes del backend actualizado, el botón "Generar" devuelve error. Solución: desplegar backend primero, o añadir el generador en el mismo commit.

5. **Sin tests E2E:** no hay tests actualmente. Si se añaden en el futuro, el flujo crítico a cubrir es: `onboarding con tieneCanalYa=false → dashboard → banner → /viabilidad → skip → /dashboard`.
