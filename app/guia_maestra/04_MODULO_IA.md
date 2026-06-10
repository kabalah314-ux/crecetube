# 04 · MÓDULO DE IA — GENERADORES, PROMPTS Y FALLBACKS

> **Para la IA constructora**: este archivo define el módulo de IA completo: arquitectura, configuración, los **9 generadores** con sus prompts LITERALES (copiar tal cual), contratos JSON de entrada/salida, manejo de errores y fallbacks. Los tipos coinciden 1:1 con `AIInteraction.tipo` (03 §3.1.5) y cada generador vive en la etapa del wizard indicada en `02_FLUJOS_Y_UX.md`.
>
> **Regla de oro #5**: la app funciona al 100% sin IA. Este módulo es una capa opcional que se enciende al guardar una API key.

---

## 4.1 ARQUITECTURA

```
Frontend                Backend                       OpenRouter
   │                       │                              │
   │ POST /api/ia/generar  │                              │
   │ { tipo, videoProjectId, opciones }                   │
   ├──────────────────────►│                              │
   │                       │ 1. lee UserProfile.iaConfig  │
   │                       │ 2. lee VideoProject (si hay) │
   │                       │ 3. construye prompt (4.6)    │
   │                       │ 4. POST /chat/completions    │
   │                       ├─────────────────────────────►│
   │                       │◄─────────────────────────────┤
   │                       │ 5. extrae + valida JSON      │
   │                       │ 6. guarda AIInteraction      │
   │◄──────────────────────┤                              │
   │ { interactionId, resultados, parseFallido? }         │
```

**Reglas inquebrantables**:
1. El frontend **NUNCA** llama al LLM directamente: la `apiKey` vive en el backend y jamás viaja al cliente (en GET de perfil se devuelve `"***"`, 03 §3.1.1).
2. Toda llamada (con éxito o error de parseo) se registra como `AIInteraction`.
3. Lo escrito a mano por el usuario nunca se pisa: los resultados IA son sugerencias que el usuario aplica explícitamente.
4. Sin streaming en v1 (respuestas cortas; simplifica errores).

---

## 4.2 CONFIGURACIÓN

### 4.2.1 Valores por defecto (`UserProfile.iaConfig`)

| Campo | Defecto | Nota |
|---|---|---|
| `proveedor` | `"openrouter"` | único probado en v1; `custom` permite otro baseUrl compatible OpenAI |
| `modelo` | `"openrouter/free"` | router automático: OpenRouter elige un modelo gratuito disponible. Cero mantenimiento si un modelo gratuito desaparece |
| `apiKey` | `""` | sin clave = módulo apagado |
| `baseUrl` | `"https://openrouter.ai/api/v1"` | |
| `temperatura` | `0.7` | cada generador puede sobreescribirla (tabla 4.6.0) |

### 4.2.2 Modelos gratuitos verificados (junio 2026)

El selector de modelo en `/configuracion` ofrece estas opciones precargadas (editable como texto libre):

| Slug | Cuándo elegirlo |
|---|---|
| `openrouter/free` | **Defecto.** Router automático a modelos gratuitos disponibles |
| `meta-llama/llama-3.3-70b-instruct:free` | Mejor equilibrio general en español |
| `openai/gpt-oss-120b:free` | Alternativa potente de propósito general |
| `qwen/qwen3-next-80b-a3b-instruct:free` | Buen seguimiento de instrucciones JSON |
| `google/gemma-4-26b-a4b-it:free` | Ligero y rápido |

**Límites del tier gratuito** (mostrar en `/configuracion` como nota informativa): ~20 peticiones/minuto y ~200/día, reset diario. Si el usuario los supera, el proveedor devuelve 429 → ver 4.5.

**Aviso de privacidad** (mostrar bajo el campo de modelo, texto literal): *"Los modelos gratuitos de OpenRouter pueden usar tus prompts para mejorar sus modelos. No incluyas datos sensibles, o usa un modelo de pago."*

### 4.2.3 Test de conexión — `POST /api/ia/test-conexion`

Petición mínima al modelo configurado:

```json
{ "model": "{modelo}", "messages": [{ "role": "user", "content": "Responde solo: OK" }], "max_tokens": 5 }
```

Respuesta del endpoint:
- Éxito → `200 { "ok": true, "modelo": "{modelo}", "latenciaMs": 842 }` → la UI muestra ✓ mint *"Conectado ({latencia}ms)"*.
- Fallo → código de error de 4.5 → la UI muestra ✗ rust con el mensaje.

---

## 4.3 CLIENTE HTTP (contrato exacto)

```
POST {baseUrl}/chat/completions
Headers:
  Authorization: Bearer {apiKey}
  Content-Type: application/json
  HTTP-Referer: http://localhost:5173        ← atribución OpenRouter (opcional pero recomendado)
  X-Title: CRECETUBE Assistant
Body:
  {
    "model": "{modelo}",
    "messages": [
      { "role": "system", "content": "{SYSTEM_BASE + system del generador}" },
      { "role": "user",   "content": "{user prompt del generador}" }
    ],
    "temperature": {temperatura del generador},
    "max_tokens": {max_tokens del generador}
  }
Timeout: 60s (AbortController). Sin reintentos automáticos de red salvo el reintento de parseo (4.5.2).
```

De la respuesta se usa: `choices[0].message.content` (texto) y `usage.total_tokens` → `AIInteraction.tokensUsados`. `costoEstimado = 0` cuando el slug termina en `:free` o es `openrouter/free`; si no, `null` en v1.

---

## 4.4 SYSTEM PROMPT BASE (común a todos los generadores)

```text
Eres el asistente experto del método CRECETUBE para creadores de YouTube en español.
Respondes SIEMPRE en español neutro, con tono cercano y didáctico, nunca robótico.
Conoces y aplicas las reglas del método:
- Títulos: idealmente ≤60 caracteres, nunca >100. Concretos, con palabra clave, sin clickbait vacío.
- Miniaturas: 3-5 palabras impresas, legibles a 100px de ancho.
- Ganchos: los primeros 15 segundos deciden la retención.
- Hashtags: regla del 3 → uno amplio, uno medio, uno específico. Empiezan por # y no llevan espacios.
- Descripciones: las 2 primeras líneas (SEOextracto) son las únicas visibles antes del "ver más".
- Capítulos: el primero siempre es 00:00.
CUANDO SE TE PIDE JSON: devuelves EXCLUSIVAMENTE un objeto JSON válido, sin texto antes ni después,
sin markdown, sin ```. Si un campo no aplica, usa null.
```

### Bloque CONTEXTO (se antepone al user prompt de todos los generadores)

Construido por el backend desde la BD; las líneas con valor vacío **se omiten**:

```text
CONTEXTO DEL CANAL
- Canal: {canalNombre} · Nicho: {nicho} · Nivel: {nivel} · Objetivo: {objetivoPrincipal}

CONTEXTO DEL VÍDEO
- Idea: {tituloIdea}
- Brief: {descripcionCorta}
- Tipo: {tipo} · Formato: {formato}
- Título final: {tituloFinal}
- Palabras clave: {palabrasClave separadas por coma}
- Preguntas SEO: {seoPreguntas separadas por " | "}
```

---

## 4.5 ERRORES Y FALLBACKS

### 4.5.1 Mapeo de errores (códigos de 03 §3.6)

| Situación | HTTP propio | `code` | Mensaje UI (toast salvo indicado) |
|---|---|---|---|
| `apiKey` vacía | 503 | `AI_NOT_CONFIGURED` | (no toast: botón disabled + tooltip, 02 §2.3.6) |
| Proveedor devuelve 401/403 | 502 | `AI_PROVIDER_ERROR` | "Tu clave no es válida o ha caducado. Revísala en Ajustes." |
| Proveedor devuelve 429 | 429 | `AI_RATE_LIMIT` | "Límite del modelo gratuito alcanzado (20/min, 200/día). Espera un poco o cambia de modelo." |
| Timeout 60s / red caída | 502 | `AI_PROVIDER_ERROR` | "El modelo no responde. Inténtalo de nuevo." |
| Proveedor 5xx u otro | 502 | `AI_PROVIDER_ERROR` | "Error del proveedor: {mensaje original truncado a 140 chars}" |

### 4.5.2 Fallback de parseo JSON (orden estricto)

1. **Extracción robusta**: del `content`, recortar desde el primer `{` o `[` hasta su cierre balanceado; eliminar fences ``` si los hay; `JSON.parse`.
2. **Si falla** → **un único reintento** añadiendo al final del user prompt: `"RECUERDA: responde SOLO el JSON, sin ningún texto adicional."`
3. **Si vuelve a fallar** → degradación elegante: responder `200` con `{ "parseFallido": true, "resultados": [{ "texto": "{content bruto}" }] }`. La UI muestra el texto bruto en una card única con aviso *"La IA no devolvió el formato esperado; aquí tienes su respuesta en bruto"* y botón Copiar. Se registra la `AIInteraction` con `respuestaParseada: null`.

### 4.5.3 Validaciones post-parseo (por generador, ver 4.6)

Los resultados que violen límites duros del modelo de datos se **corrigen silenciosamente** (truncar título a 100, descartar hashtag con espacios…) y nunca rompen la respuesta. Si tras corregir no queda ningún resultado válido → tratar como parseo fallido (4.5.2.3).

---

## 4.6 LOS 9 GENERADORES

### 4.6.0 Tabla resumen

| `tipo` | Etapa | Entrada extra (además del CONTEXTO) | `max_tokens` | `temperatura` |
|---|---|---|---|---|
| `seo_preguntas` | 2 | — | 600 | 0.8 |
| `titulo` | 3 | — | 800 | 0.9 |
| `miniatura_brief` | 4 | `estrategia`, `palabrasMiniatura` | 700 | 0.7 |
| `hook` | 5 | — | 700 | 0.9 |
| `descripcion` | 8 | resumen del guion | 1200 | 0.7 |
| `hashtags` | 8 | — | 200 | 0.6 |
| `email` | 9 | `urlVideo` (opciones) | 800 | 0.8 |
| `comunidad` | 9 | `tipoPost` (Giftcalipsis/SEOencuesta/SEOlaunch/SEOrepesca) | 500 | 0.9 |
| `analisis_retencion` | 10 | `datosPegados` (texto libre del usuario) | 1200 | 0.4 |

Contrato del endpoint: `POST /api/ia/generar` con body `{ "tipo": string, "videoProjectId": string|null, "opciones": object }`. Respuesta: `{ "interactionId": string, "resultados": [...], "parseFallido": boolean }` donde `resultados` es el array normalizado que se describe en cada generador.

---

### 1) `seo_preguntas` — Preguntas que responde el vídeo (etapa 2)

**User prompt literal** (tras el CONTEXTO):

```text
Genera exactamente 10 preguntas que la audiencia de este nicho escribiría en YouTube
o Google y que este vídeo puede responder. Mezcla: 4 preguntas básicas (principiantes),
4 intermedias y 2 específicas/long-tail. Formato de salida:
{"preguntas": ["...", "..."]}
```

**Salida esperada**: `{"preguntas": string[]}` → `resultados = preguntas.map(p => ({texto: p}))`.
**Validación**: descartar vacías y duplicadas; máximo 10. **UI**: cards con botón "Añadir" → push a `seoPreguntas` si `length < 10`.

---

### 2) `titulo` — Títulos alternativos (etapa 3)

**User prompt literal**:

```text
Genera exactamente 9 títulos para este vídeo. Reparte así:
- 3 con beneficio directo (qué gana el espectador)
- 2 con curiosidad/intriga (sin clickbait vacío: la promesa se cumple)
- 2 con número o dato concreto
- 2 con pregunta
Cada título: ≤60 caracteres ideal (NUNCA >100), incluye si es natural alguna de las
palabras clave del contexto, sin comillas, sin emojis.
Formato de salida:
{"titulos": [{"texto": "...", "angulo": "beneficio|curiosidad|dato|pregunta"}]}
```

**Salida**: `{"titulos": [{texto, angulo}]}` → `resultados` directo.
**Validación**: truncar `texto` a 100 chars; descartar duplicados. **UI**: cards con "Guardar como alternativa" y "Elegir como final" (02 §2.4.3); badge con el `angulo`.

---

### 3) `miniatura_brief` — Brief de diseño de miniatura (etapa 4)

**Entrada extra**: `opciones.estrategia` (`SEOmarco`|`SEOcara`|`SEOflecha`|`otra`), `opciones.palabrasMiniatura` (si ya hay).

**User prompt literal**:

```text
Redacta un brief de diseño para la miniatura de este vídeo usando la estrategia {estrategia}.
Reglas de la estrategia:
- SEOmarco: borde grueso de color llamativo alrededor de toda la miniatura.
- SEOcara: rostro humano al 40-60% del área con expresión exagerada; texto al lado opuesto;
  la mirada apunta al texto.
- SEOflecha: una única flecha de color contrastante apuntando al elemento clave.
- otra: composición libre pero siguiendo las buenas prácticas generales.
El brief debe poder dárselo el creador a un diseñador (o a una IA de imagen) sin más contexto.
Incluye: composición, paleta (con códigos hex), texto impreso (3-5 palabras) y qué NO hacer.
Formato de salida:
{"brief": "texto del brief en 6-10 líneas", "palabrasSugeridas": ["3 a 5 palabras para imprimir"]}
```

**Salida**: `{"brief": string, "palabrasSugeridas": string[]}` → `resultados = [{texto: brief, palabrasSugeridas}]`.
**UI**: botón "Usar este brief" escribe en `miniatura.briefIA`; chip secundario "Usar palabras" escribe `palabrasMiniatura` (join con espacio).

---

### 4) `hook` — Ganchos de apertura (etapa 5)

**User prompt literal**:

```text
Genera exactamente 5 ganchos de apertura para los primeros 15 segundos de este vídeo.
Tipos a cubrir (uno por gancho): dato impactante, conflicto/problema, pregunta directa,
demostración ("mira esto"), historia personal.
Cada gancho: 1-3 frases habladas en primera persona, lenguaje natural de YouTube en español.
Para cada uno indica dónde encaja mejor: seoShock (gancho fuerte), seoInicio (apertura que
promete el resultado) o seoLoop (promesa diferida que se resuelve al final).
Formato de salida:
{"hooks": [{"texto": "...", "tipo": "dato|conflicto|pregunta|demostracion|historia", "usoSugerido": "seoShock|seoInicio|seoLoop"}]}
```

**Salida**: `{"hooks": [{texto, tipo, usoSugerido}]}`.
**UI**: cada card ofrece 3 botones "Usar como SEOshock / SEOinicio / SEOloop" (02 §2.4.5), preseleccionado el `usoSugerido`.

---

### 5) `descripcion` — Descripción completa (etapa 8)

**Entrada extra construida por el backend**: resumen del guion = `seoInicio` + títulos de bloques de `desarrollo` + `psicoCta` (truncado a 1500 chars).

**User prompt literal**:

```text
RESUMEN DEL GUION
{resumenGuion}

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
{"seoExtracto": "...", "descripcion": "texto completo con saltos de línea \n"}
```

**Salida**: `{"seoExtracto": string, "descripcion": string}` → `resultados = [{texto: descripcion, seoExtracto}]`.
**Validación**: truncar a 5000 chars. **UI**: "Usar descripción" escribe `descripcionPublicada` (si había contenido, modal de confirmación "¿Sustituir lo escrito?").

---

### 6) `hashtags` — Regla del 3 (etapa 8)

**User prompt literal**:

```text
Propón hashtags para este vídeo siguiendo la regla del 3 del método CRECETUBE:
- amplio: categoría grande del nicho (ej: #cocina)
- medio: subtema (ej: #cocinavegana)
- especifico: el tema exacto del vídeo (ej: #lasañavegana)
Todo en minúsculas, sin espacios, sin tildes, empezando por #.
Da también 1 hashtag candidato para el título (el más corto y reconocible de los tres).
Formato de salida:
{"amplio": "#...", "medio": "#...", "especifico": "#...", "titulo": "#..."}
```

**Salida**: objeto con 4 strings → `resultados = [objeto]`.
**Validación**: regex `^#[a-z0-9_]+$` por campo; los inválidos → null. **UI**: botón "Aplicar los 3" (push a `hashtags.descripcion` sin duplicar) + botón pequeño "Usar en título".

---

### 7) `email` — Email de nuevo vídeo (etapa 9)

**Entrada extra**: `opciones.urlVideo` (string, puede ser vacía → usar marcador `{urlVideo}`).

**User prompt literal**:

```text
Escribe el email de aviso de nuevo vídeo para la lista de correo de este canal,
estilo creador cercano (NO corporativo, NO spam). Estructura:
- asunto: ≤55 caracteres, despierta curiosidad sin engañar
- preheader: 1 frase complementaria al asunto
- cuerpo: saludo breve, 1-2 frases de gancho, enlace {urlVideo}, posdata personal
  que invite a responder. Máximo 120 palabras. Trata al lector de tú.
Formato de salida:
{"asunto": "...", "preheader": "...", "cuerpo": "texto con \n"}
```

**Salida**: `{asunto, preheader, cuerpo}` → `resultados = [objeto]`.
**UI**: vista previa formateada + "Copiar email" (no hay envío real en v1; al copiar se sugiere marcar el toggle `difusion.emailEnviado` cuando lo mande).

---

### 8) `comunidad` — Post de comunidad (etapa 9)

**Entrada extra**: `opciones.tipoPost` ∈ `Giftcalipsis | SEOencuesta | SEOlaunch | SEOrepesca` (obligatoria; la UI la pide con 4 radio-cards antes de generar).

**User prompt literal**:

```text
Escribe un post para la pestaña Comunidad de YouTube de tipo {tipoPost}.
Reglas por tipo:
- Giftcalipsis: frase ultra-corta (≤80 caracteres) pensada para acompañar un GIF llamativo,
  con pregunta cebo opcional.
- SEOencuesta: contexto de 1-2 frases + pregunta + 2-4 opciones de respuesta cortas.
- SEOlaunch: anuncio de estreno con expectativa, pide un gesto en comentarios (ej: "pon ✋").
- SEOrepesca: rescata el vídeo 24-72h después para quien no lo vio; incluye un dato/momento
  llamativo del vídeo y el marcador {urlVideo}.
Tono: cercano, directo, 0 corporativismo. En español.
Formato de salida:
{"contenido": "texto del post con \n", "opcionesEncuesta": ["..."] o null, "horaSugerida": "franja horaria recomendada en 1 frase"}
```

**Salida**: `{contenido, opcionesEncuesta, horaSugerida}` → `resultados = [objeto]`.
**UI**: "Usar este post" escribe `difusion.postComunidad.contenido` y `tipo = {tipoPost}`; muestra `horaSugerida` como hint bajo el campo.

---

### 9) `analisis_retencion` — Insights de métricas (etapa 10)

**Entrada extra**: `opciones.datosPegados` — texto libre que el usuario pega desde YouTube Analytics (la UI lo pide en un modal con textarea y ejemplo de qué pegar). Además el backend añade los `MetricSnapshot` del vídeo serializados (fecha, vistas, CTR, retención, duración media).

**User prompt literal**:

```text
DATOS DEL CREADOR (pegados de YouTube Analytics, formato libre):
{datosPegados}

SNAPSHOTS REGISTRADOS EN LA APP:
{snapshotsSerializados}

Analiza estos datos como coach de YouTube del método CRECETUBE. Devuelve entre 3 y 6
insights ACCIONABLES. Cada insight: qué se observa en los datos (hallazgo), qué hacer
exactamente (accion) y su prioridad. Prohibido el consejo genérico ("haz mejores vídeos"):
cada acción debe poder hacerse esta semana. Si los datos son insuficientes para alguna
conclusión, dilo en el resumen en lugar de inventar.
Formato de salida:
{"resumen": "2-3 frases de diagnóstico global", "insights": [{"hallazgo": "...", "accion": "...", "prioridad": "alta|media|baja"}]}
```

**Salida**: `{resumen, insights[]}` → `resultados = [objeto]`.
**UI**: insights como lista ordenada por prioridad (alta=rust, media=gold, baja=mint); botón "Guardar en notas" añade un bloque formateado a `notas` del proyecto con fecha.

---

## 4.7 REGISTRO `AIInteraction`

Por cada llamada (incluidos parseos fallidos):

| Campo | Valor |
|---|---|
| `tipo` | el del generador |
| `videoProjectId` | el del contexto o `null` |
| `prompt` | user prompt completo enviado (con CONTEXTO; **sin** el system) |
| `respuesta` | `content` bruto del modelo |
| `respuestaParseada` | JSON parseado o `null` |
| `seleccionUsuario` | se rellena vía `PATCH` cuando el usuario aplica un resultado (texto aplicado) |
| `modeloUsado` | slug devuelto en la respuesta del proveedor (`model`), no el configurado |
| `tokensUsados` | `usage.total_tokens` o `null` |
| `costoEstimado` | `0` si el slug es free, si no `null` (v1 no calcula precios) |

`GET /api/ia/historial?videoProjectId=&tipo=&limit=20` → lista descendente por fecha. UI: pestaña "Historial IA" dentro de `/videos/:id` (tabla simple: fecha, tipo, modelo, ver detalle en modal).

---

## 4.8 CRITERIOS DE ACEPTACIÓN DEL MÓDULO

1. Sin API key: ningún botón "Generar" dispara peticiones; todos muestran el tooltip (02 §2.3.6).
2. Con API key inválida: `test-conexion` y cualquier generador devuelven el error mapeado sin romper la UI.
3. Respuesta no-JSON del modelo: el flujo de fallback (4.5.2) termina SIEMPRE en una respuesta usable (cards o texto bruto), nunca en pantalla rota.
4. Cada generación queda en el historial con su `modeloUsado` real.
5. Aplicar un resultado IA nunca borra contenido del usuario sin confirmación explícita.
6. La clave nunca aparece en respuestas de la API ni en el bundle del frontend.
7. Cambiar de modelo en `/configuracion` surte efecto en la siguiente generación sin reiniciar.
