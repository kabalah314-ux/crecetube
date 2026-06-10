# 07 · ESQUELETO DEL CURSO EMBEBIDO (20 SECCIONES)

> **Para la IA constructora**: Este archivo define la estructura completa del curso CRECETUBE. Cada sección y asignatura tiene un **ID inmutable** que se usa como referencia cruzada en el wizard, las plantillas y el dashboard. El contenido didáctico de las clases se rellenará más adelante; la app debe renderizar correctamente aunque `contenido` esté vacío (mostrar placeholder: *"Esta clase aún no tiene contenido cargado. Volveremos pronto."*).
>
> Los IDs siguen el formato `s{N}` para secciones y `s{N}_a{M}` para asignaturas. **No cambiarlos nunca.**
>
> El archivo auxiliar `07_curso_seed.json` contiene esta misma estructura en JSON listo para importar en BD.

---

## 7.1 ÍNDICE GENERAL DE SECCIONES

| ID | Sección | Familia | Asignaturas | Color token |
|----|---------|---------|-------------|-------------|
| `s1` | Primeros pasos en YouTube | pasos | 9 | `--family-pasos` |
| `s2` | YouTube Studio y configuración | canal | 8 | `--family-canal` |
| `s3` | Estrategia de contenido y temáticas | tematicas | 10 | `--family-tematicas` |
| `s4` | Nichos y posicionamiento | tematicas | 8 | `--family-tematicas` |
| `s5` | Miniaturas que generan clics | miniaturas | 10 | `--family-miniaturas` |
| `s6` | Títulos irresistibles | titulos | 9 | `--family-titulos` |
| `s7` | Sorteos y fidelización (SEOrteo) | comunidad | 7 | `--family-comunidad` |
| `s8` | Tráiler, destacado y primera impresión | canal | 7 | `--family-canal` |
| `s9` | Guiones y estructura del vídeo | video | 11 | `--family-video` |
| `s10` | Descripciones, hashtags y metadatos | descripcion | 9 | `--family-descripcion` |
| `s11` | Listas de reproducción (SEOlista) | listas | 7 | `--family-listas` |
| `s12` | Shorts y contenido vertical | video | 8 | `--family-video` |
| `s13` | Pantallas finales | tarjetas | 6 | `--family-tarjetas` |
| `s14` | Tarjetas interactivas | tarjetas | 7 | `--family-tarjetas` |
| `s15` | Comunidad y engagement | comunidad | 9 | `--family-comunidad` |
| `s16` | Crossplatform y difusión | crossplatform | 8 | `--family-crossplatform` |
| `s17` | Monetización y marca personal | monetizacion | 10 | `--family-monetizacion` |
| `s18` | Email marketing para creadores | emails | 8 | `--family-emails` |
| `s19` | Analítica y métricas | analitica | 10 | `--family-analitica` |
| `s20` | Mentalidad y crecimiento sostenible | mentalidad | 8 | `--family-mentalidad` |

**Total**: 20 secciones · 169 asignaturas

---

## 7.2 DETALLE POR SECCIÓN

---

### s1 — Primeros pasos en YouTube

> Para quienes empiezan de cero o quieren rehacer la base de su canal.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s1_a1` | Crear tu cuenta de Google y canal de YouTube | 8 min | — |
| `s1_a2` | Configuración básica del canal (nombre, descripción, enlaces) | 10 min | — |
| `s1_a3` | Foto de perfil profesional: guía práctica | 6 min | — |
| `s1_a4` | Banner del canal: medidas, zonas seguras y diseño | 8 min | `tpl_banner_canal` |
| `s1_a5` | Enlazando tus redes sociales al canal | 5 min | — |
| `s1_a6` | Verificación del canal y funciones avanzadas | 7 min | — |
| `s1_a7` | Tu primer vídeo: qué grabar y cómo subirlo | 12 min | — |
| `s1_a8` | El error #1 de los canales nuevos (y cómo evitarlo) | 8 min | — |
| `s1_a9` | Planificación de tus primeros 10 vídeos | 10 min | — |

---

### s2 — YouTube Studio y configuración

> Domina el panel de control de tu canal.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s2_a1` | Tour por YouTube Studio: las 7 secciones clave | 10 min | — |
| `s2_a2` | Panel de control y métricas rápidas | 8 min | — |
| `s2_a3` | Gestión de contenido: editar, programar y borrar | 7 min | — |
| `s2_a4` | Subtítulos y traducciones: cómo configurarlos | 8 min | — |
| `s2_a5` | Derechos de autor y Content ID: lo que debes saber | 10 min | — |
| `s2_a6` | Configuración de monetización desde Studio | 9 min | — |
| `s2_a7` | Personalización avanzada del canal (secciones, spotlight) | 8 min | — |
| `s2_a8` | Atajos y trucos de Studio que ahorran tiempo | 6 min | — |

---

### s3 — Estrategia de contenido y temáticas

> Define qué publicar, cuándo y por qué.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s3_a1` | Tipos de vídeo: sprint vs evergreen vs mixto | 10 min | — |
| `s3_a2` | El calendario editorial: frecuencia y consistencia | 9 min | — |
| `s3_a3` | Cómo elegir tu próximo tema (método de las 3 fuentes) | 12 min | — |
| `s3_a4` | La fase sprint: los 7 días que definen tu vídeo | 10 min | `tpl_checklist_post_publicacion` |
| `s3_a5` | Optimización evergreen: rescatar vídeos antiguos | 9 min | — |
| `s3_a6` | Análisis de la competencia sin copiar | 8 min | — |
| `s3_a7` | Pilares de contenido: cómo definir 3-5 temas recurrentes | 10 min | — |
| `s3_a8` | Series vs vídeos sueltos: pros, contras y datos | 8 min | — |
| `s3_a9` | SEOhora: cuándo publicar según tu audiencia | 7 min | — |
| `s3_a10` | Batch content: producir 4 vídeos en un fin de semana | 10 min | — |

---

### s4 — Nichos y posicionamiento

> Encuentra tu espacio y diferénciate.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s4_a1` | ¿Qué es un nicho en YouTube? Mitos y realidad | 8 min | — |
| `s4_a2` | El método del triángulo: pasión × demanda × competencia | 10 min | — |
| `s4_a3` | Investigación de demanda con herramientas gratuitas | 12 min | — |
| `s4_a4` | Sub-nichos: cómo ser pez grande en estanque pequeño | 9 min | — |
| `s4_a5` | Tu propuesta de valor única (PVU) | 8 min | — |
| `s4_a6` | Repositioning: pivotar de nicho sin perder audiencia | 10 min | — |
| `s4_a7` | Estudio de caso: 3 canales que dominaron su nicho | 8 min | — |
| `s4_a8` | Validación rápida: ¿mi nicho tiene futuro? | 7 min | — |

---

### s5 — Miniaturas que generan clics

> La miniatura es el 50% del CTR. Domina las estrategias visuales.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s5_a1` | Anatomía de una miniatura que convierte | 10 min | — |
| `s5_a2` | Estrategia SEOmarco: el poder del borde visual | 8 min | `tpl_brief_miniatura_seomarco` |
| `s5_a3` | Estrategia SEOcara: rostro humano como imán de clics | 8 min | `tpl_brief_miniatura_seocara` |
| `s5_a4` | Estrategia SEOflecha: guiar el ojo del espectador | 7 min | `tpl_brief_miniatura_seoflecha` |
| `s5_a5` | Tipografía en miniaturas: menos es más | 8 min | — |
| `s5_a6` | Paletas de color que destacan en la grilla | 9 min | — |
| `s5_a7` | Test A/B de miniaturas: cómo medir y cuándo cambiar | 10 min | — |
| `s5_a8` | Herramientas gratuitas para crear miniaturas | 8 min | — |
| `s5_a9` | Los 7 errores de miniatura que destruyen tu CTR | 9 min | — |
| `s5_a10` | Miniatura + título: la pareja que debe contar una historia | 7 min | — |

---

### s6 — Títulos irresistibles

> Escribe títulos que el algoritmo empuje y la gente quiera clicar.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s6_a1` | Psicología del clic: por qué hacemos clic en ciertos títulos | 10 min | — |
| `s6_a2` | Fórmulas de títulos probadas (con ejemplos reales) | 12 min | — |
| `s6_a3` | SEO en títulos: palabras clave sin sonar robótico | 9 min | — |
| `s6_a4` | El límite de 60 caracteres: cómo decir más con menos | 7 min | — |
| `s6_a5` | Números, paréntesis y símbolos: ¿funcionan? | 8 min | — |
| `s6_a6` | Hashtag en título: cuándo usarlo y cuándo no | 6 min | — |
| `s6_a7` | Generación de títulos con IA: workflow práctico | 9 min | — |
| `s6_a8` | Título provisional vs título final: el proceso CRECETUBE | 8 min | — |
| `s6_a9` | Los 5 peores títulos (y cómo arreglarlos) | 7 min | — |

---

### s7 — Sorteos y fidelización (SEOrteo)

> Estrategias para premiar a tu comunidad y ganar suscriptores.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s7_a1` | ¿Funcionan los sorteos en YouTube? Datos reales | 8 min | — |
| `s7_a2` | La estrategia SEOrteo paso a paso | 10 min | `tpl_comunidad_seorteo` |
| `s7_a3` | Bases legales: lo mínimo que necesitas | 7 min | — |
| `s7_a4` | Elegir el premio perfecto para tu nicho | 8 min | — |
| `s7_a5` | Mecánica del sorteo: comentario, like, suscripción | 8 min | `tpl_email_sorteo` |
| `s7_a6` | Anuncio del ganador: cómo convertirlo en contenido | 7 min | — |
| `s7_a7` | Más allá del sorteo: retos, concursos y gamificación | 9 min | — |

---

### s8 — Tráiler, destacado y primera impresión

> Lo primero que ve un visitante nuevo en tu canal.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s8_a1` | Diferencia entre tráiler del canal y vídeo destacado | 6 min | — |
| `s8_a2` | SEOTrailer: estructura de 60-90 segundos que convierte | 10 min | `tpl_trailer_canal` |
| `s8_a3` | SEOdestacado: qué vídeo poner para suscriptores existentes | 8 min | `tpl_video_destacado` |
| `s8_a4` | Cuándo actualizar tu tráiler | 6 min | — |
| `s8_a5` | Las secciones del canal: organizar tu escaparate | 8 min | — |
| `s8_a6` | Auditoría de primera impresión: el test de 5 segundos | 7 min | — |
| `s8_a7` | Estudio de caso: canales con páginas de inicio perfectas | 8 min | — |

---

### s9 — Guiones y estructura del vídeo

> El guion es el esqueleto de la retención. Domina la estructura CRECETUBE.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s9_a1` | ¿Hay que escribir guion? Sí, y este es el motivo | 7 min | — |
| `s9_a2` | La estructura CRECETUBE: SEOinicio → Desarrollo → PsicoCTA | 12 min | `tpl_guion_completo` |
| `s9_a3` | SEOshock: cómo crear un gancho que retenga en 3 segundos | 9 min | — |
| `s9_a4` | SEOloop: la promesa diferida que mantiene al espectador | 8 min | — |
| `s9_a5` | Roturas de patrón: qué son y dónde colocarlas | 9 min | — |
| `s9_a6` | SEOreset: el mini-resumen que reengancha | 7 min | — |
| `s9_a7` | SEOzoom: enfatizar conceptos clave visualmente | 7 min | — |
| `s9_a8` | SEOresultado: el desenlace que cumple la promesa | 8 min | — |
| `s9_a9` | PsicoCTA: la llamada a la acción psicológica | 9 min | — |
| `s9_a10` | Cliffhanger: enganchar al siguiente vídeo | 7 min | — |
| `s9_a11` | Checklist pre-publicación: no subas sin revisar esto | 8 min | `tpl_checklist_pre_publicacion` |

---

### s10 — Descripciones, hashtags y metadatos

> Lo que YouTube lee para entender y recomendar tu vídeo.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s10_a1` | SEOextracto: las 2 primeras líneas que lo cambian todo | 8 min | `tpl_descripcion_video` |
| `s10_a2` | Estructura de una descripción optimizada | 10 min | `tpl_descripcion_video` |
| `s10_a3` | Hashtags: la regla del 3 (amplio + medio + específico) | 7 min | — |
| `s10_a4` | Hashtag en título vs hashtag en descripción | 6 min | — |
| `s10_a5` | Timestamps / Capítulos: el primer "00:00" obligatorio | 8 min | — |
| `s10_a6` | Comentario fijado estratégico | 7 min | `tpl_comentario_fijado` |
| `s10_a7` | Etiquetas (tags): ¿sirven todavía? | 6 min | — |
| `s10_a8` | Categoría, idioma y localización | 5 min | — |
| `s10_a9` | Generando descripciones con IA: workflow práctico | 9 min | — |

---

### s11 — Listas de reproducción (SEOlista)

> Las listas son tu arma secreta de retención y sesión.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s11_a1` | Por qué las listas de reproducción importan más de lo que crees | 8 min | — |
| `s11_a2` | SEOlista: nombre optimizado con palabra clave | 9 min | `tpl_seolista` |
| `s11_a3` | Descripción de lista: los 200-300 caracteres que posicionan | 7 min | `tpl_seolista` |
| `s11_a4` | Orden de los vídeos: de introductorio a avanzado | 7 min | — |
| `s11_a5` | Listas como secciones del canal: organización visual | 6 min | — |
| `s11_a6` | Mantenimiento trimestral: rotar, añadir, eliminar | 7 min | — |
| `s11_a7` | Series oficiales vs listas manuales | 6 min | — |

---

### s12 — Shorts y contenido vertical

> El formato corto como puerta de entrada a tu canal largo.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s12_a1` | Shorts en la estrategia CRECETUBE: complemento, no sustituto | 8 min | — |
| `s12_a2` | Anatomía de un Short viral: gancho en 1 segundo | 9 min | — |
| `s12_a3` | De Short a vídeo largo: cómo derivar tráfico | 8 min | — |
| `s12_a4` | Métricas de Shorts: qué mirar y qué ignorar | 7 min | — |
| `s12_a5` | Reutilizar fragmentos de vídeos largos como Shorts | 8 min | — |
| `s12_a6` | Herramientas de edición vertical rápida | 7 min | — |
| `s12_a7` | Frecuencia de Shorts: ¿cuántos por semana? | 6 min | — |
| `s12_a8` | Shorts que convierten suscriptores vs Shorts vanidad | 8 min | — |

---

### s13 — Pantallas finales

> Los últimos 20 segundos son tu oportunidad de mantener al espectador en tu canal.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s13_a1` | Qué son las pantallas finales y por qué necesitas usarlas | 7 min | `tpl_pantallas_finales` |
| `s13_a2` | Configuraciones: unitaria, binaria, terciaria, cuaternaria | 9 min | `tpl_pantallas_finales` |
| `s13_a3` | Diseño visual: reservar espacio en el último frame | 7 min | — |
| `s13_a4` | Apoyar con audio: la frase que guía al clic | 6 min | — |
| `s13_a5` | Errores frecuentes: tapar contenido, no mencionarlas | 6 min | — |
| `s13_a6` | Analizar rendimiento: CTR de pantallas finales en Studio | 8 min | — |

---

### s14 — Tarjetas interactivas

> Derivan tráfico interno de forma estratégica.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s14_a1` | Tipos de tarjetas: Subjeta, Indujetas, Psicojetas, SEOjeta, SEOrescate | 10 min | `tpl_tarjetas` |
| `s14_a2` | Cuándo y dónde colocar cada tipo | 9 min | `tpl_tarjetas` |
| `s14_a3` | La regla de los 2 minutos de distancia | 6 min | — |
| `s14_a4` | Apoyar tarjetas con mención en audio | 6 min | — |
| `s14_a5` | Nunca en el primer minuto ni en los últimos 30 segundos | 5 min | — |
| `s14_a6` | Medir el rendimiento de tarjetas en Analytics | 8 min | — |
| `s14_a7` | Plan de tarjetas: rellenar la plantilla antes de subir | 7 min | `tpl_tarjetas` |

---

### s15 — Comunidad y engagement

> Construye una comunidad activa que impulse el algoritmo.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s15_a1` | La pestaña Comunidad: qué es y cómo activarla | 7 min | — |
| `s15_a2` | Giftcalipsis: GIFs + frases que provocan interacción | 8 min | `tpl_comunidad_giftcalipsis` |
| `s15_a3` | SEOencuesta: preguntas que validan ideas de vídeo | 9 min | `tpl_comunidad_seoencuesta` |
| `s15_a4` | SEOlaunch: anunciar un vídeo antes de publicar | 8 min | `tpl_comunidad_seolaunch` |
| `s15_a5` | SEOrepesca: rescatar un vídeo 48-72h después | 8 min | `tpl_comunidad_seorepesca` |
| `s15_a6` | Responder comentarios: las primeras 1-2 horas importan | 7 min | — |
| `s15_a7` | Corazones, fijados y respuestas en vídeo | 6 min | — |
| `s15_a8` | Gestión de trolls y comentarios negativos | 7 min | — |
| `s15_a9` | Calendario de posts de comunidad: frecuencia ideal | 8 min | — |

---

### s16 — Crossplatform y difusión

> Lleva tu contenido a donde está tu audiencia.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s16_a1` | La regla crossplatform: adaptar, no repostear | 8 min | — |
| `s16_a2` | Instagram para creadores de YouTube | 9 min | — |
| `s16_a3` | Twitter/X: cómo usar hilos para derivar tráfico | 8 min | — |
| `s16_a4` | TikTok: reutilizar Shorts con estrategia | 8 min | — |
| `s16_a5` | LinkedIn y nichos B2B: la oportunidad ignorada | 7 min | — |
| `s16_a6` | Pinterest y vídeos evergreen | 6 min | — |
| `s16_a7` | Telegram y Discord: canales privados para superfans | 8 min | — |
| `s16_a8` | Automatización con herramientas gratuitas | 7 min | — |

---

### s17 — Monetización y marca personal

> Convierte tu canal en un negocio sostenible.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s17_a1` | Las 7 vías de monetización en YouTube | 10 min | — |
| `s17_a2` | Programa de Partners: requisitos y cómo llegar | 9 min | — |
| `s17_a3` | RPM y CPM: las métricas que definen tus ingresos | 8 min | `tpl_panel_marca` |
| `s17_a4` | Patrocinios: cómo conseguir tu primera marca | 10 min | — |
| `s17_a5` | Productos digitales: cursos, ebooks, plantillas | 9 min | — |
| `s17_a6` | Afiliados: integrar recomendaciones sin perder credibilidad | 8 min | — |
| `s17_a7` | Super Chat, Membresías y Super Thanks | 7 min | — |
| `s17_a8` | YouTube Ads para creadores: promocionar tu propio contenido | 9 min | `tpl_campana_ads` |
| `s17_a9` | Construir tu marca personal fuera de YouTube | 10 min | — |
| `s17_a10` | Panel de marca: KPIs que debes revisar cada semana | 8 min | `tpl_panel_marca` |

---

### s18 — Email marketing para creadores

> Tu lista de email es el único activo que YouTube no controla.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s18_a1` | Por qué necesitas una lista de email (aunque tengas 500 subs) | 8 min | — |
| `s18_a2` | Lead magnets para creadores: qué ofrecer | 9 min | `tpl_email_lead_magnet` |
| `s18_a3` | Email de bienvenida: la primera impresión | 8 min | `tpl_email_bienvenida` |
| `s18_a4` | Email de nuevo vídeo: cuándo y cómo enviarlo | 8 min | `tpl_email_nuevo_video` |
| `s18_a5` | Sorteos por email: mecánica y legal | 7 min | `tpl_email_sorteo` |
| `s18_a6` | Secuencias automatizadas básicas | 9 min | — |
| `s18_a7` | Métricas de email: open rate, CTR y qué hacer con ellas | 8 min | — |
| `s18_a8` | Herramientas de email gratuitas y de pago | 7 min | — |

---

### s19 — Analítica y métricas

> Los datos te dicen qué funciona. Aprende a leerlos.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s19_a1` | YouTube Analytics: las 4 pestañas que importan | 10 min | — |
| `s19_a2` | CTR de impresiones: qué es y cómo mejorarlo | 9 min | — |
| `s19_a3` | Retención de audiencia: la gráfica más importante | 10 min | — |
| `s19_a4` | Velocidad de visualización: el KPI oculto | 8 min | — |
| `s19_a5` | Fuentes de tráfico: de dónde vienen tus vistas | 9 min | — |
| `s19_a6` | Audiencia: demografía y "viewers no suscritos" | 7 min | — |
| `s19_a7` | Análisis comparativo: vídeo actual vs anteriores | 8 min | — |
| `s19_a8` | Snapshots manuales: registrar métricas en la app | 8 min | — |
| `s19_a9` | Insights con IA: qué puede decirnos un LLM sobre nuestros datos | 9 min | — |
| `s19_a10` | Dashboard de métricas: cómo leer tu panel en CRECETUBE | 7 min | — |

---

### s20 — Mentalidad y crecimiento sostenible

> YouTube es un maratón. Prepara tu cabeza.

| ID | Asignatura | Duración est. | Plantilla relacionada |
|----|-----------|---------------|----------------------|
| `s20_a1` | La meseta de las 100 vistas: por qué es normal y cómo salir | 9 min | — |
| `s20_a2` | Síndrome del impostor en creadores | 8 min | — |
| `s20_a3` | Burnout: señales de alarma y prevención | 8 min | — |
| `s20_a4` | Compararse con otros: el veneno silencioso | 7 min | — |
| `s20_a5` | La regla de los 100 vídeos: consistencia mata talento | 8 min | — |
| `s20_a6` | Feedback negativo: cómo procesarlo sin paralizarte | 7 min | — |
| `s20_a7` | Delegar: cuándo y qué empezar a externalizar | 9 min | — |
| `s20_a8` | Tu plan a 12 meses: objetivos realistas y medibles | 10 min | — |

---

## 7.3 REFERENCIAS CRUZADAS WIZARD ↔ CURSO

Cada etapa del wizard de vídeo tiene secciones del curso recomendadas como apoyo contextual:

| Etapa wizard | Secciones del curso sugeridas |
|-------------|------------------------------|
| 1. Idea | s3 (temáticas), s4 (nichos) |
| 2. Investigación | s4 (nichos), s6 (títulos), s19 (analítica) |
| 3. Títulos | s6 (títulos) |
| 4. Miniatura | s5 (miniaturas) |
| 5. Guion | s9 (guiones) |
| 6. Grabación | s9 (guiones — notas de producción) |
| 7. Edición | s12 (shorts — reutilización), s9 (roturas de patrón) |
| 8. Publicación | s10 (descripciones), s11 (listas), s13 (pantallas), s14 (tarjetas) |
| 9. Sprint | s15 (comunidad), s16 (crossplatform), s18 (email) |
| 10. Evergreen | s3 (optimización evergreen), s19 (analítica), s17 (monetización) |

---

## 7.4 FORMATO DEL CONTENIDO DIDÁCTICO

Cuando se rellene el contenido de cada asignatura, seguirá este formato:

```typescript
{
  id: "s1_a1",
  titulo: "Crear tu cuenta de Google y canal de YouTube",
  duracionEstimadaMin: 8,
  contenido: "## Markdown con el texto de la clase...",  // vacío al inicio
  recursoExtra: "https://...",  // opcional
  videoReferencia: "https://youtube.com/...",  // opcional
  completadoPorDefecto: false
}
```

> **Regla**: si `contenido` está vacío o es `null`, la app muestra el placeholder amigable definido en `00_INDICE_MAESTRO.md` regla #1.

---

## 7.5 ESTADÍSTICAS DEL CURSO

- **Secciones**: 20
- **Asignaturas totales**: 169
- **Duración estimada total**: ~1.380 minutos (~23 horas)
- **Familias representadas**: 16 (todas las definidas en `06_DISENO_UI.md`)
- **Plantillas referenciadas**: 21 de 25
