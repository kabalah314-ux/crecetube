Inicia la sesión de trabajo siguiendo estos pasos en orden estricto:

1. Lee `SESSION.md` completo
2. Ejecuta `scripts/init.sh`
3. Si `init.sh` falla → informa qué falló y espera instrucciones. No continúes.
4. Si `init.sh` pasa → lee SOLO el campo `"resumen"` de `TASKS.json` (no el array completo)
5. Muestra al usuario un resumen breve:
   - Proyecto y fecha de última sesión
   - Tarea activa (si la hay)
   - Próximo paso definido en `SESSION.md`
   - Bloqueadores activos (si los hay)
6. Pregunta: *"¿Continuamos con [próxima tarea] o prefieres otra cosa?"*

No leas `progress/` ni el array completo de `TASKS.json` en este paso — solo el resumen.
