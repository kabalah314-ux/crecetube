# 01 · VISIÓN Y ARQUITECTURA

## 1.1 Visión detallada

### 1.1.1 Pitch
**CRECETUBE Assistant** es una app de escritorio/web que convierte cualquier idea de vídeo de YouTube en un proyecto guiado. El usuario dice *\"quiero hacer un vídeo sobre X\"* y la app le acompaña por todas las decisiones críticas para que el resultado sea profesional y maximice CTR, retención, suscriptores y monetización.

### 1.1.2 Frase de marketing
> *\"No vuelvas a publicar un vídeo olvidándote de algo importante.\"*

### 1.1.3 Promesa concreta al usuario
Tras usar la app durante un mes, el usuario:
- Ha publicado al menos 4 vídeos siguiendo el método CRECETUBE.
- Sabe qué estrategias SEO le funcionan mejor en su nicho.
- Tiene un repositorio reutilizable de plantillas.
- Tiene un historial medible de sus métricas.

---

## 1.2 Personas usuarias (detalladas)

### 1.2.1 Persona principal — Marta, \"creadora en crecimiento\"
- 28 años, canal de cocina vegana, 3.400 suscriptores.
- Publica 2 vídeos al mes.
- Conoce miniaturas y títulos básicos pero no SEO avanzado.
- Pain: *\"Cada vez que voy a subir me da la sensación de que se me olvida algo.\"*
- Necesita: checklist clara + plantillas + sugerencias de títulos.

### 1.2.2 Persona secundaria — Diego, \"aspirante\"
- 19 años, quiere abrir canal de finanzas para jóvenes.
- 0 vídeos publicados.
- Pain: *\"No sé por dónde empezar.\"*
- Necesita: onboarding + curso accesible + wizard.

### 1.2.3 Persona terciaria — Iván, \"creador establecido\"
- 35 años, canal de tecnología, 47.000 suscriptores.
- Monetiza pero quiere subir su RPM.
- Pain: *\"Mis vídeos antiguos podrían rendir más.\"*
- Necesita: módulo de optimización evergreen + métricas comparativas + insights.

---

## 1.3 Stack técnico recomendado

### 1.3.1 Frontend — FIJADO (no elegir otro)
- **Framework**: **React 18 + Vite + TypeScript**.
- **Estado**: **Zustand**. NO Redux (overkill).
- **Routing**: **react-router-dom v6+**.
- **CSS**: CSS plano con los tokens de `06_DISENO_UI.md` (variables CSS + clases de componente propias). Sin Tailwind, sin MUI, sin Bootstrap.
- **Iconos**: **lucide-react**. NO emojis.
- **Animaciones**: transiciones CSS (06 §6.8); confetti propio en canvas. Sin Framer Motion en v1.
- **Gráficas**: **Recharts**.
- **Editor de texto** (guiones/descripciones): textarea estilizada en v1; TipTap queda como mejora de fase 2.

### 1.3.2 Backend — FIJADO
- **Lenguaje**: **Node 20 + Express**.
- **Base de datos**: **SQLite vía better-sqlite3, estilo documental**: tablas con columna `data` (JSON) + columnas extraídas para indexar (estado, fechas). **Razón**: los `VideoProject` tienen forma flexible y anidada, y SQLite no exige instalar nada.
- **Almacenamiento de imágenes** (miniaturas subidas): sistema de ficheros local en v1 (`app/backend/data/uploads/`).
- **Autenticación**: ninguna en v1. La identidad implícita es \"el dispositivo del usuario\".
- **Validación**: funciones propias por entidad (ligero); Zod opcional si crece.

### 1.3.3 IA
- Cliente HTTP estándar (fetch) contra **OpenRouter** (API compatible OpenAI). Modelo por defecto: **`openrouter/free`** (router automático de modelos gratuitos; ver `04_MODULO_IA.md` §4.2).
- Configurable en `/configuracion` por el usuario (la config viva está en `UserProfile.iaConfig`; el `.env` solo aporta defaults iniciales).
- Variables de entorno: `LLM_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`, `LLM_BASE_URL`.

### 1.3.4 Entorno de ejecución
- **Web**: build estático + servidor backend separado.
- **Alternativa Desktop**: Tauri o Electron empaquetando el bundle anterior.

### 1.3.5 Lo que NO se debe usar
- Plantillas/starters genéricos tipo \"AI SaaS template\" con landing morada.
- Fuentes: Inter, Roboto, Arial, sistema.
- Gradientes morado/violeta sobre blanco.
- Iconografía emoji como elementos decorativos.

---

## 1.4 Arquitectura de carpetas (sugerida)

> Nota: en este repo la app vive bajo `app/` (`app/frontend`, `app/backend`) y la guía en `app/guia_maestra/`; la raíz tiene un `package.json` con workspaces. Estructura interna de cada workspace:

```
app/
├── frontend/
│   ├── src/
│   │   ├── routes/                 # vistas top-level
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── VideosList.tsx
│   │   │   ├── VideoDetail.tsx
│   │   │   ├── VideoWizard.tsx
│   │   │   ├── CourseIndex.tsx
│   │   │   ├── CourseSection.tsx
│   │   │   ├── CourseLesson.tsx
│   │   │   ├── TemplatesLibrary.tsx
│   │   │   ├── Metrics.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── wizard/
│   │   │   │   ├── StepIdea.tsx
│   │   │   │   ├── StepResearch.tsx
│   │   │   │   ├── StepTitle.tsx
│   │   │   │   ├── StepThumbnail.tsx
│   │   │   │   ├── StepScript.tsx
│   │   │   │   ├── StepRecording.tsx
│   │   │   │   ├── StepEditing.tsx
│   │   │   │   ├── StepPublish.tsx
│   │   │   │   ├── StepSprint.tsx
│   │   │   │   └── StepEvergreen.tsx
│   │   │   ├── checklist/
│   │   │   ├── ai/                 # botones y paneles de IA
│   │   │   ├── ui/                 # botones, inputs, modals base
│   │   │   └── shared/
│   │   ├── data/
│   │   │   ├── courseStructure.ts  # las 20 secciones
│   │   │   ├── strategies.ts       # familias de estrategias con colores
│   │   │   └── templates.ts        # 23 plantillas precargadas
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── ai.ts
│   │   │   ├── storage.ts
│   │   │   └── exportImport.ts
│   │   ├── store/                  # estado global
│   │   ├── styles/                 # tokens, temas
│   │   └── i18n/
│   │       └── es.ts
│   └── tests/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   │   └── llm/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   └── utils/
│   └── tests/
└── guia_maestra/
    ├── (este kit, 00-09)
    ├── 07_curso_seed.json      ← seeds: el backend los lee de AQUÍ
    └── 05_plantillas_seed.json
```

---

## 1.5 Rutas de la aplicación (mapa completo)

| Ruta | Vista | Propósito | Datos cargados |
|------|-------|-----------|----------------|
| `/` | Redirect | A `/onboarding` si no hay perfil, si no a `/dashboard` | `UserProfile` |
| `/onboarding` | `Onboarding` | Cuestionario inicial | — |
| `/dashboard` | `Dashboard` | Resumen general | Resumen de proyectos + progreso + KPIs |
| `/videos` | `VideosList` | Listado de proyectos | `VideoProject[]` |
| `/videos/nuevo` | `VideoWizard` | Crear vídeo (wizard 10 etapas) | nuevo `VideoProject` borrador |
| `/videos/:id` | `VideoDetail` | Vista de detalle/edición | `VideoProject` |
| `/videos/:id/wizard/:stepId` | `VideoWizard` | Reanudar wizard en etapa | `VideoProject` |
| `/curso` | `CourseIndex` | Las 20 secciones | `courseStructure` + `CourseProgress` |
| `/curso/:seccionId` | `CourseSection` | Asignaturas de una sección | sección + progreso |
| `/curso/:seccionId/:asignaturaId` | `CourseLesson` | Clase concreta | asignatura |
| `/plantillas` | `TemplatesLibrary` | Biblioteca de plantillas | `Template[]` |
| `/plantillas/:id` | `TemplateDetail` | Ver/editar plantilla | `Template` |
| `/metricas` | `Metrics` | Panel de KPIs | `MetricSnapshot[]` agregados |
| `/configuracion` | `Settings` | Perfil + IA + tema + export/import | `UserProfile` + config IA |

---

## 1.6 Estados de un proyecto de vídeo

Transiciones permitidas (máquina de estados):

```
   ┌───────────┐
   │   IDEA    │  (estado inicial al crear)
   └─────┬─────┘
         │
         ▼
   ┌───────────────┐
   │ INVESTIGACION │
   └─────┬─────────┘
         ▼
   ┌──────────┐
   │  GUION   │
   └─────┬────┘
         ▼
   ┌────────────┐
   │ GRABACION  │
   └─────┬──────┘
         ▼
   ┌──────────┐
   │ EDICION  │
   └─────┬────┘
         ▼
   ┌────────────┐
   │ PUBLICADO  │  (fecha de publicación se registra aquí)
   └─────┬──────┘
         ▼
   ┌─────────────────┐
   │  OPTIMIZACION   │  (automático 30 días tras publicación)
   └─────┬───────────┘
         ▼
   ┌────────────┐
   │ ARCHIVADO  │  (opcional, manual)
   └────────────┘
```

**Reglas**:
- El usuario puede saltar etapas hacia adelante (ej. crear directo en estado \"publicado\").
- El usuario puede volver atrás manualmente.
- Cada estado tiene un color asociado (ver `06_DISENO_UI.md`).

---

## 1.7 Decisiones técnicas clave (con justificación)

| Decisión | Elección | Por qué |
|----------|----------|---------|
| Sin login | Aceptado | El usuario lo pidió. Identidad = dispositivo. Mitigado con export/import JSON. |
| BD documental | SQLite-JSON (better-sqlite3) | `VideoProject` tiene esquema flexible y anidado profundo; SQLite no exige instalación. |
| Cliente LLM agnóstico | Sí (OpenRouter) | Permite al usuario cambiar de modelo sin tocar código. |
| Wizard como ruta separada | Sí | Permite enlace permanente y reanudación. |
| Autoguardado debounced | 800ms | Equilibrio entre seguridad de datos y carga de red. |
| Sin login multiusuario | Sí | v1 deliberadamente simple. |
| Mobile-responsive pero desktop-first | Sí | Creadores trabajan en ordenador. Móvil = consulta. |

---

## 1.8 Variables de entorno

Un único `.env` en la raíz del repo:

```
# Backend
PORT=8001
DB_PATH=app/backend/data/crecetube.db
LLM_API_KEY=
LLM_PROVIDER=openrouter
LLM_MODEL=openrouter/free
LLM_BASE_URL=https://openrouter.ai/api/v1

# Frontend (Vite solo expone las VITE_*)
VITE_BACKEND_URL=http://localhost:8001
```

En desarrollo el frontend usa proxy de Vite (`/api` → `:8001`), así que `VITE_BACKEND_URL` puede quedar vacío.

---

## 1.9 Resumen de no-funcionales

- **Performance**: respuesta < 200ms en navegación local. < 3s en generación IA.
- **Persistencia**: autosave debounced 800ms.
- **Accesibilidad**: contraste AA, navegación teclado, ARIA.
- **i18n**: estructura preparada, único idioma en v1 (es).
- **Privacidad**: datos solo locales en v1. Nada se sube a servicios externos sin acción explícita del usuario.
- **Resilencia**: si la BD cae, modo solo-lectura con caché en memoria.
