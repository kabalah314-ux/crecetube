Marca la tarea actualmente `"en_progreso"` como `"completada"`:

1. Pide al usuario una descripción de una línea sobre lo que se hizo
2. Actualiza el campo `"resultado"` en `TASKS.json` con esa descripción
3. Cambia el estado de la tarea a `"completada"`
4. Actualiza el campo `"resumen"` de `TASKS.json`:
   - suma 1 a `completadas`
   - resta 1 a `en_progreso`
5. Actualiza `"ultima_actualizacion"` con la fecha de hoy
6. Escribe la entrada en `progress/YYYY-MM-DD.md` (crea el archivo si no existe hoy) con:
   - id y título de la tarea
   - qué se hizo (resumen breve)
   - archivos creados/modificados
   - problemas encontrados (si los hubo)
7. Muestra cuál es la siguiente tarea disponible (la primera `"pendiente"` cuya `depende_de` esté `"completada"`)
8. Pregunta: *"¿Empezamos con [siguiente tarea]?"*
