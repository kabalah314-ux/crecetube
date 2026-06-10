Registra un aprendizaje en la carpeta `improvements/` para mejorar el harness en futuros proyectos.

1. Pregunta al usuario:
   - *"¿Qué pasó? (descripción breve)"*
   - *"¿Por qué fue un problema?"*
   - *"¿Cómo se resolvió en el momento?"*
   - *"¿Qué cambio propones aplicar al harness?"* (qué archivo y qué cambio exacto)
   - *"¿Categoría?"* (prompt / estructura / flujo / dependencias / tests / entorno)
2. Cuenta cuántos archivos hay en `improvements/` (excluyendo `.gitkeep` y `001-template.md`) y calcula el siguiente número con padding de 3 dígitos (002, 003, 004...).
3. Crea un archivo nuevo `improvements/NNN-titulo-corto.md` siguiendo la plantilla `improvements/001-template.md`, rellenando con las respuestas del usuario.
4. Confirma al usuario:
   *"Aprendizaje guardado en `improvements/NNN-titulo.md`. Recuerda copiarlo al `harness-template` original al cerrar el proyecto para que beneficie a los próximos."*
5. NO modifiques `CLAUDE.md` ni otros archivos del harness automáticamente. El usuario decide cuándo aplicar la mejora al template original.
