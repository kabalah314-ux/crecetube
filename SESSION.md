# Estado de Sesión

Proyecto: CRECETUBE Assistant
Última sesión: 2026-06-12
Estado general: **26/27 tareas completadas** — TODO EN PRODUCCIÓN (crecetube.vercel.app): v1 + capa Romuald + curso 63/169 (oculta vacías) + tutorial OpenRouter + viabilidad + login-first multi-usuario (Google/email) + multi-canal Proyectos + recomendador de temas + sello Romu aprueba + onboarding adaptativo + cadena del método (bloqueo duro) + **modo demo** ("Probar la demo" en /acceso → cuenta efímera "Recetas en 15" precargada; purga a 7 días).

---

## Tarea actual
**T027 ✅ RESUELTA — cada deploy estrenaba BD (cuentas amnésicas).** Causa raíz: la integración Vercel+Turso crea una RAMA de BD por deployment (host `dpl-*`); cada release arrancaba vacía. Fix: `DB_URL`+`DB_AUTH_TOKEN` explícitos en Vercel producción → BD canónica `database-champagne-arrow...turso.io` (config.js los prefiere sobre TURSO_*). Verificado con doble deploy (cuenta sobrevive; /api/health expone dbHost). OJO FUTURO: si la API diera 500 con error de auth de BD, el token estático pudo rotar → `vercel env pull` y refrescar DB_AUTH_TOKEN; el branching por deploy ya está DESACTIVADO en la integración (hecho vía API; /api/health muestra dbHost y tursoHost ambos canónicos). Cuenta de prueba `prueba.persistencia@crecetube.test` en la BD canónica (borrable). T026 ✅ (borrador onboarding por usuario). T024+T025 ✅ desplegadas + fix botón atrás (bfcache/no-store).

## Tarea anterior
**T024+T025 ✅ COMPLETADAS y EN PRODUCCIÓN** (commit 06c9827): 16 campos con botón ✨ Rellenar con IA (FieldIA + generador rellenar_campo + bloqueos por requisito), Sugerir ideas, Derivar capítulos sin IA, y viabilidad como paso inicial (propuesta tras onboarding sin canal + modal al crear canal). Reviewer opus APROBADO: 125 tests backend, 8/8 e2e, tsc 0.
- T012 `en_progreso`: curso 63/169; quedan 106 (lista en `app/guia_maestra/contenido_fragmentos/_pendientes.md`); pipeline: `node scripts/extraer-transcripciones.mjs <ids>` → agente `redactor` → `scripts/fusionar-contenido-curso.mjs` → vigilar ortografía (G7 llegó sin tildes). Secciones enteras sin material: s2, s7, s8, s15, s16, s18. OJO rate limit de YouTube tras ~20 vídeos (esperar ~35 min).

## Últimas decisiones
- Modelos agentes: implementor=fable, reviewer=opus, explorer=sonnet (subir a fable con model-override en análisis de diseño pesados, hecho en T024), redactor=sonnet. El usuario quiere el razonamiento pesado en fable.
- Login-first en producción (RequireSesion): anónimos → /acceso; modo local solo sin auth configurada (PC).
- El onboarding sale UNA vez por cuenta (verificado en producción con la cuenta QA).
- Nota del explorer T024: dijo "no existe Playwright" — ES FALSO (e2e/ + playwright.config.ts existen, 8 casos); el reviewer de T024 debe correr la suite completa.

## Próximo paso
1. **Próximo hilo**: solo queda T012 (106 clases del curso pendientes; hacen falta más vídeos del usuario). El resto del backlog está completado.
2. **Usuario**: crear su cuenta en crecetube.vercel.app/acceso + pegar su clave OpenRouter en Configuración (el agente NO introduce claves) → estrenar los 12 generadores. Más vídeos para T012 cuando pueda. Opcional: borrar usuario QA (qa.smoke@crecetube.test), "Publicar app" en Google Auth Platform (hoy en modo Prueba con su email como tester).

## Bloqueadores activos
Ninguno. Producción operativa (Turso + SESSION_SECRET + GOOGLE_CLIENT_ID en Vercel; client ID documentado en T016).

---

*Este archivo lo actualiza el agente al cerrar cada sesión con `/wrap`.*
*La siguiente sesión lee SOLO este archivo para ponerse al día, sin releer `progress/`.*
