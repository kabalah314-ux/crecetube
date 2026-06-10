Muestra el estado actual del proyecto SIN modificar ningún archivo. Solo lectura.

1. Lee `SESSION.md`
2. Lee SOLO el campo `"resumen"` de `TASKS.json`
3. Muestra al usuario, en formato compacto:
   - Proyecto: [nombre]
   - Última sesión: [fecha]
   - Progreso: X completadas / Y totales
   - Tarea actual: [id] [título] ([estado])
   - Próximo paso: [del SESSION.md]
   - Bloqueadores: [lista o "Ninguno"]
4. NO ejecutes `init.sh`. NO modifiques nada. NO preguntes nada después.

Este comando existe para consultar rápido sin gastar tokens ni alterar el estado.
