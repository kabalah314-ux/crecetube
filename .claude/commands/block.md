Marca la tarea actual como `"bloqueada"`:

1. Pregunta al usuario: *"¿Cuál es el motivo del bloqueo?"*
2. Escribe el motivo en el campo `"resultado"` de la tarea en `TASKS.json`
3. Cambia el estado de la tarea a `"bloqueada"`
4. Actualiza el campo `"resumen"` de `TASKS.json`:
   - suma 1 a `bloqueadas`
   - resta 1 a `en_progreso` (si estaba en progreso) o a `pendientes`
5. Escribe una entrada en `progress/YYYY-MM-DD.md` explicando:
   - id y título de la tarea
   - motivo del bloqueo
   - qué se necesita para desbloquear (acción o decisión del usuario)
6. Consulta la carpeta `improvements/` para ver si este bloqueo ya ocurrió antes y avisa al usuario si encuentras algo relevante
7. Informa al usuario:
   *"Tarea bloqueada. No continuaré con tareas nuevas hasta que se resuelva. ¿Quieres que trabaje en otra tarea independiente mientras tanto?"*
