# Estado de Sesión

Proyecto: CRECETUBE Assistant
Última sesión: 2026-06-12
Estado general: **22/25 tareas completadas** — TODO EN PRODUCCIÓN (crecetube.vercel.app): v1 + capa Romuald + curso 63/169 (oculta vacías) + tutorial OpenRouter + viabilidad + login-first multi-usuario (Google/email) + multi-canal Proyectos + recomendador de temas + sello Romu aprueba + onboarding adaptativo + cadena del método (bloqueo duro) + **modo demo** ("Probar la demo" en /acceso → cuenta efímera "Recetas en 15" precargada; purga a 7 días).

---

## Tarea actual
**T027 `en_progreso` — CRÍTICO: producción pierde las cuentas (2+ BDs Turso).** El usuario reporta que las cuentas no recuerdan su progreso. Evidencia recogida (detallada en TASKS.json T027): las env TURSO_* de Vercel apuntan a una BD VACÍA; el deploy activo escribe en OTRA BD; y qa.smoke@crecetube.test se pudo re-registrar (201) → las cuentas de la madrugada tampoco están en la BD activa. Los deploys congelan las env → cada redeploy puede cambiar de BD. SIGUIENTE PASO: el usuario debe abrir el dashboard de Turso (vía integración en Vercel) y listar sus BDs; luego fijar DB_URL/DB_AUTH_TOKEN explícitos a la BD canónica, redeploy y smoke. T024+T025 ya COMPLETADAS y desplegadas (commit 06c9827) + fix bfcache/no-store del botón atrás (5160cdb).
- T026 `pendiente`: borrador de onboarding en localStorage sin aislar por usuario (fix pequeño, descrito en TASKS.json).

## Tarea anterior
**T024 `en_progreso` — IA por campo ("Rellenar con IA" en todo campo de texto)**: la EXPLORACIÓN ESTÁ HECHA (explorer fable, plan completo en `progress/explorer-log.md`). Arquitectura decidida: generador genérico `rellenar_campo` + registro backend `campos.js` (espejo de requisitos.js; 13 campos huérfanos del wizard + 8 de viabilidad; reglas Romuald viajan desde consejos.ts en opciones.reglaCampo) + componente único `FieldIA.tsx` (botón Sparkles + pestañita con 3 estados: bloqueado-422-con-enlace / sugerencias Usar-Añadir / configura-IA); listas chip a chip sin machacar; timestamps deterministas sin IA; StepIdea reutiliza temas_canal con tarjetas "Usar esta". **PLAN EN 4 LOTES**: A backend (campos.js+prompts+ia.js) ∥ B frontend (FieldIA+camposIA.ts) con contrato congelado `{"sugerencias":[...]}`; luego C integración (~17 inserciones en 5-6 Step*.tsx) ∥ D = T025. Implementors en fable; reviewer opus al final de C+D.
- T025 `pendiente` (depende T024, es el lote D): pantalla de propuesta DENTRO de /viabilidad (GET null y no saltado → intro Empezar/Saltar) + redirect desde Onboarding.crear() si tieneCanalYa=false + Modal al crear canal en VideosList; campos de viabilidad con FieldIA. DECISIÓN tomada: la viabilidad sigue siendo singleton por usuario (per-canal = refinamiento futuro).
- T012 `en_progreso`: curso 63/169; quedan 106 (lista en `app/guia_maestra/contenido_fragmentos/_pendientes.md`); pipeline: `node scripts/extraer-transcripciones.mjs <ids>` → agente `redactor` → `scripts/fusionar-contenido-curso.mjs` → vigilar ortografía (G7 llegó sin tildes). Secciones enteras sin material: s2, s7, s8, s15, s16, s18. OJO rate limit de YouTube tras ~20 vídeos (esperar ~35 min).

## Últimas decisiones
- Modelos agentes: implementor=fable, reviewer=opus, explorer=sonnet (subir a fable con model-override en análisis de diseño pesados, hecho en T024), redactor=sonnet. El usuario quiere el razonamiento pesado en fable.
- Login-first en producción (RequireSesion): anónimos → /acceso; modo local solo sin auth configurada (PC).
- El onboarding sale UNA vez por cuenta (verificado en producción con la cuenta QA).
- Nota del explorer T024: dijo "no existe Playwright" — ES FALSO (e2e/ + playwright.config.ts existen, 8 casos); el reviewer de T024 debe correr la suite completa.

## Próximo paso
1. **Próximo hilo**: implementar T024 lotes A y B en paralelo (fable) → C → D(T025) → reviewer → deploy. Todo el diseño está en progress/explorer-log.md.
2. **Usuario**: crear su cuenta en crecetube.vercel.app/acceso + pegar su clave OpenRouter en Configuración (el agente NO introduce claves) → estrenar los 12 generadores. Más vídeos para T012 cuando pueda. Opcional: borrar usuario QA (qa.smoke@crecetube.test), "Publicar app" en Google Auth Platform (hoy en modo Prueba con su email como tester).

## Bloqueadores activos
Ninguno. Producción operativa (Turso + SESSION_SECRET + GOOGLE_CLIENT_ID en Vercel; client ID documentado en T016).

---

*Este archivo lo actualiza el agente al cerrar cada sesión con `/wrap`.*
*La siguiente sesión lee SOLO este archivo para ponerse al día, sin releer `progress/`.*
