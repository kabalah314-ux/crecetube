# KIT DE CONSTRUCCIÓN — CRECETUBE ASSISTANT

> **Para la IA constructora**: Este kit contiene todo lo que necesitas para construir la app sin pedir aclaraciones al humano. Lee los archivos en el orden indicado. Cada archivo es autosuficiente pero referenciable cruzado.
>
> **Para el humano**: Cada archivo puede iterarse por separado con Claude Code. El contenido didáctico de las clases del curso se rellenará después usando los IDs (`s1_a1`, etc.) definidos en `07_ESQUELETO_CURSO.md`.

---

## ÍNDICE DEL KIT

| # | Archivo | Contenido | Cuándo leerlo |
|---|---------|-----------|---------------|
| 00 | `00_INDICE_MAESTRO.md` | Este archivo. Mapa general. | Primero |
| 01 | `01_VISION_Y_ARQUITECTURA.md` | Visión del producto, personas, stack, rutas, estructura del proyecto | Antes de empezar a codear |
| 02 | `02_FLUJOS_Y_UX.md` | Onboarding + Wizard de 10 etapas (especificación exhaustiva con wireframes) | Antes de diseñar el frontend |
| 03 | `03_MODELOS_DE_DATOS.md` | Esquemas concretos con tipos, validaciones, ejemplos JSON, API endpoints | Antes de diseñar el backend |
| 04 | `04_MODULO_IA.md` | Prompts literales para cada generador, manejo de errores, fallbacks | Al implementar la IA |
| 05 | `05_PLANTILLAS.md` | Contenido completo de las 25 plantillas con variables | Al cargar la biblioteca de plantillas |
| 06 | `06_DISENO_UI.md` | Sistema de diseño: colores, tipografías, componentes, microinteracciones | En paralelo al frontend |
| 07 | `07_ESQUELETO_CURSO.md` | Las 20 secciones con sus asignaturas e IDs (+ `07_curso_seed.json`) | Para renderizar el curso |
| 08 | `08_ROADMAP_Y_TESTS.md` | Orden de implementación + criterios de aceptación + tests | Para planificar sprints |
| 09 | `09_PROMPTS_CLAUDE_CODE.md` | Prompts listos para Claude Code por sprint (extra, opcional) | Al delegar trabajo en Claude Code |

Archivos auxiliares:
- `07_curso_seed.json` — Datos del curso (20 secciones, 169 asignaturas) listos para importar en BD.
- `05_plantillas_seed.json` — Las 25 plantillas en formato JSON listo para seed.
- Ambos se regeneran con `node scripts/build_seeds.mjs` si se editan los markdown fuente.

---

## RESUMEN EJECUTIVO EN 60 SEGUNDOS

**Producto**: App interactiva en español que transforma una idea de vídeo de YouTube en un proyecto guiado paso a paso, asegurando que el creador aplica todas las buenas prácticas del método CRECETUBE (miniaturas, títulos, SEO, retención, comunidad, monetización…).

**Núcleo funcional**: Un wizard de **10 etapas** (idea → investigación → título → miniatura → guion → grabación → edición → publicación → fase sprint → optimización evergreen) que combina:
- Checklists con autoguardado.
- Generadores con IA contextual.
- Referencias cruzadas al curso embebido (20 secciones, ~170 asignaturas).
- Plantillas descargables (23 archivos precargados).
- Métricas personales con insights.

**Stack**: FIJADO (ver `08_ROADMAP_Y_TESTS.md` §8.1): React 18 + Vite + TypeScript · Express · SQLite estilo documental (better-sqlite3) · IA vía OpenRouter con modelo gratuito por defecto (`openrouter/free`).

**No incluye**: login, integración API YouTube, edición de vídeo, multiusuario.

**Idioma**: Español. **Tono**: cercano, didáctico. **Estética**: con carácter (NO morados-violetas genéricos, NO fuente Inter).

---

## REGLAS DE ORO (LEER ANTES DE PROGRAMAR)

1. **El contenido didáctico está vacío al principio.** La app debe renderizar correctamente todas las pantallas aunque las asignaturas no tengan contenido. Mostrar placeholder amigable: *\"Esta clase aún no tiene contenido cargado. Volveremos pronto.\"*
2. **Los IDs son inmutables** (`s1`, `s1_a1`, `s5_a4`…). El usuario los usa como referencia externa.
3. **Autoguardado en TODO**. Pérdida de datos = pérdida de confianza.
4. **Idempotencia**: el wizard se puede pausar y reanudar en cualquier momento, en cualquier dispositivo (con exportar/importar JSON).
5. **IA opcional**: la app funciona al 100% sin IA. Si hay clave, aparecen botones \"Generar\". Si no, muestran tooltip explicativo.
6. **Todos los elementos interactivos** llevan `data-testid` con naming kebab-case descriptivo.
7. **Sin emojis dentro del producto** salvo en estados de éxito puntuales. Iconos por librería (Lucide, FontAwesome, Heroicons).
8. **Mobile responsivo** pero pensado desktop-first (el creador trabaja en ordenador).
9. **Modo oscuro por defecto**. Tema claro disponible.
10. **i18n preparado** aunque solo entregue español de inicio.

---

## FLUJO DE LECTURA RECOMENDADO PARA LA IA CONSTRUCTORA

```
00 (este) → 01 visión → 07 curso (para entender el dominio)
   → 03 datos → 02 flujos UX → 06 diseño
   → 04 IA → 05 plantillas → 08 roadmap → 09 prompts
```

Tiempo estimado de lectura completa del kit: 25–35 minutos.

---

## CRITERIO DE \"LISTO PARA ENTREGAR\"

Cuando se cumplan **todos** los puntos de la checklist final de `08_ROADMAP_Y_TESTS.md`, el producto está listo para el usuario.
