# Reviewer Log — T015: Mini-tutorial visual de OpenRouter

Fecha: 2026-06-11

## Veredicto

APROBADO — sin arreglos necesarios. La implementación pasó todas las verificaciones a la primera.

## Verificaciones ejecutadas

| Verificación | Comando | Resultado |
|---|---|---|
| Typecheck frontend | `npm run typecheck --workspace app/frontend` (tsc --noEmit) | ✓ 0 errores |
| Build frontend | `npm run build --workspace app/frontend` (vite build) | ✓ built in 19.56s |
| Tests backend (humo) | `npm test --workspace app/backend` | ✓ 42/42 pass |
| Suite E2E | `npm run test:e2e` (playwright, puertos 8002/5174, BD temporal) | ✓ 7/7 pass en 35.3s |

Detalle E2E:
- ok 01-onboarding — 9 pasos hasta el dashboard (modificado, cierra el tutorial condicionalmente)
- ok 02-wizard — creación perezosa + autosave/persistencia título
- ok 02-wizard — ítem manual del checklist persiste tras recarga
- ok 03-romuald — TipBanner descartar/reabrir
- ok 03-romuald — ContextPanel consejo + glosario 9 dt
- ok 03-romuald — grabacion 8 checkboxes
- ok 03-romuald — sprint 11 checkboxes

El build emite 2 advertencias (chunk dinámico/estático de `config.ts` y chunk > 500 kB). Ambas son PREEXISTENTES y ajenas a T015 (no las introdujo este cambio); no son errores.

## Revisión de coherencia con patrones del repo

- **Modal**: `OpenRouterTutorial` reutiliza `components/ui/Modal` con `wide` + `actions`. Soporte Escape (efecto en Modal) y clic en overlay; ambos disparan `onClose` → `closeTutorial`. Correcto.
- **Tokens CSS**: `.tutorial-step`, `.tutorial-step-num`, `.tutorial-step-body strong/p` en `components.css` (líneas ~236-266) usan `var(--space-*)`, `var(--accent-primary)`, `var(--text-*)`. Sin colores hardcodeados.
- **i18n**: bloque `tutorial.openrouter` en `es.ts` (líneas 128-144) con título, bajada, 3 pasos, 2 CTAs y link. Sin literales en JSX.
- **localStorage (patrón TipBanner)**: clave `ct.tutorial.openrouter`, valor `"1"`. Escrita en `closeTutorial` (Dashboard.tsx línea 35) antes de cerrar — consistente para X, Escape y overlay.
- **data-testid solicitados**: presentes y correctos — `openrouter-tutorial` (contenedor, línea 64), `openrouter-tutorial-close` (botón ghost, línea 47), `openrouter-tutorial-cta` (botón primario, línea 53).
- **CTA**: `handleCta` llama `onClose()` y luego `navigate("/configuracion")`. Navega a la ruta correcta y el cierre persiste en localStorage. Correcto.

## Condición de visibilidad (verificada por inspección)

`Dashboard.tsx` líneas 27-32:
```ts
useEffect(() => {
  if (!profile) return;
  if (profile.iaConfig.apiKey === "" && localStorage.getItem(TUTORIAL_KEY) !== "1") {
    setShowTutorial(true);
  }
}, [profile]);
```
- El `if (!profile) return` y la dependencia `[profile]` garantizan que la condición se evalúa SOLO cuando el perfil ya está cargado. No hay parpadeo para usuarios con clave: si `apiKey === "***"` el modal nunca se activa.
- `showTutorial` arranca en `false`, así que entre el primer render y la carga del perfil el modal permanece oculto. Correcto por diseño.

## Interferencia en otros specs

- Specs 02 y 03 navegan al wizard, no al dashboard de primera carga; no se ven afectados por el modal. Confirmado: ambos pasan sin tocar el tutorial.
- Spec 01 (que sí aterriza en `/dashboard`) descarta el tutorial con una comprobación condicional `isVisible()` antes de la aserción del heading. Robusto: no rompe si en otro contexto ya hubiera clave.

## Patrones recurrentes / candidatos a improvements

Ninguno. No hubo fallos ni correcciones, por tanto no hay patrón de error que registrar.

## RESULTADO: APROBADO
