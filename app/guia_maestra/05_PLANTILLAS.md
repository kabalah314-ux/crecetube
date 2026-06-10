# 05 · BIBLIOTECA DE PLANTILLAS (25 PLANTILLAS PRECARGADAS)

> **Para la IA constructora**: cada plantilla siguiente tiene `id`, `nombre`, `tipo`, `variablesDinamicas` y `contenido` con marcadores `{variable}`. Cargarlas en BD vía seed durante el primer arranque. Las plantillas precargadas tienen `esEditable: false` y `esPrecargada: true`.
>
> El usuario puede **duplicarlas** y editar la copia (que se marca como `esEditable: true`).

---

## 5.1 ÍNDICE DE PLANTILLAS

| ID | Nombre | Tipo | Sección |
|----|--------|------|---------|
| `tpl_guion_completo` | Guion completo CRECETUBE | guion | s9 |
| `tpl_descripcion_video` | Descripción de vídeo optimizada | descripcion | s10 |
| `tpl_comentario_fijado` | Comentario fijado | descripcion | s10 |
| `tpl_brief_miniatura_seomarco` | Brief de miniatura — SEOmarco | miniatura_brief | s5 |
| `tpl_brief_miniatura_seocara` | Brief de miniatura — SEOcara | miniatura_brief | s5 |
| `tpl_brief_miniatura_seoflecha` | Brief de miniatura — SEOflecha | miniatura_brief | s5 |
| `tpl_email_bienvenida` | Email de bienvenida | email | s18 |
| `tpl_email_nuevo_video` | Email de nuevo vídeo | email | s18 |
| `tpl_email_sorteo` | Email de sorteo | email | s18 |
| `tpl_email_lead_magnet` | Email de entrega de lead magnet | email | s18 |
| `tpl_comunidad_giftcalipsis` | Post comunidad — Giftcalipsis | comunidad | s15 |
| `tpl_comunidad_seoencuesta` | Post comunidad — SEOencuesta | comunidad | s15 |
| `tpl_comunidad_seolaunch` | Post comunidad — SEOlaunch | comunidad | s15 |
| `tpl_comunidad_seorepesca` | Post comunidad — SEOrepesca | comunidad | s15 |
| `tpl_comunidad_seorteo` | Post comunidad — SEOrteo | comunidad | s7 |
| `tpl_banner_canal` | Banner del canal — medidas y zonas seguras | banner | s1 |
| `tpl_trailer_canal` | Tráiler del canal (SEOTrailer) | trailer | s8 |
| `tpl_video_destacado` | Vídeo destacado (SEOdestacado) | trailer | s8 |
| `tpl_pantallas_finales` | Configuración pantallas finales | pantalla_final | s13 |
| `tpl_tarjetas` | Plan de tarjetas en vídeo | tarjeta | s14 |
| `tpl_checklist_pre_publicacion` | Checklist pre-publicación | checklist | s9 |
| `tpl_checklist_post_publicacion` | Checklist post-publicación (sprint) | checklist | s3 |
| `tpl_panel_marca` | Panel de marca / KPIs personalizables | checklist | s17 |
| `tpl_campana_ads` | Plantilla campaña Ads (IG/FB/YT) | comunidad | s17 |
| `tpl_seolista` | SEOlista — lista de reproducción optimizada | descripcion | s11 |

> Las 25 plantillas son canónicas y se cargan en BD desde `05_plantillas_seed.json` (generado automáticamente con `node scripts/build_seeds.mjs`).

---

## 5.2 PLANTILLA — Guion completo CRECETUBE

```yaml
id: tpl_guion_completo
nombre: Guion completo CRECETUBE
tipo: guion
seccionRelacionadaId: s9
esEditable: false
esPrecargada: true
variablesDinamicas:
  - { nombre: tituloVideo, descripcion: "Título de trabajo", valorPorDefecto: "", tipo: texto }
  - { nombre: nichoVideo, descripcion: "Nicho/temática", valorPorDefecto: "", tipo: texto }
  - { nombre: duracionEstimadaMin, descripcion: "Duración estimada en minutos", valorPorDefecto: "10", tipo: numero }
contenido: |
  # GUION — {tituloVideo}
  Nicho: {nichoVideo} · Duración estimada: {duracionEstimadaMin} min

  ## SEOinicio (0:00 – 0:20)
  [Frase de apertura que rompa el patrón y prometa el resultado]

  ## SEOshock (0:00 – 0:15, parte alta)
  [Gancho fuerte: dato, conflicto, pregunta o demostración]

  ## SEOloop (en los primeros 30s)
  [Pista de algo que se revelará al final / promesa diferida]

  ## DESARROLLO
  ### Bloque 1 — [Título del bloque] (~ XX seg)
  - Contenido principal
  - [ROTURA DE PATRÓN aquí: cambio de plano, efecto sonoro, b-roll inesperado]

  ### Bloque 2 — [Título del bloque] (~ XX seg)
  - Contenido principal
  - [SEOreset: resumen breve para reenganchar]

  ### Bloque 3 — [Título del bloque] (~ XX seg)
  - Contenido principal
  - [SEOzoom: enfatizar dato/concepto clave con zoom]

  ## SEOresultado (cerca del cierre)
  [Mostrar el desenlace prometido]

  ## Cliffhanger (opcional, justo antes del PsicoCTA)
  [Anticipar idea del próximo vídeo para enganchar a seguir]

  ## PsicoCTA (cierre)
  [Llamada a la acción específica, conectada al beneficio del usuario]

  ---
  Notas de producción:
  - Lugar: ...
  - Vestuario: ...
  - B-roll necesario: ...
```

---

## 5.3 PLANTILLA — Descripción de vídeo optimizada

```yaml
id: tpl_descripcion_video
nombre: Descripción de vídeo optimizada
tipo: descripcion
seccionRelacionadaId: s10
variablesDinamicas:
  - { nombre: seoExtracto, descripcion: "Primera línea potente (máx 110 chars)", valorPorDefecto: "", tipo: texto }
  - { nombre: resumenVideo, descripcion: "2-3 frases que resuman el vídeo", valorPorDefecto: "", tipo: texto }
  - { nombre: nombreCanal, descripcion: "Nombre del canal", valorPorDefecto: "", tipo: texto }
  - { nombre: instagramUrl, descripcion: "Tu Instagram", valorPorDefecto: "", tipo: url }
  - { nombre: twitterUrl, descripcion: "Tu Twitter/X", valorPorDefecto: "", tipo: url }
  - { nombre: webUrl, descripcion: "Tu web", valorPorDefecto: "", tipo: url }
  - { nombre: listaUrl, descripcion: "Playlist relacionada", valorPorDefecto: "", tipo: url }
  - { nombre: hashtag1, descripcion: "Hashtag amplio", valorPorDefecto: "", tipo: texto }
  - { nombre: hashtag2, descripcion: "Hashtag medio", valorPorDefecto: "", tipo: texto }
  - { nombre: hashtag3, descripcion: "Hashtag específico", valorPorDefecto: "", tipo: texto }
contenido: |
  {seoExtracto}

  {resumenVideo}

  ━━━━━━━━━━━━━━━━━━━━
  CONÉCTATE CONMIGO
  ━━━━━━━━━━━━━━━━━━━━
  🔗 Web: {webUrl}
  🔗 Instagram: {instagramUrl}
  🔗 Twitter/X: {twitterUrl}

  ━━━━━━━━━━━━━━━━━━━━
  PLAYLIST RELACIONADA
  ━━━━━━━━━━━━━━━━━━━━
  {listaUrl}

  ━━━━━━━━━━━━━━━━━━━━
  CAPÍTULOS
  ━━━━━━━━━━━━━━━━━━━━
  00:00 Introducción
  XX:XX [Bloque 1]
  XX:XX [Bloque 2]
  XX:XX [Bloque 3]
  XX:XX Conclusión

  Si te ha gustado, dale a "Me gusta" y suscríbete para no perderte ningún vídeo. Cada like es un empujón al algoritmo y me ayuda muchísimo.

  Soy {nombreCanal} y nos vemos en el siguiente vídeo.

  {hashtag1} {hashtag2} {hashtag3}
```

---

## 5.4 PLANTILLA — Comentario fijado

```yaml
id: tpl_comentario_fijado
nombre: Comentario fijado
tipo: descripcion
seccionRelacionadaId: s10
variablesDinamicas:
  - { nombre: tituloVideo, descripcion: "Título del vídeo", valorPorDefecto: "", tipo: texto }
  - { nombre: preguntaAudiencia, descripcion: "Pregunta abierta a la audiencia", valorPorDefecto: "", tipo: texto }
  - { nombre: enlaceExtra, descripcion: "Recurso/enlace adicional", valorPorDefecto: "", tipo: url }
contenido: |
  🔥 ¿Quieres profundizar en lo que cuento en "{tituloVideo}"?

  👉 {enlaceExtra}

  Y dime: {preguntaAudiencia}

  Te leo abajo 👇
```

---

## 5.5 PLANTILLAS — Briefs de miniatura

### `tpl_brief_miniatura_seomarco`
```yaml
tipo: miniatura_brief
seccionRelacionadaId: s5
variablesDinamicas:
  - { nombre: tituloVideo, descripcion: "Título", valorPorDefecto: "", tipo: texto }
  - { nombre: colorMarco, descripcion: "Color del marco", valorPorDefecto: "#FFD60A", tipo: texto }
contenido: |
  BRIEF MINIATURA — Estrategia SEOmarco
  Vídeo: {tituloVideo}

  Elementos:
  - Marco/borde grueso (8-12 px) de color {colorMarco} alrededor de la miniatura completa.
  - 3-5 palabras impactantes centradas o tercio superior izquierdo.
  - Composición principal en regla de tercios.

  Paleta sugerida:
  - Fondo: tono oscuro contrastante.
  - Acento marco: {colorMarco}.
  - Texto: blanco o amarillo.

  Test visual:
  - ¿Destaca en una grilla pequeña? Sí ___ No ___
  - ¿Es legible a 100px de ancho? Sí ___ No ___
```

### `tpl_brief_miniatura_seocara`
```yaml
tipo: miniatura_brief
contenido: |
  BRIEF MINIATURA — Estrategia SEOcara
  Vídeo: {tituloVideo}

  Elementos:
  - Rostro humano ocupa 40-60% de la miniatura.
  - Expresión exagerada coherente con el tema (sorpresa, alegría, preocupación).
  - Texto 3 palabras al lado opuesto del rostro.

  Composición:
  - Si rostro a la izquierda → texto a la derecha y viceversa.
  - Mirada del rostro hacia el texto (guía la vista).

  Iluminación:
  - Frontal + contraluz para separar del fondo.
```

### `tpl_brief_miniatura_seoflecha`
```yaml
tipo: miniatura_brief
contenido: |
  BRIEF MINIATURA — Estrategia SEOflecha
  Vídeo: {tituloVideo}

  Elementos:
  - Flecha visible (color contrastante, suele rojo o amarillo) apuntando al elemento clave.
  - Círculo/marco rojo opcional para enmarcar lo importante.
  - Texto descriptivo de 2-3 palabras.

  Composición:
  - La flecha guía el ojo al PUNTO DE INTERÉS (objeto, parte de la cara, palabra clave).
  - Evitar más de 1 flecha (satura).
```

---

## 5.6 PLANTILLAS — Emails

### `tpl_email_bienvenida`
```yaml
tipo: email
seccionRelacionadaId: s18
variablesDinamicas:
  - { nombre: nombreCanal, descripcion: "Nombre del canal", valorPorDefecto: "", tipo: texto }
  - { nombre: nombreCreador, descripcion: "Nombre del creador", valorPorDefecto: "", tipo: texto }
  - { nombre: top3VideoUrl1, descripcion: "URL vídeo top 1", valorPorDefecto: "", tipo: url }
  - { nombre: top3VideoUrl2, descripcion: "URL vídeo top 2", valorPorDefecto: "", tipo: url }
  - { nombre: top3VideoUrl3, descripcion: "URL vídeo top 3", valorPorDefecto: "", tipo: url }
contenido: |
  Asunto: Te doy la bienvenida (y un regalo)
  Pre-header: Empezamos fuerte. Esto es lo que vas a recibir.

  Hola,

  Soy {nombreCreador} de {nombreCanal} y me alegro mucho de que estés aquí.

  Para que arranquemos juntos, te dejo los 3 vídeos que más han cambiado la vida de mi audiencia:

  1) {top3VideoUrl1}
  2) {top3VideoUrl2}
  3) {top3VideoUrl3}

  Cada semana te mandaré algo útil. Si en algún momento ya no te aporta, te desuscribes en 1 clic, sin rencores.

  Nos vemos pronto,
  {nombreCreador}

  PD: Responde a este email contándome QUÉ te trajo a mi canal. Lo leo todo.
```

### `tpl_email_nuevo_video`
```yaml
tipo: email
variablesDinamicas:
  - { nombre: tituloVideo, descripcion: "Título del vídeo", valorPorDefecto: "", tipo: texto }
  - { nombre: urlVideo, descripcion: "URL del vídeo", valorPorDefecto: "", tipo: url }
  - { nombre: ganchoCorto, descripcion: "1 frase gancho del vídeo", valorPorDefecto: "", tipo: texto }
contenido: |
  Asunto: {ganchoCorto}
  Pre-header: Acabo de subir uno de los vídeos más importantes que he hecho.

  Hola,

  {ganchoCorto}

  Lo cuento todo aquí 👉 {urlVideo}

  Te aviso de algo: en el minuto 3:20 hay un giro que no te esperas. Que lo veas con tiempo.

  Nos vemos dentro,
  [Firma]

  PD: Si el vídeo te ayuda, déjame un comentario. Cada uno me da ganas de seguir.
```

### `tpl_email_sorteo`
```yaml
tipo: email
variablesDinamicas:
  - { nombre: premio, descripcion: "Qué se sortea", valorPorDefecto: "", tipo: texto }
  - { nombre: fechaCierre, descripcion: "Fecha y hora límite", valorPorDefecto: "", tipo: texto }
  - { nombre: urlMecanica, descripcion: "URL con la mecánica completa", valorPorDefecto: "", tipo: url }
contenido: |
  Asunto: Sorteo de {premio} (cierra en 48h)
  Pre-header: Participación en 1 minuto.

  Hola,

  Esta semana sorteo {premio}.

  Mecánica (sencilla):
  1) Suscríbete al canal si aún no lo estás.
  2) Comenta en el vídeo nuevo "QUIERO {premio}".
  3) Listo. Anuncio ganador el {fechaCierre}.

  Detalles aquí 👉 {urlMecanica}

  ¡Suerte!
```

### `tpl_email_lead_magnet`
```yaml
tipo: email
variablesDinamicas:
  - { nombre: nombreRecurso, descripcion: "Nombre del recurso", valorPorDefecto: "", tipo: texto }
  - { nombre: urlDescarga, descripcion: "URL de descarga", valorPorDefecto: "", tipo: url }
contenido: |
  Asunto: Aquí tienes {nombreRecurso}
  Pre-header: Tal y como te prometí. Úsalo cuanto antes.

  Hola,

  Aquí tienes {nombreRecurso}: {urlDescarga}

  Te recomiendo abrirlo HOY, no lo dejes para "luego" (sabes cómo va eso 😉).

  Cómo sacarle el máximo:
  1) Léelo de un tirón sin pararte.
  2) Vuelve al inicio y aplica solo 1 cosa esta semana.
  3) Respóndeme al email contándome qué cambia.

  Te leo,
  [Firma]
```

---

## 5.7 PLANTILLAS — Comunidad

### `tpl_comunidad_giftcalipsis`
```yaml
tipo: comunidad
seccionRelacionadaId: s15
contenido: |
  POST GIFTCALIPSIS

  GIF/imagen en movimiento + frase ultra-corta.

  Frase (máx 80 chars):
  [Algo provocador, divertido o que rompa el patrón]

  Pregunta cebo (opcional):
  ¿Reaccionarías igual?

  Hora óptima: noche (20:00 - 22:00) o sábado tarde.
```

### `tpl_comunidad_seoencuesta`
```yaml
tipo: comunidad
variablesDinamicas:
  - { nombre: pregunta, descripcion: "Pregunta de la encuesta", valorPorDefecto: "", tipo: texto }
  - { nombre: opcion1, descripcion: "Opción 1", valorPorDefecto: "", tipo: texto }
  - { nombre: opcion2, descripcion: "Opción 2", valorPorDefecto: "", tipo: texto }
  - { nombre: opcion3, descripcion: "Opción 3 (opcional)", valorPorDefecto: "", tipo: texto }
contenido: |
  POST ENCUESTA

  Contexto previo (1-2 frases):
  [Por qué pregunto esto]

  Pregunta: {pregunta}
  - {opcion1}
  - {opcion2}
  - {opcion3}

  Cierre:
  Comenta el porqué de tu voto, me ayuda muchísimo.
```

### `tpl_comunidad_seolaunch`
```yaml
tipo: comunidad
variablesDinamicas:
  - { nombre: tituloVideo, descripcion: "Título próximo vídeo", valorPorDefecto: "", tipo: texto }
  - { nombre: diaEstreno, descripcion: "Día de estreno", valorPorDefecto: "", tipo: texto }
contenido: |
  POST SEOlaunch (pre-estreno)

  🚀 ESTRENO {diaEstreno}

  "{tituloVideo}"

  [1 línea creando expectativa]

  ¿Lo quieres ya? Pon ✋ en comentarios y te aviso en cuanto suba.
```

### `tpl_comunidad_seorepesca`
```yaml
tipo: comunidad
variablesDinamicas:
  - { nombre: tituloVideo, descripcion: "Título del vídeo a repescar", valorPorDefecto: "", tipo: texto }
  - { nombre: urlVideo, descripcion: "URL del vídeo", valorPorDefecto: "", tipo: url }
  - { nombre: datoImpactante, descripcion: "Dato/momento clave del vídeo", valorPorDefecto: "", tipo: texto }
contenido: |
  POST SEOrepesca (24-72h después del lanzamiento)

  ¿Te perdiste esto?

  En "{tituloVideo}" cuento que {datoImpactante}.

  Si aún no lo viste: {urlVideo}

  Aviso: el minuto 3 te va a hacer pensar.
```

### `tpl_comunidad_seorteo`
```yaml
tipo: comunidad
seccionRelacionadaId: s7
variablesDinamicas:
  - { nombre: premio, descripcion: "Premio", valorPorDefecto: "", tipo: texto }
  - { nombre: tituloVideo, descripcion: "Vídeo asociado", valorPorDefecto: "", tipo: texto }
  - { nombre: fechaCierre, descripcion: "Fecha cierre", valorPorDefecto: "", tipo: texto }
contenido: |
  POST SEOrteo (estrategia de fidelización)

  🎁 SORTEO de {premio}

  Para participar:
  1) Suscríbete al canal.
  2) Comenta el vídeo "{tituloVideo}".
  3) Comparte este post.

  Cierro el {fechaCierre}.
  Ganador anunciado en directo.

  Bases en la descripción del vídeo.
```

---

## 5.8 PLANTILLAS — Estructura del canal

### `tpl_banner_canal`
```yaml
tipo: banner
seccionRelacionadaId: s1
contenido: |
  BANNER DEL CANAL — Especificaciones técnicas

  Medidas:
  - 2560 x 1440 px (mínimo).
  - "Área segura" central: 1546 x 423 px (lo único que se ve en móvil).

  Elementos a incluir:
  - Logo / nombre del canal (área segura).
  - Frase de posicionamiento (máx 6 palabras).
  - Frecuencia de publicación ("Lunes y jueves").
  - CTA suscríbete (opcional).
  - 1-2 logos de redes (área extendida, solo en desktop).

  Evitar:
  - Texto pequeño (no se lee en TV).
  - Elementos importantes fuera del área segura.
  - Colores que choquen con la foto de perfil.

  Paleta:
  - Máx 3 colores principales.
  - Contraste claro vs fondo.

  Foto de perfil:
  - 800x800 px.
  - Coherente con banner.
```

### `tpl_trailer_canal`
```yaml
tipo: trailer
seccionRelacionadaId: s8
variablesDinamicas:
  - { nombre: nombreCanal, descripcion: "Nombre del canal", valorPorDefecto: "", tipo: texto }
  - { nombre: propuestaValor, descripcion: "Lo que vas a recibir aquí (1 frase)", valorPorDefecto: "", tipo: texto }
  - { nombre: frecuencia, descripcion: "Cada cuánto publicas", valorPorDefecto: "", tipo: texto }
contenido: |
  ESTRUCTURA SEOTrailer (60-90 segundos)

  0:00 — 0:05 HOOK
  [Frase provocadora o demostración visual]

  0:05 — 0:15 QUIÉN ERES Y QUÉ HACES
  "Soy [nombre] de {nombreCanal} y {propuestaValor}."

  0:15 — 0:35 QUÉ VAS A ENCONTRAR AQUÍ
  - Lista 3 tipos de contenido / temas que tratas
  - Mostrar fragmentos rápidos (b-roll).

  0:35 — 0:50 PARA QUIÉN ES
  [Define a la audiencia ideal en positivo]

  0:50 — 1:05 PRUEBA SOCIAL O LOGRO
  - Cita / testimonio breve
  - Cifra de subscriptores o vídeos
  - Reconocimiento si aplica

  1:05 — 1:20 FRECUENCIA Y EXPECTATIVA
  "Publico {frecuencia}. Si te interesa, dale a suscribirte."

  1:20 — 1:30 CTA + CLIFFHANGER
  [Promesa de algo concreto que va a aparecer pronto]
```

### `tpl_video_destacado`
```yaml
tipo: trailer
seccionRelacionadaId: s8
contenido: |
  VÍDEO DESTACADO (SEOdestacado) — Para suscriptores existentes

  Objetivo: mostrar el "mejor" vídeo o el más representativo.

  Criterios para elegirlo:
  - Buena retención (>50%).
  - Cubre tema central del canal.
  - No tiene más de 6 meses (frescura).

  Si no tienes ninguno que cumpla → graba uno específico tipo "Qué vas a encontrar en este canal en 2026".
```

---

## 5.9 PLANTILLAS — Pantallas finales y tarjetas

### `tpl_pantallas_finales`
```yaml
tipo: pantalla_final
seccionRelacionadaId: s13
contenido: |
  PLAN DE PANTALLAS FINALES (últimos 20 segundos)

  Elige una configuración:

  UNITARIA (1 elemento):
  - Solo el botón de suscribirse o un vídeo recomendado.
  - Uso: vídeos cortos donde "menos es más".

  BINARIA (2 elementos): [RECOMENDADA POR DEFECTO]
  - Elemento izquierdo: VÍDEO recomendado (siguiente lógico).
  - Elemento derecho: SUSCRIPCIÓN.

  TERCIARIA (3 elementos):
  - Vídeo siguiente + Vídeo recomendado por algoritmo + Suscripción.

  CUATERNARIA (4 elementos):
  - Vídeo siguiente + Otro vídeo + Lista + Suscripción.

  CON PLANTILLA:
  - Usa la misma disposición visual en todos los vídeos para coherencia de marca.

  Reglas:
  - Deja el último frame del vídeo con espacio visual reservado.
  - Indica en audio: "Y si quieres seguir aprendiendo, te dejo este otro vídeo justo aquí ➡"
  - No coloques en el primer 1/3 (centro).

  Plantilla rellenable:
  Configuración elegida: ___
  Elemento 1: tipo: _____ destino: _____ posición: _____
  Elemento 2: tipo: _____ destino: _____ posición: _____
  Elemento 3: tipo: _____ destino: _____ posición: _____
  Elemento 4: tipo: _____ destino: _____ posición: _____
```

### `tpl_tarjetas`
```yaml
tipo: tarjeta
seccionRelacionadaId: s14
contenido: |
  PLAN DE TARJETAS (máx 5 por vídeo)

  Tipos disponibles:
  - Subjeta — destinada a captar suscriptores (rara, alta conversión).
  - Indujetas — derivar de un evergreen a un vídeo sprint.
  - Psicojetas — colocada en picos de retención positivos.
  - SEOjeta — derivar tráfico a un vídeo ya posicionado.
  - SEOrescate — evitar que el usuario abandone el canal.

  Plantilla:

  Tarjeta 1:
   Tipo: ____ Momento: __:__ Destino: ____ CTA: ____

  Tarjeta 2:
   Tipo: ____ Momento: __:__ Destino: ____ CTA: ____

  Tarjeta 3:
   Tipo: ____ Momento: __:__ Destino: ____ CTA: ____

  Tarjeta 4:
   Tipo: ____ Momento: __:__ Destino: ____ CTA: ____

  Tarjeta 5:
   Tipo: ____ Momento: __:__ Destino: ____ CTA: ____

  Reglas:
  - NUNCA poner tarjeta en el primer minuto (interrumpe enganche).
  - NUNCA en los últimos 30s (compiten con pantallas finales).
  - Distancia mínima entre tarjetas: 2 minutos.
  - Apoyar siempre con mención en audio.
```

---

## 5.10 PLANTILLAS — Checklists

### `tpl_checklist_pre_publicacion`
```yaml
tipo: checklist
seccionRelacionadaId: s9
contenido: |
  CHECKLIST PRE-PUBLICACIÓN

  Vídeo
  [ ] Render exportado en máxima calidad
  [ ] Audio normalizado (-14 LUFS aprox)
  [ ] Subtítulos manuales subidos si hay términos clave
  [ ] Pantallas finales planeadas (últimos 20s)

  Metadata
  [ ] Título final (≤ 60 chars idealmente)
  [ ] Miniatura subida (1280x720, < 2MB, JPG)
  [ ] Descripción optimizada (SEOextracto, enlaces, hashtags)
  [ ] 3 hashtags en descripción
  [ ] 1 hashtag en título
  [ ] Timestamps con primer "00:00"
  [ ] Lista de reproducción asignada
  [ ] Etiquetas relevantes

  Configuración YouTube
  [ ] Tarjetas configuradas (máx 5)
  [ ] Pantallas finales configuradas
  [ ] Hora de publicación elegida (SEOhora)
  [ ] No es "para niños" marcado correctamente
  [ ] Idioma del vídeo correcto

  Difusión preparada
  [ ] Email de nuevo vídeo en borrador
  [ ] Post de comunidad en borrador
  [ ] Posts para redes en borrador
  [ ] Comentario fijado redactado

  Marca personal
  [ ] El vídeo refleja la propuesta de valor del canal
  [ ] CTA (PsicoCTA) presente y claro
```

### `tpl_checklist_post_publicacion`
```yaml
tipo: checklist
seccionRelacionadaId: s3
contenido: |
  CHECKLIST POST-PUBLICACIÓN — FASE SPRINT (7 días)

  DÍA 1
  [ ] Email a la lista enviado en la primera hora
  [ ] Post de comunidad publicado (Giftcalipsis / SEOlaunch)
  [ ] Compartido en Instagram, X, TikTok
  [ ] Comentario fijado publicado
  [ ] Responder primeros 20 comentarios en < 1h
  [ ] (Opcional) Ads activados

  DÍA 2
  [ ] Snapshot métricas (vistas, CTR, retención)
  [ ] Responder comentarios nuevos
  [ ] Re-compartir en stories

  DÍA 3
  [ ] Snapshot métricas
  [ ] Post de comunidad SEOrepesca

  DÍA 4-5
  [ ] Snapshot métricas
  [ ] Si CTR bajo → considerar cambiar miniatura
  [ ] Compartir clip corto en redes

  DÍA 6-7
  [ ] Snapshot final del sprint
  [ ] Comparativa con vídeo anterior
  [ ] Anotar aprendizajes en notas del proyecto
```

---

## 5.11 PLANTILLA — Panel de marca / KPIs

```yaml
id: tpl_panel_marca
nombre: Panel de marca / KPIs personalizables
tipo: checklist
seccionRelacionadaId: s17
contenido: |
  PANEL DE MARCA — Métricas clave del canal

  Columnas a registrar (semanalmente):
  - Suscriptores totales
  - Vistas última semana
  - CTR medio última semana
  - Retención media última semana
  - Velocidad evergreen media
  - Ingresos estimados (si monetizable)
  - RPM
  - Frecuencia publicación

  Objetivos del trimestre:
  - Suscriptores: _____ → _____
  - Vistas mensuales: _____ → _____
  - CTR objetivo: _____ %
  - Retención objetivo: _____ %

  Variación respecto al mes anterior:
  - [ ] Mejor / [ ] Igual / [ ] Peor

  Acciones a probar este mes:
  1) ________________
  2) ________________
  3) ________________
```

---

## 5.12 PLANTILLA — Campaña Ads

```yaml
id: tpl_campana_ads
nombre: Plantilla campaña Ads (IG/FB/YT)
tipo: comunidad
seccionRelacionadaId: s17
contenido: |
  PLAN DE CAMPAÑA DE ADS

  Objetivo:
  [ ] Reconocimiento (mostrar a más gente)
  [ ] Tráfico (que vayan a YT)
  [ ] Interacción (likes/comentarios)
  [ ] Conversión (suscripción / venta)

  Plataforma:
  [ ] Instagram Ads
  [ ] Facebook Ads
  [ ] YouTube Ads

  Audiencias:
  - Audiencia 1: [intereses / lookalike]
  - Audiencia 2: [intereses / lookalike]
  - Audiencia 3 (retargeting): visitantes / engagement previo

  Creatividades:
  - Vídeo principal (formato vertical 9:16 si IG/FB, horizontal o vertical si YT)
  - Variantes A/B: 2-3 miniaturas, 2-3 hooks

  Presupuesto:
  - Diario: ___ €
  - Total: ___ €
  - Duración: ___ días

  KPIs objetivo:
  - CPV (coste por visualización): < ___ €
  - CPC: < ___ €
  - CTR: > ___ %

  Plan de revisión:
  - Día 3: pausar grupos con CPV alto
  - Día 7: duplicar mejores grupos
  - Día 14: refrescar creatividades si la frecuencia > 3
```

---

## 5.13 PLANTILLA — SEOlista

```yaml
id: tpl_seolista
nombre: SEOlista — lista de reproducción optimizada
tipo: descripcion
seccionRelacionadaId: s11
variablesDinamicas:
  - { nombre: nombreLista, descripcion: "Nombre de la lista", valorPorDefecto: "", tipo: texto }
  - { nombre: palabraClavePrincipal, descripcion: "Palabra clave principal", valorPorDefecto: "", tipo: texto }
contenido: |
  SEOlista — {nombreLista}

  Nombre optimizado:
  - Incluye la palabra clave principal "{palabraClavePrincipal}"
  - Entre 40 y 60 chars
  - Empieza con la kw si es posible

  Descripción de la lista (200-300 chars):
  "Aprende {palabraClavePrincipal} desde cero hasta nivel avanzado. En esta playlist te llevo paso a paso por los conceptos clave, los errores comunes y las técnicas que funcionan en 2026."

  Orden de los vídeos:
  1) Vídeo introductorio (el más amplio).
  2) Conceptos básicos.
  3) Casos prácticos.
  4) Técnicas avanzadas.
  5) Mantenimiento / siguiente nivel.

  Mantenimiento:
  - Revisar orden cada 3 meses.
  - Sustituir vídeos antiguos con bajo CTR.
  - Añadir nuevos al final.
  - Marcar 1-2 como "destacados" rotando cada mes.

  Miniaturas de la lista:
  - Coherencia visual: misma paleta / mismo tipo de composición.
  - Usar un "marco" común a todas las miniaturas de la lista.
```

---

## 5.14 FORMATO DE EXPORT/DESCARGA

| Formato | Cuándo |
|---------|--------|
| `.md` | Por defecto |
| `.txt` | Para copiar en YouTube |
| `.pdf` | Plantillas largas (briefs, planes, banner) |

El backend resuelve las variables ANTES de exportar.

---

## 5.15 FICHERO DE SEED `05_plantillas_seed.json`

Para que la IA constructora pueda cargar todo en BD sin parsear este markdown, existe el fichero JSON paralelo `05_plantillas_seed.json` con todas estas plantillas listas para insertar. Se regenera con `node scripts/build_seeds.mjs` si se edita este markdown.
