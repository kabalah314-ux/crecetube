# 002 — init.sh debe validar JSON sin asumir python

**Contexto**: en Windows (Git Bash mínimo) el `init.sh` original validaba `TASKS.json` con `python3`. Si python no está en el PATH, el fallo del comando se interpretaba como "JSON con errores de sintaxis" → falso positivo que bloquea la sesión (el harness prohíbe continuar con init.sh en rojo).

**Aprendizaje**: cuando un check depende de una herramienta externa, distinguir SIEMPRE "la herramienta falta" (warn) de "el check falla" (fail). Nunca convertir la ausencia de la herramienta en un fallo del artefacto.

**Aplicado**: `scripts/init.sh` ahora valida con `node` → fallback `python3` → si no hay ninguno, `warn` con comprobación omitida.

**Para futuros proyectos del harness**: copiar esta versión de init.sh a la plantilla. En proyectos Node, node siempre está disponible una vez instalado el stack; preferirlo como validador.
