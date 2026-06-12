# Explorer Log — T021 + T022

**Fecha:** 2026-06-12
**Tareas:** T021 (onboarding adaptativo) + T022 (cadena del método: requisitos por generador + sugerir_nombres_canal)

---

## PARTE 1 — T021: ONBOARDING ADAPTATIVO

### 1. Estructura actual del onboarding (Onboarding.tsx)

Pasos numerados de 0 a 9 (10 en total con T017):

| Paso | Contenido | Validación actual |
|------|-----------|-------------------|
| 0 | Pantalla bienvenida + botón "Empezar" | ninguna |
| 1 | ¿Tienes canal? (tieneCanalYa: true/false) | null = error |
| 2 | ¿Un canal o varios? (gestionMulticanal) | null = error |
| 3 | Nombre del canal + URL (solo si tieneCanalYa) | nombre obligatorio, URL con urlValida() si tieneCanalYa |
| 4 | Nicho: input texto libre + chips de lista cerrada NICHOS[] | nicho.trim() no vacío = obligatorio |
| 5 | Nivel (principiante/intermedio/avanzado) | nivel no null |
| 6 | Frecuencia objetivo (objeto es.frecuencias) | frecuenciaObjetivo no null |
| 7 | Objetivo principal (objeto es.objetivos) | objetivoPrincipal no null |
| 8 | IA key con probarConexion | opcional, skip disponible |
| 9 | Resumen con botones "Editar" que saltan al paso indicado | submit = crear() |

**Barra de progreso:** `(paso / 9) * 100` — hardcodeado a 9. El "Paso X de 9" también es hardcodeado.

**Draft:** interface `Draft` en localStorage con clave `crecetube.onboarding.draft`. Carga en `useMemo(loadDraft)` al montar.

**`next()`:** llama `valida(paso)` y avanza con `Math.min(paso + 1, 9)`. El flujo es secuencial lineal, sin bifurcaciones.

**`crear()`:** envía `canalNombre: draft.canalNombre.trim()` y `nicho: draft.nicho.trim()` — ambos se pasan como string. Si son vacíos tras trim, el backend rechaza con 422.

---

### 2. Nicho actual: lista cerrada + texto libre

`NICHOS` = `["cocina", "gaming", "finanzas", "tecnología", "fitness", "educación", "viajes", "humor"]` (constante en el propio componente).

El paso 4 combina input libre (placeholder "Ej: cocina vegana...") + chips que hacen `set("nicho", n)`. No hay "Otro: escríbelo tú" (no hace falta: ya hay input libre) ni "Aún no lo sé" (nicho null).

**Añadir "Aún no lo sé":** añadir un chip/botón extra que haga `set("nicho", null)` y en `valida(caso 4)` devolver `""` si `draft.nicho === null` (bypass de la obligatoriedad).

---

### 3. Campos del perfil: puntos que asumen non-null

#### Backend — `routes/profile.js` `validate()`
- `canalNombre`: `assert422(typeof body.canalNombre === "string" && body.canalNombre.trim().length >= 1 && body.canalNombre.length <= 80, ...)` — **ROMPE** si canalNombre es null o string vacío.
- `nicho`: `assert422(typeof body.nicho === "string" && body.nicho.trim().length >= 1 && body.nicho.length <= 60, ...)` — **ROMPE** si nicho es null o string vacío.
- `frecuenciaObjetivo`: `FRECUENCIAS.includes(body.frecuenciaObjetivo)` — **ROMPE** si es null; "Aún no lo sé" requiere añadir valor centinela `"no_se"` a `FRECUENCIAS` O hacer el campo nullable con validación condicional.

La función `validate()` se llama tanto en POST (crear) como en PATCH (guardar desde Settings.tsx) → los cambios de nullabilidad deben aplicarse a ambos paths.

#### Backend — `db.js` migración v2
- `perfil?.canalNombre || "Mi canal"` — usa `||` así que soporta null/vacío con fallback. Sin riesgo.

#### Backend — `prompts.js` `construirContexto()`
- Línea 26: `- Canal: ${profile.canalNombre} · Nicho: ${profile.nicho} · ...` — si canalNombre/nicho son null, la cadena literalmente imprime "null". Riesgo menor. Mejorar con `?? "(sin especificar)"`.

#### Frontend — `Dashboard.tsx` línea 77
```
<h1>Hola, {profile?.canalNombre ?? "creador"}</h1>
```
Ya tiene fallback `"creador"`. OK sin cambios.

#### Frontend — `Dashboard.tsx` línea 79
```
<p>{profile?.nicho} · objetivo: ...</p>
```
Si nicho es null, renderiza "null · objetivo: ...". **ROMPE visualmente.** Necesita `{profile?.nicho ?? ""}` o condición `{profile?.nicho && <>{profile.nicho} · </>}`.

#### Frontend — `Settings.tsx` líneas 25-30
```js
const [perfil, setPerfil] = useState({
  canalNombre: profile.canalNombre,   // si null → campo input con valor null
  nicho: profile.nicho,               // idem
  ...
});
```
- `input value={perfil.canalNombre}` — React warning si value es null; necesita `?? ""`.
- `guardarPerfil()` envía `{ ...perfil, canalUrl: perfil.canalUrl || null }` — si canalNombre="" y nicho="" el backend rechaza si la validación sigue siendo obligatoria. Settings.tsx debe permitir guardar vacío (nulls) una vez el backend lo acepte.
- La lógica de frecuencia en Settings usa `<select value={perfil.frecuenciaObjetivo}>` — si se añade "no_se", necesita opción correspondiente.

#### Frontend — `useStore.ts` `createProfile()` / `patchProfile()`
No hace validación propia; pasa directo al backend. Sin cambios estructurales.

#### Frontend — `Onboarding.tsx` `crear()` línea 130
```js
canalNombre: draft.canalNombre.trim(),
nicho: draft.nicho.trim(),
```
Si `draft.canalNombre` es null, `.trim()` lanza TypeError. Debe ser `(draft.canalNombre ?? "").trim() || null`.

#### Frontend — `Onboarding.tsx` resumen paso 9
```js
[es.onboarding.nombreCanal, draft.canalNombre, 3],
["Nicho", draft.nicho, 4],
```
Si son null, la celda `<dd>null</dd>` se renderiza literalmente. Necesita `draft.canalNombre ?? "Sin nombre aún"` y `draft.nicho ?? "Aún no lo sé"`.

#### Frontend — `es.ts` línea 76
```ts
bienvenidaToast: (nombre: string) => `Tu espacio está listo, ${nombre}.`
```
Llamado en `crear()` con `p.canalNombre` que puede ser null. La función acepta `string` — se rompe el tipo. Debe aceptar `string | null` y usar fallback `nombre ?? "creador"`.

---

### 4. Introducir la bifurcación tras el paso 1

#### Lógica de bifurcación

| Campo | Rama tieneCanalYa=true | Rama tieneCanalYa=false |
|-------|------------------------|------------------------|
| Paso 2 (multicanal) | SÍ aparece | NO aparece — `gestionMulticanal = false` automático |
| Paso 3 texto | "Tu canal" | "¿Cómo se llamará tu canal?" (ya existe `tuCanalTituloNuevo` en es.ts) |
| Paso 3 nombre | obligatorio (1-80 chars) | opcional: acepta vacío → null ("Todavía no") |
| Paso 3 URL | aparece (ya condicional a tieneCanalYa) | no aparece |
| Paso 4 nicho | chips + libre + "No lo tengo claro" | chips + libre + "Aún no lo sé" (mismo null) |
| Paso 6 frecuencia | como hoy | añadir opción "Aún no lo sé" (null) |

**Numeración dinámica:** la barra de progreso y el "Paso X de N" deben calcularse sobre el total real de pasos activos de la rama. Propuesta: función `pasosActivos(draft): number[]` que devuelve array de indices de pasos visibles → `totalPasos = pasosActivos.length`, `pasoVisual = pasosActivos.indexOf(paso) + 1`.

Con tieneCanalYa=false: pasos activos = [0,1,3,4,5,6,7,8,9] → total=9 pasos visibles (sin paso 2).
Con tieneCanalYa=true: pasos activos = [0,1,2,3,4,5,6,7,8,9] → total=10 pasos.
Con tieneCanalYa=null (antes de paso 1): total=10 por defecto (para que la barra no salte al seleccionar).

**`next()` con bifurcación:** en vez de `paso + 1`, usar `siguientePasoActivo(paso, draft)` que devuelve el siguiente índice en `pasosActivos(draft)`. Análogamente `anteriorPasoActivo(paso, draft)` para el botón "Atrás".

**Validación del paso 3 en rama sin canal:** si `tieneCanalYa === false`, el nombre es opcional → `valida(3)` devuelve `""` también cuando `canalNombre` está vacío/null.

---

### 5. Banner de viabilidad del Dashboard — ampliación

El banner actual (Dashboard.tsx líneas 87-113) se muestra cuando:
```
profile?.tieneCanalYa === false && viabilidad !== undefined && !viabilidad?.completado && !viabilidad?.saltado
```

T021 requiere "recomendación fuerte" también cuando nicho o nombre son null. La condición a ampliar:
```
mostrarBannerViabilidad =
  (profile?.tieneCanalYa === false || !profile?.canalNombre || !profile?.nicho)
  && viabilidad !== undefined
  && !viabilidad?.completado
  && !viabilidad?.saltado
```

Para la variante "sin nicho/nombre" la carga de viabilidad se hace en el `useEffect` que hoy solo se ejecuta si `tieneCanalYa === false`. Debe ampliarse la dependencia del useEffect a cubrir los tres casos.

---

### 6. e2e/01-onboarding.spec.ts — qué adaptar

El spec recorre la rama "sí tengo canal" (10 pasos, incluye multicanal). Con T021:

- La rama que el spec recorre (tieneCanalYa=true) sigue teniendo 10 pasos → el spec existente no necesita cambios de lógica de flujo (no verifica el contador de pasos en texto).
- Lo que SÍ cambia: si la barra de progreso tiene un data-testid o aria-valuenow verificado, actualizar.
- **Añadir segundo test** para la rama sin canal (tieneCanalYa=false): click "Todavía no" → NO aparece paso multicanal → paso 3 nombre click "Todavía no" (o dejarlo vacío) → nicho click "Aún no lo sé" → frecuencia click "Aún no lo sé" → resto igual → dashboard con saludo `Hola, creador` → banner viabilidad visible (`data-testid="dashboard-card-viabilidad"`).
- **Testids nuevos a añadir en Onboarding.tsx:** `onboarding-nombre-todavia-no`, `onboarding-niche-no-se`, `onboarding-frequency-no-se`.

---

## PARTE 2 — T022: CADENA DEL MÉTODO

### 7. Inventario de los 12 generadores (prompts.js + routes/ia.js)

| # | Tipo (key en GENERADORES) | Tokens | Temp | Contexto principal | Componente frontend |
|---|--------------------------|--------|------|--------------------|---------------------|
| 1 | `seo_preguntas` | 600 | 0.8 | perfil + video | StepInvestigacion.tsx |
| 2 | `titulo` | 800 | 0.9 | perfil + video | StepTitulo.tsx |
| 3 | `miniatura_brief` | 700 | 0.7 | perfil + video + op.estrategia | StepMiniatura.tsx |
| 4 | `hook` | 700 | 0.9 | perfil + video | StepGuion.tsx |
| 5 | `descripcion` | 1200 | 0.7 | perfil + video + op.resumenGuion | StepPublicacion.tsx |
| 6 | `hashtags` | 200 | 0.6 | perfil + video | StepPublicacion.tsx |
| 7 | `email` | 800 | 0.8 | perfil + video + op.urlVideo | StepSprint.tsx |
| 8 | `comunidad` | 500 | 0.9 | perfil + video + op.tipoPost | StepSprint.tsx |
| 9 | `evaluacion_nicho` | 1000 | 0.6 | op.{nicho,ideaCanal,nivel,canalesReferencia,subNicho,pvu} — sin video | Viabilidad.tsx paso 5 |
| 10 | `temas_canal` | 1200 | 0.9 | op.{canalNombre,nicho,tieneCanalYa,titulosExistentes} — sin video | Dashboard.tsx |
| 11 | `romu_aprueba` | 1000 | 0.5 | perfil + video + op.{datosEtapa,reglas,etapaNombre,etapaProposito,nicho} | todas etapas wizard menos grabacion/edicion |
| 12 | `analisis_retencion` | 1200 | 0.4 | perfil + video + snapshots + op.datosPegados | StepEvergreen.tsx |
| 13 | `sugerir_nombres_canal` (NUEVO) | 600 | 0.9 | op.{nicho,ideaCanal?,pvu?} — sin video | Viabilidad paso 5 + Settings.tsx |

`construirContexto(profile, video)` en prompts.js inyecta perfil y video como prefijo del user message para todos los generadores que reciben videoProjectId. Campos reales del video que más usan los generadores: `tituloIdea`, `tituloFinal`, `palabrasClave[]`, `seoPreguntas[]`, `guion.seoInicio`, `guion.desarrollo[]`, `miniatura.estrategia`, `descripcionPublicada`, `publishedAt`.

**AiBlock actual:** props `{tipo, videoProjectId?, etiqueta, opciones?, render, disabledExtra?, tip?}`. El botón se deshabilita con `disabled={cargando || Boolean(disabledExtra)}`. Hay un mecanismo de bloqueo externo (`disabledExtra`) pero hoy solo se usa para lógica ad hoc en cada componente, no para requisitos del método.

---

### 8. Mapa de requisitos concreto generador→campos reales

Usando nombres exactos de `videoDefaults.js` y `types.ts`:

```
seo_preguntas:
  - video.palabrasClave.length >= 1
  → falta="palabrasClave", pasoSlug="investigacion"
  Mensaje: "Antes de generar preguntas SEO, anota al menos una palabra clave en la investigación."

titulo:
  - video.palabrasClave.length >= 3
  - video.seoPreguntas.length >= 1
  → falta="palabrasClave", pasoSlug="investigacion"
  Mensaje: "Necesitas al menos 3 palabras clave y 1 pregunta SEO antes de generar títulos."

miniatura_brief:
  - video.tituloFinal != null && video.tituloFinal.trim() != ""
  → falta="tituloFinal", pasoSlug="titulo"
  Mensaje: "Elige un título final antes de pedir el brief de miniatura."

hook:
  - video.tituloFinal != null && video.tituloFinal.trim() != ""
  → falta="tituloFinal", pasoSlug="titulo"
  Mensaje: "El gancho necesita saber qué promete el vídeo. Primero elige el título."

descripcion:
  - video.tituloFinal != null && video.tituloFinal.trim() != ""
  - video.guion.seoInicio.trim() != "" O video.guion.desarrollo.length >= 1
  → falta="tituloFinal" si no hay título, falta="guion.seoInicio" si no hay guion; pasoSlug según el caso
  Mensaje variable.

hashtags:
  - video.tituloFinal != null && video.tituloFinal.trim() != ""
  → falta="tituloFinal", pasoSlug="titulo"
  Mensaje: "Los hashtags se derivan del título. Elige el título primero."

email:
  - video.tituloFinal != null
  - video.publishedAt != null
  → falta="publishedAt", pasoSlug="publicacion"
  Mensaje: "El email de lanzamiento se redacta cuando el vídeo ya está publicado."

comunidad:
  - video.tituloFinal != null
  → falta="tituloFinal", pasoSlug="titulo"

romu_aprueba:
  - Sin requisitos duros propios (evalúa lo que hay)

analisis_retencion:
  - video.publishedAt != null
  → falta="publishedAt", pasoSlug="publicacion"
  Mensaje: "El análisis de retención solo aplica a vídeos ya publicados."

temas_canal:
  - profile.nicho != null && profile.nicho.trim() != ""
  → falta="nicho", pasoSlug="configuracion"
  Mensaje: "Sin nicho definido, los temas serán demasiado genéricos. Define tu nicho en Configuración."

sugerir_nombres_canal:
  - profile.nicho != null && profile.nicho.trim() != ""
  → falta="nicho", pasoSlug="configuracion"
  Mensaje: "Para sugerir nombres necesito saber tu nicho. Defínelo en Configuración."
```

---

### 9. Dónde vive el módulo de requisitos

**Recomendación:** el mapa de requisitos vive en `app/backend/src/requisitos.js`, exportando:
```js
// REQUISITOS: tipo → función que devuelve null (OK) o {falta, pasoSlug, mensaje}
export const REQUISITOS = {
  seo_preguntas: (video, profile) => { ... },
  titulo: (video, profile) => { ... },
  // etc.
};
```

`routes/ia.js` lo importa e invoca **antes de llamar al LLM**, tras resolver `profile` y `video`:
```js
const requisito = REQUISITOS[tipo]?.(video, profile);
if (requisito) throw new ApiError("REQUISITO_FALTANTE", 422, requisito.mensaje, [{ falta: requisito.falta, pasoSlug: requisito.pasoSlug }]);
```

**Frontend NO duplica el mapa.** `AiBlock` captura la respuesta 422 con `code === "REQUISITO_FALTANTE"` y extrae `details[0]`. Necesita prop opcional `videoId?: string` para construir el enlace al paso:
```
pasoSlug "configuracion"   → /configuracion
pasoSlug "investigacion"   → /videos/${videoId}/wizard/investigacion
pasoSlug "titulo"          → /videos/${videoId}/wizard/titulo
pasoSlug "guion"           → /videos/${videoId}/wizard/guion
pasoSlug "publicacion"     → /videos/${videoId}/wizard/publicacion
```

**Verificar en `services/api.ts`** que `ApiError` expone `details` como campo propio (o si está embebido en `message`). Si no: añadir `details?: unknown[]` al tipo `ApiError` del frontend.

---

### 10. Generador `sugerir_nombres_canal`: contrato JSON y ubicación

**Contrato del generador en prompts.js:**
```js
sugerir_nombres_canal: {
  maxTokens: 600,
  temperatura: 0.9,
  user: (op) => `NICHO DEL CANAL: ${op.nicho ?? "(sin especificar)"}
${op.ideaCanal ? `IDEA DE CANAL: ${op.ideaCanal}` : ""}
${op.pvu ? `PROPUESTA DE VALOR: ${op.pvu}` : ""}

Propón exactamente 5 nombres para un canal de YouTube en este nicho.
Cada nombre: memorable, pronunciable, entre 2 y 4 palabras, que deje claro el tema y diferencie.
Explica en 1 frase por qué cada nombre funciona.
Formato de salida:
{"nombres": [{"nombre": "...", "porQue": "..."}]}`,
  normalizar: (p) => {
    // validar array nombres, truncar, filtrar vacíos, max 5
  }
}
```

**Ubicación en UI:**
- **Viabilidad.tsx paso 5 (veredicto):** Tras el AiBlock `evaluacion_nicho`, añadir AiBlock `sugerir_nombres_canal` con `opciones={{ nicho: estudio.subNicho || perfil.nicho, ideaCanal: estudio.ideaCanal, pvu: estudio.pvu }}`. Los resultados se muestran como chips clicables que hacen `PATCH /api/profile { canalNombre: nombre }` y navegan a `/dashboard`.
- **Settings.tsx sección perfil:** Bajo el campo "Nombre del canal", si `profile.canalNombre` está vacío/null y `profile.nicho` no está vacío, mostrar AiBlock `sugerir_nombres_canal` con `opciones={{ nicho: profile.nicho }}`. Los chips aplican `setPerfil({ ...perfil, canalNombre: nombre })` (local) y el usuario guarda con el botón existente.

---

### 11. Impacto en tests backend y e2e

**Tests backend nuevos:**
- `POST /api/ia/generar` tipo=titulo con video.palabrasClave=[] → 422, code=REQUISITO_FALTANTE, details[0].pasoSlug="investigacion".
- `POST /api/ia/generar` tipo=miniatura_brief con video.tituloFinal=null → 422, details[0].falta="tituloFinal".
- `POST /api/ia/generar` tipo=email con video.publishedAt=null → 422, details[0].pasoSlug="publicacion".
- `POST /api/ia/generar` tipo=temas_canal con profile.nicho=null → 422 REQUISITO_FALTANTE.
- `POST /api/ia/generar` tipo=sugerir_nombres_canal con profile.nicho="fitness" → 200, resultados[0].nombre string.
- `POST /api/profile` con canalNombre=null y nicho=null → 201 (tras cambiar validación en T021).

**Tests e2e:**
- Nuevo test en `e2e/01-onboarding.spec.ts`: rama sin canal completa → verificar `dashboard-card-viabilidad` visible y heading `Hola, creador`.
- Test de bloqueo duro (opcional, puede ser unitario con vitest): AiBlock muestra bloque de requisito cuando backend responde 422 REQUISITO_FALTANTE.

---

## ARCHIVOS A TOCAR

### Lote A — T021

| Archivo | Motivo |
|---------|--------|
| `app/frontend/src/routes/Onboarding.tsx` | Bifurcación tras paso 1, numeración dinámica, campos nullable, chips "Todavía no"/"Aún no lo sé", crear() null-safe |
| `app/frontend/src/routes/Dashboard.tsx` | Subtítulo nicho null-safe, condición banner viabilidad ampliada, useEffect viabilidad ampliado |
| `app/frontend/src/routes/Settings.tsx` | Inputs con `?? ""` para canalNombre/nicho, frecuencia "no_se"/null, nombre nullable |
| `app/frontend/src/types.ts` | `canalNombre: string \| null`, `nicho: string \| null`, `frecuenciaObjetivo: Frecuencia \| null` |
| `app/frontend/src/i18n/es.ts` | `bienvenidaToast` acepta null; strings nuevos: `nombreTodaviaNo`, `nichoNoSe`, `frecuenciaNoSe` |
| `app/backend/src/routes/profile.js` | `validate()`: canalNombre nullable, nicho nullable, frecuenciaObjetivo acepta null |
| `app/backend/src/prompts.js` | `construirContexto()`: null-safe con `?? "(sin especificar)"` |
| `e2e/01-onboarding.spec.ts` | Segundo test para rama sin canal |

### Lote B — T022

| Archivo | Motivo |
|---------|--------|
| `app/backend/src/requisitos.js` | **NUEVO** — mapa de requisitos por generador, fuente de verdad |
| `app/backend/src/routes/ia.js` | Import y aplicación de requisitos antes de llamar LLM |
| `app/backend/src/prompts.js` | Añadir generador `sugerir_nombres_canal` a GENERADORES |
| `app/frontend/src/wizard/AiBlock.tsx` | Estado `bloqueado`, captura 422 REQUISITO_FALTANTE, UI de bloqueo + enlace al paso, prop `videoId?` |
| `app/frontend/src/routes/Settings.tsx` | AiBlock `sugerir_nombres_canal` bajo campo nombre (condicional) |
| `app/frontend/src/routes/Viabilidad.tsx` | AiBlock `sugerir_nombres_canal` en paso 5, chips apply-nombre |
| `app/frontend/src/i18n/es.ts` | Strings: etiqueta/tip de sugerir_nombres_canal, mensajes de bloqueo |
| `app/frontend/src/services/api.ts` | Verificar/añadir `details?: unknown[]` en tipo ApiError del frontend |

---

## CONVENCIONES A RESPETAR

- `types.ts` es espejo de los modelos de datos: no inventar campos sin reflejo en backend.
- `es.ts` es única fuente de strings; no hardcodear texto en JSX.
- Validaciones backend en `profile.js` siguen patrón `assert422(cond, campo, mensaje, errors)`.
- `mergeDeep` en profile.js POST/PATCH: null es un valor válido que se asigna (no hace merge profundo).
- AiBlock usa `disabledExtra` para bloqueo externo (tooltip); T022 añade estado interno `bloqueado` para capturar el 422.
- `ApiError(code, status, mensaje, details?)` — el constructor ya acepta cuarto argumento en `errors.js`; verificar que el frontend expone `e.details`.
- Testids: kebab-case sin tildes. Nuevos: `onboarding-nombre-todavia-no`, `onboarding-niche-no-se`, `onboarding-frequency-no-se`.
- Barra de progreso: clase `progress-thin` con width inline calculado en `%`.
- GENERADORES en prompts.js: cada entry sigue exactamente el patrón `{maxTokens, temperatura, user(op), normalizar(parsed) → resultados[] | null}`.

---

## REUTILIZABLE

- `assert422(cond, campo, mensaje, errors)` de `util.js` — para validar requisitos IA en backend.
- `ApiError` de `errors.js` — instanciar con `("REQUISITO_FALTANTE", 422, msg, [{falta, pasoSlug}])`.
- `isApiError(e)` de `services/api.ts` en AiBlock — añadir rama `&& e.code === "REQUISITO_FALTANTE"`.
- Patrón chip activo del paso 4: `className={chip${draft.nicho === n ? " active" : ""}}` — reutilizar para chip "Aún no lo sé" con `draft.nicho === null`.
- `construirContexto(profile, video)` ya tiene guard `if (profile)` — no rompe si profile tiene campos null.
- GENERADORES en prompts.js — `sugerir_nombres_canal` sigue exactamente el mismo patrón de los 12 existentes.
- AiBlock existente — extender con prop `videoId?` y estado interno `bloqueado`; no reemplazar.

---

## RIESGOS Y ZONAS FRÁGILES

1. **`types.ts` es la zona de mayor solape entre T021 y T022.** T021 cambia `canalNombre: string | null`, `nicho: string | null`. T022 asume esos cambios para los requisitos de `temas_canal` y `sugerir_nombres_canal`. Si se implementan en paralelo: conflictos de merge en ese archivo. Solución: T021 (Lote A) primero.

2. **`profile.js` validate() usada también en PATCH desde Settings.tsx.** Cambiar nullabilidad afecta el flujo de edición del perfil. El implementor debe verificar que guardar desde Settings con nombre vacío pasa la validación modificada.

3. **Dashboard `viabilidad` useEffect** hoy solo se activa si `tieneCanalYa === false`. Al ampliar la condición del banner, ampliar también el useEffect o hacer la carga incondicional con guard posterior.

4. **E2E spec 01** verifica el heading `Canal de Pruebas E2E`. El nuevo test de rama sin canal debe verificar `Hola, creador` específicamente con `getByRole("heading", { name: /creador/ })`.

5. **Settings.tsx usa `profile!` (non-null assertion).** Con canalNombre nullable, los inputs necesitan `?? ""` para evitar `value={null}` que React trata como uncontrolled.

6. **`frecuenciaObjetivo` nullable:** si se usa null en vez de centinela "no_se", el `<select>` en Settings necesita opción vacía `<option value="">Aún no lo sé</option>`. Los `FRECUENCIAS.includes(null)` fallarían → hay que hacer el campo optional en validate() (`if (body.frecuenciaObjetivo !== null && body.frecuenciaObjetivo !== undefined) assert422(...)`).

7. **AiBlock captura 422 REQUISITO_FALTANTE vs otros 422.** Hoy el catch solo discrimina `NOT_FOUND`. Verificar en `services/api.ts` que el objeto `ApiError` propaga `code` y `details` del body JSON del backend. Si no, extender el parser de errores de la API.

---

## RECOMENDACION: PLAN POR LOTES

### Lote A — T021 (implementor 1, sin depender de T022)
1. Cambiar tipos en `types.ts`: `canalNombre | null`, `nicho | null`, `frecuenciaObjetivo: Frecuencia | null`.
2. Actualizar `routes/profile.js` `validate()`: campos nullable, frecuencia acepta null.
3. Actualizar `prompts.js` `construirContexto()`: null-safe.
4. Reescribir lógica de pasos en `Onboarding.tsx`: `pasosActivos(draft)`, `siguientePasoActivo()`, bifurcación paso 2, nombre opcional en rama sin canal, chips "Todavía no"/"Aún no lo sé", barra dinámica.
5. Null-safe en `crear()`.
6. Parchar `Dashboard.tsx`: subtítulo nicho null-safe, condición banner ampliada, useEffect ampliado.
7. Parchar `Settings.tsx`: inputs con `?? ""`, frecuencia null, nombre nullable.
8. Añadir strings en `es.ts`.
9. Actualizar `e2e/01-onboarding.spec.ts`: segundo test rama sin canal.

### Lote B — T022 (implementor 2, después de Lote A mergeado)
1. Crear `app/backend/src/requisitos.js` con mapa completo.
2. Modificar `routes/ia.js`: importar y aplicar requisitos antes de generar.
3. Añadir `sugerir_nombres_canal` a `prompts.js`.
4. Modificar `AiBlock.tsx`: estado `bloqueado`, captura 422, UI + enlace al paso, prop `videoId?`.
5. Añadir AiBlock `sugerir_nombres_canal` en `Viabilidad.tsx` paso 5 y `Settings.tsx`.
6. Añadir strings en `es.ts`.
7. Tests backend: casos 422 REQUISITO_FALTANTE para varios generadores.
8. Test e2e nuevo: rama sin canal en 01-onboarding; bloqueo duro puede ser test unitario.

**Por qué separados:** T021 toca `types.ts` y `profile.js`, que son cimientos para T022. Conflictos de merge en esos archivos son altos si se implementan en paralelo. Lote B puede arrancar en cuanto Lote A pase el reviewer.

---

## RESUMEN EJECUTIVO

T021 bifurca el onboarding en dos ramas: tieneCanalYa=true (10 pasos, igual que hoy con ajustes) y tieneCanalYa=false (9 pasos, sin pregunta multicanal, nombre y nicho opcionales). La numeración "Paso X de N" y la barra de progreso deben calcularse dinámicamente sobre los pasos activos de la rama. Los puntos de rotura por null son acotados: `Dashboard.tsx` subtítulo nicho, `Settings.tsx` inputs controlados, `Onboarding.tsx` función `crear()`, y el toast de bienvenida con nombre null. El banner de viabilidad se amplía para cubrir usuarios con nicho o canalNombre ausente. Las validaciones del backend en `profile.js` deben volverse nullable para `canalNombre`, `nicho` y `frecuenciaObjetivo`. T022 introduce `requisitos.js` como única fuente de verdad en el backend: cada generador declara sus requisitos y lanza 422 REQUISITO_FALTANTE con `{falta, pasoSlug, mensaje}`. `AiBlock.tsx` captura ese error para mostrar bloqueo duro con enlace al paso que falta, sin duplicar la lógica de requisitos en frontend. El generador nuevo `sugerir_nombres_canal` (requiere nicho no vacío) se añade al catálogo de prompts.js y aparece en Viabilidad paso 5 y Settings. La zona de mayor riesgo de solape entre T021 y T022 es `types.ts` y `profile.js`: implementar Lote A primero y Lote B solo tras aprobación del reviewer.
