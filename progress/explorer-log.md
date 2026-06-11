# Explorer Log — T015: Mini-tutorial visual de OpenRouter en onboarding/primera visita

## Tarea
T015 — Mini-tutorial visual de OpenRouter que aparece tras completar el onboarding (o en /dashboard si no hay clave IA configurada), saltable/descartable.

---

## 1. Flujo del onboarding: cómo termina y cómo sabe la app que está completo

- **Componente:** `app/frontend/src/routes/Onboarding.tsx`
- **Pasos:** 0–8 (9 pasos). El último paso (paso 8) es el resumen. Al pulsar "Crear mi espacio" se llama a `crear()` (línea 122).
- **Finalización:** `crear()` llama a `useStore.createProfile(...)`, borra `localStorage.getItem("crecetube.onboarding.draft")` y ejecuta `navigate("/dashboard")` (línea 136).
- **La app sabe que el onboarding está completo** porque `useStore.profileStatus` pasa a `"ready"` (la API devuelve un perfil). En `App.tsx`, la guardia `RequireProfile` redirige a `/onboarding` cuando `profileStatus === "missing"`. Cuando es `"ready"`, el usuario ya accede a las rutas protegidas.
- **No existe ningún flag extra** de "onboarding completado": la mera existencia del perfil equivale a "completado".
- **Punto de entrada del tutorial:** inmediatamente después de `navigate("/dashboard")` desde `Onboarding.tsx`, el usuario llega a `Dashboard.tsx`. El tutorial debe aparecer aquí.

---

## 2. Dashboard: estructura y dónde encaja el tutorial

- **Componente:** `app/frontend/src/routes/Dashboard.tsx`
- **Layout:** devuelve `<div className="page">` con:
  1. `.page-head` (saludo + botón Nuevo vídeo) — líneas 34–46
  2. Grid de 3 KPI cards — líneas 47–60
  3. Sección "Continuar donde lo dejaste" (condicional si hay vídeos en marcha) — líneas 62–95
  4. Bloque EmptyState si `videos.length === 0` — líneas 97–107
  5. Grid 2 cards (El curso / Plantillas) — líneas 109–133
- **Mejor posición para el tutorial:** el modal se monta al final del componente (antes del cierre de `<div className="page">`) — no hay posición DOM relevante porque es un overlay. El estado de visibilidad se controla con `useState` en Dashboard.
- **Alternativa modal preferida:** usar el componente `Modal` existente (`app/frontend/src/components/ui/Modal.tsx`) activado automáticamente al montar el Dashboard. El modal tiene soporte para Escape y clic en overlay para cerrar.

---

## 3. Estado de la clave IA: cómo la lee/guarda la app

- **Tipo en `UserProfile`** (`app/frontend/src/types.ts`, líneas 19–26):
  - `iaConfig.apiKey: string` — devuelve `"***"` si hay clave guardada, `""` si no.
- **La clave nunca se expone en claro** desde el backend. Confirmado en `Settings.tsx` línea 38: `const claveGuardada = profile.iaConfig.apiKey === "***"`.
- **Condición de visibilidad del tutorial:** `profile.iaConfig.apiKey === ""`. Esta condición ya la usa Settings. NO hay llamada extra a la API: el dato está en el store desde `loadProfile()`.
- **Endpoint de test de conexión:** `POST /api/ia/test-conexion` con body `{ iaConfig: { apiKey, modelo } }`. Devuelve `{ ok, modelo, latenciaMs }`. Referenciado en `Onboarding.tsx` línea 113 y `Settings.tsx` línea 95.
- **Navegación a Configuración:** ruta `/configuracion` (`App.tsx` línea 70, `es.nav.configuracion`).

---

## 4. Patrones existentes reutilizables

### TipBanner (patrón localStorage descartable)
- **Archivo:** `app/frontend/src/wizard/TipBanner.tsx`
- **Patrón localStorage:** `localStorage.setItem("ct.tipbanner.<slug>", "1")` para descartar. El implementor debe replicar esta lógica con clave `"ct.tutorial.openrouter"`.
- TipBanner en sí NO es reutilizable directamente (está ligado a `StepId` y `CONSEJOS`). Crear componente nuevo.

### Modal
- **Archivo:** `app/frontend/src/components/ui/Modal.tsx`
- Props: `open`, `onClose`, `title`, `children`, `actions`, `wide?`. Soporte Escape nativo. Animación CSS `modal-in`. CSS en `components.css` líneas 181–233.
- `wide={true}` da `max-width: 700px` — adecuado para el tutorial con pasos.

### Cards, botones, chips
- `.card` — `components.css` línea 149.
- `.btn .btn-primary`, `.btn .btn-secondary`, `.btn .btn-ghost`, `.btn-sm`.
- `.tag`, `.progress-thin`, `.field-hint`.

### Iconos lucide ya en uso en el proyecto
- `ArrowRight`, `Check`, `X`, `Zap`, `Key`, `ExternalLink` (si no está importado, está disponible en `lucide-react`).

### Strings i18n
- **Archivo:** `app/frontend/src/i18n/es.ts`. Añadir bloque `tutorial` al objeto `es`. Nunca hardcodear strings en JSX.
- El texto existente `es.onboarding.iaDesc` (línea 61) ya menciona OpenRouter y la capa free — referencia de tono.
- `es.settings.iaLimites` menciona "Tier gratuito: ~20 peticiones/minuto y ~200/día" — puede citarse en el tutorial.

### Variables CSS de diseño (tokens.css)
- Colores: `var(--accent-primary)` rojo, `var(--accent-gold)` dorado, `var(--accent-mint)` verde éxito.
- Fondos: `var(--bg-elevated)`, `var(--bg-overlay)`.
- Espaciados: `--space-1` a `--space-8`.
- Tipografía: `--text-xs` (12px), `--text-sm` (14px), `--text-base` (16px), `--text-xl` (22px).

---

## 5. Tests existentes que podrían verse afectados

- **`e2e/01-onboarding.spec.ts` (línea 61):** verifica `getByRole("heading", { name: /Canal de Pruebas E2E/ })` tras aterrizar en `/dashboard`. Si el tutorial aparece como modal, el heading sigue en el DOM (el modal no lo oculta). RIESGO BAJO pero hay que confirmarlo.
  - **Mitigación:** el e2e salta el paso IA (`onboarding-ai-skip`) → el perfil se crea sin clave → el tutorial aparecería. Si el modal tiene `aria-modal="true"`, algunos navegadores pueden interferir con `getByRole`. Añadir `data-testid="openrouter-tutorial-close"` al botón de cierre permite que futuros tests lo descarten con un `.click()` antes de hacer otras aserciones.
- **`e2e/02-wizard.spec.ts`** y **`e2e/03-romuald.spec.ts`**: no inician desde `/dashboard` de primera carga. Sin riesgo.

---

## 6. Archivos a crear/modificar

| Archivo | Acción | Motivo |
|---|---|---|
| `app/frontend/src/wizard/OpenRouterTutorial.tsx` | CREAR | Componente del mini-tutorial |
| `app/frontend/src/routes/Dashboard.tsx` | MODIFICAR | Montar `<OpenRouterTutorial>` y gestionar estado de visibilidad |
| `app/frontend/src/i18n/es.ts` | MODIFICAR | Añadir strings bajo `es.tutorial` |
| `app/frontend/src/styles/components.css` | MODIFICAR (mínimo) | Añadir clase `.tutorial-step` para los pasos numerados (opcional si basta con clases existentes) |

---

## 7. Convenciones a respetar

- Exports nombrados: `export function OpenRouterTutorial(...)` — sin default export.
- Strings siempre en `es.ts`, nunca literales en JSX.
- localStorage: prefijo `ct.` — clave `"ct.tutorial.openrouter"`.
- `data-testid`: kebab-case (`"openrouter-tutorial"`, `"openrouter-tutorial-close"`, `"openrouter-tutorial-cta"`).
- Imports de lucide: solo los usados, desestructurados.
- CSS: clases en kebab-case, variables de tokens, sin valores hardcodeados de color.
- TypeScript estricto: sin `any`; si el componente recibe props tipadas, declararlas inline con `interface`.

---

## 8. Riesgos

1. **`profile` puede ser null:** `RequireProfile` garantiza que el perfil está cargado antes de mostrar el Dashboard, pero usar `profile?.iaConfig.apiKey` defensivamente por si acaso.
2. **Modal con `aria-modal` y e2e:** el test 01 busca el heading por rol tras navegar al dashboard. Si el modal intercepta el foco (`aria-modal="true"`), `getByRole("heading")` podría no encontrarlo en Playwright. Incluir `data-testid` en el heading (ya no tiene testid) o asegurarse de que el modal no bloquea el árbol de accesibilidad fuera de sí mismo. Alternativa segura: usar `inert` en el fondo solo visualmente, no con `aria-modal`.
3. **Tutorial innecesario si ya hay clave:** si el usuario rellenó la clave en el paso 7 del onboarding, `profile.iaConfig.apiKey === "***"` y el tutorial NO debe aparecer. La condición es correcta por diseño.
4. **Doble aparición:** si el usuario recarga el dashboard sin haber descartado el tutorial (localStorage vacío), reaparecerá. Es el comportamiento correcto; solo se suprime con `"ct.tutorial.openrouter" === "1"`.

---

## 9. Recomendación: plan de implementación en pasos concretos

**Paso 1 — `es.ts`:** añadir bajo `es`:
```
tutorial: {
  openrouter: {
    titulo: "Activa la IA gratuita en 2 minutos",
    bajada: "OpenRouter da acceso a modelos potentes (Llama, Gemini, GPT-4o…) con un tier gratuito de ~200 peticiones/día.",
    paso1Titulo: "Crea tu cuenta gratis",
    paso1Desc: "Ve a openrouter.ai y regístrate (es gratis, no pide tarjeta).",
    paso2Titulo: "Genera una API key",
    paso2Desc: 'En el menú lateral → "Keys" → "Create key". Cópiala.',
    paso3Titulo: "Pégala en Configuración",
    paso3Desc: 'Ve a Configuración → sección "Inteligencia artificial" → campo API key → guarda.',
    ctaIrConfiguracion: "Ir a Configuración ahora",
    ctaSaltar: "Lo haré después",
    linkOpenRouter: "Abrir openrouter.ai",
  }
}
```

**Paso 2 — `OpenRouterTutorial.tsx`:**
- Recibe `open: boolean` y `onClose: () => void`.
- Usa `<Modal open={open} onClose={onClose} title={es.tutorial.openrouter.titulo} wide>`.
- Interior: párrafo de bajada, 3 pasos numerados (divs con número + título + descripción), link externo a `https://openrouter.ai/keys`, dos botones en `actions`: primario "Ir a Configuración" (`navigate("/configuracion")` + `onClose()`) y ghost "Lo haré después" (`onClose()`).
- `data-testid="openrouter-tutorial"` en el contenedor, `data-testid="openrouter-tutorial-close"` en el botón ghost, `data-testid="openrouter-tutorial-cta"` en el botón primario.

**Paso 3 — `Dashboard.tsx`:**
- Añadir `import { OpenRouterTutorial } from "../wizard/OpenRouterTutorial"`.
- Añadir estado: `const [showTutorial, setShowTutorial] = useState(false)`.
- Añadir `useEffect` que se ejecuta cuando `profile` esté disponible:
  ```ts
  useEffect(() => {
    if (!profile) return;
    if (profile.iaConfig.apiKey === "" && localStorage.getItem("ct.tutorial.openrouter") !== "1") {
      setShowTutorial(true);
    }
  }, [profile]);
  ```
- Función `closeTutorial`: `localStorage.setItem("ct.tutorial.openrouter", "1"); setShowTutorial(false)`.
- Montar `<OpenRouterTutorial open={showTutorial} onClose={closeTutorial} />` antes del cierre de `</div>`.

**Paso 4 — CSS (mínimo):** añadir en `components.css` si se quieren pasos numerados con círculo:
```css
.tutorial-step { display: flex; gap: var(--space-3); align-items: flex-start; margin-bottom: var(--space-4); }
.tutorial-step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--accent-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: var(--weight-medium); font-size: var(--text-sm); flex-shrink: 0; }
.tutorial-step-body strong { display: block; margin-bottom: var(--space-1); }
.tutorial-step-body p { color: var(--text-secondary); font-size: var(--text-sm); margin: 0; }
```
