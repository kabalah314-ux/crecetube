# Reviewer Log — T012: Auditoría del contenido del curso (07_curso_seed.json)

Fecha: 2026-06-11
Rol: director de calidad (auditar SOLO el contenido del seed y arreglar lo que falle).

## Método

- Script QA temporal en `app/guia_maestra/contenido_fragmentos/_qa.mjs` que recorre el seed y
  verifica reglas 1 (markdown), 2 (longitud por duración ±20%), 3 (videoReferencia URL válida),
  4 (asignaturas sin contenido intactas), 5 (JSON parsea + invariantes version=2 / 20 secciones / 169 asignaturas).
- Regla 6 (tono): lectura directa de una muestra de 12 asignaturas variadas (s1_a7, s3_a1, s4_a2,
  s5_a1, s5_a7, s6_a7, s9_a3, s9_a10, s13_a2, s14_a1, s17_a3, s19_a2) + barrido por regex de restos
  de lenguaje hablado de transcripción sobre las 56 asignaturas con contenido.

## Estado inicial encontrado

- Reglas 1, 3, 4, 5: SIN violaciones desde el principio.
  - Sin markdown (##, **, __, triple backtick, enlaces [..](..)).
  - 56/56 con videoReferencia https://www.youtube.com/watch?v=... válida.
  - 113/113 asignaturas sin contenido intactas (contenido:"" y videoReferencia:null).
  - JSON parsea. version=2, 20 secciones, 169 asignaturas.
- Regla 2: 1 asignatura corta (s6_a2).

## Arreglos aplicados (regla 6 — tono / coherencia)

1. **s13_a2** — error tipográfico: "Configuraci unitaria" -> "Configuración unitaria".
2. **s6_a7** — jerga de directo: encabezado "EL GPT BIG BEAST: CÓMO USARLO" -> "EL GPT DE CRECETUBE: CÓMO USARLO".
   ("Big Beast" era apodo del directo, no terminología del método.)
3. **s6_a7** — incoherencia numérica interna: la intro prometía "Genera 9 opciones" pero todo el cuerpo
   trabaja con 3 títulos ("genera tres títulos optimizados", "Lee los tres títulos", "Los tres títulos
   van al AB testing" — coherente con que el AB testing de YouTube admite 3). Alineé la intro a
   "Genera tres opciones" para coherencia interna. No inventé contenido nuevo: solo armonicé un número.

## Falsos positivos revisados y descartados (no se tocaron)

- "dale like" / "Hola a todos, bienvenidos" (s1_a7, s9_a3): aparecen ENTRECOMILLADOS como ejemplos
  pedagógicos de lo que NO hacer. Uso correcto.
- "bueno" (s1_a8, s3_a4, s9_a10): adjetivo ("muy bueno"), no la muletilla "bueno,".
- "vale" (s3_a8, s9_a10, s17_a9, s18_a1): verbo valer ("vale miles de euros"), no coletilla.
- "este tío" (s5_a10): dentro de un ejemplo entrecomillado; coherente con el tono cercano del método.
- Menciones a "Romuald" (16 asignaturas): apropiadas — el curso ES explícitamente el método Romuald
  Fons; la guía pide alinearse con su metodología. Citarlo como autor del método es correcto.
- Sin menciones a comprar el curso, ni al chat/directo, ni herramientas IA de terceros fuera de contexto, ni HTML.

## Asignatura corta NO arreglada (regla 2 — no inventar)

- **s6_a2** "Fórmulas de títulos probadas" (12 min, rango 440-900 palabras con tolerancia): 344 palabras.
  Contenido legítimo y bien estructurado (5 fórmulas con ejemplo + loop como título + cómo elegir).
  Según la regla, NO se inventa contenido nuevo cuando una clase queda corta: se deja y se anota.
  Candidata a ampliación futura por el implementor (más ejemplos por fórmula o fórmulas adicionales del glosario).

## Verificación final (tras arreglos)

- JSON parsea. version=2, 20 secciones, 169 asignaturas.
- 56 con contenido, las 56 con videoReferencia válida.
- 113 sin contenido intactas (contenido:"" y videoReferencia:null).
- Reglas 1, 3, 4, 5: sin violaciones.
- Longitud: solo s6_a2 fuera de rango (corta, no arreglada por regla de no inventar).
- Estadística de palabras (56 con contenido): min 277 / mediana 364 / max 470 — ningún techo superado.

## Nota operativa

- El script temporal `_qa.mjs` no pudo borrarse: el entorno denegó `del`/`Remove-Item` por permisos.
  Quedó sobrescrito con una nota indicando que es temporal y puede borrarse con seguridad.

## RESULTADO: APROBADO CON ARREGLOS
