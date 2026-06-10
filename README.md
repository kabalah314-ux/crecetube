# CRECETUBE Assistant

App local en español que convierte una idea de vídeo de YouTube en un proyecto guiado: wizard de 10 etapas (idea → investigación → título → miniatura → guion → grabación → edición → publicación → sprint → evergreen), curso embebido de 20 secciones / 169 clases, 25 plantillas con variables, métricas con snapshots y generadores de IA opcionales vía OpenRouter.

**Especificación completa**: `app/guia_maestra/` (leer `00_INDICE_MAESTRO.md` primero).

## Requisitos

- Node 20+ (probado con 20.20)
- Nada más: la BD es SQLite embebida (se crea sola en `app/backend/data/`)

## Arranque

```bash
npm install        # instala backend y frontend (workspaces)
npm run dev        # backend :8001 + frontend :5173 a la vez
```

Abre http://localhost:5173 — la primera vez te recibe el onboarding.

Otros comandos:

```bash
npm test           # tests del backend + typecheck + build del frontend
npm run seeds      # regenera los seeds JSON desde los markdown de la guía
bash scripts/init.sh   # verificación completa del entorno (harness)
node scripts/smoke.mjs # smoke test del backend
```

## IA opcional

La app funciona al 100% sin IA. Para activar los botones "Generar": crea una cuenta gratuita en [openrouter.ai](https://openrouter.ai), genera una API key y pégala en **Configuración → Inteligencia artificial** (o en el paso 7 del onboarding). El modelo por defecto es `openrouter/free` (gratuito; ~20 peticiones/min y ~200/día). Aviso: los modelos gratuitos pueden usar tus prompts para entrenar.

## Copia de seguridad

Sin login: tus datos viven en este dispositivo. En **Configuración → Copia de seguridad** puedes descargar el JSON completo e importarlo en otra máquina (fusionar o sustituir).

---

# Harness para Claude Code

Plantilla reutilizable que se copia al inicio de cada proyecto para que Claude Code (u otro agente de IA) sepa exactamente cómo trabajar sin tener que explicárselo cada vez.

## Objetivos del harness
1. Ahorrar tokens — el agente solo carga lo que necesita en cada momento
2. Mantener contexto entre sesiones — `SESSION.md` resume el estado sin releer todo
3. Imponer disciplina — el agente sigue tu guía maestra sin improvisar
4. Auditar lo que pasa — toda acción queda registrada en `progress/`
5. Mejorar con el tiempo — aprendizajes se vuelcan en `improvements/`

## Comandos del harness
`/start` arranca sesión · `/status` estado sin tocar nada · `/done` cierra tarea · `/block` bloquea · `/improve` registra aprendizaje · `/wrap` cierra sesión actualizando `SESSION.md`.

Los archivos clave: `CLAUDE.md` (instrucciones del agente), `TASKS.json` (tareas), `SESSION.md` (memoria entre sesiones), `progress/` (bitácora diaria), `improvements/` (aprendizajes), `scripts/init.sh` (verificación del entorno).
