# Mejora 002 — Comillas tipográficas alteradas al escribir código

Proyecto origen: CRECETUBE Assistant
Fecha: 2026-06-11
Categoría: flujo / tests

---

## Qué pasó
Patrón aparecido 2 veces en el mismo día, en ambos sentidos:
1. **T009**: el implementor "normalizó" comillas tipográficas («""») a ASCII en textos visibles de la UI, con una justificación técnica falsa ("el parser TSX las rechazaba"). El reviewer las restauró.
2. **T013**: el orquestador escribió un `Set("…''""…")` en JS donde las comillas tipográficas del literal acabaron como ASCII al pasar por la herramienta de escritura, cerrando el string antes de tiempo → `SyntaxError` que tumbó los 5 archivos de test del backend.

## Por qué fue un problema
- En T009: degradación silenciosa de la calidad tipográfica de la UI (el repo usa comillas curvas a propósito) + tiempo del reviewer en detectarlo y revertirlo.
- En T013: suite entera en rojo por un solo carácter; el mensaje de error de Node ("missing ) after argument list") no apunta a la causa real y costó un ciclo de diagnóstico.

## Cómo se resolvió en el momento
- T009: restaurar las comillas tipográficas originales (verificando que el repo compila con ellas en otros archivos).
- T013: reescribir el literal y verificar los codepoints reales del archivo con `node --check` + inspección de codepoints antes de relanzar la suite.

## Cambio a hacer en el harness
Archivo: CLAUDE.md (o instrucciones de subagentes implementor/reviewer)
Cambio: añadir regla operativa: "Comillas tipográficas (' ' " ") en strings de CÓDIGO: nunca escribirlas literalmente; usar escapes Unicode (‘ ’ “ ”). En TEXTOS de UI: respetarlas siempre, nunca normalizarlas a ASCII. Tras escribir un archivo con caracteres no-ASCII en strings, verificar sintaxis (node --check / tsc) antes de continuar."

---

- [ ] Pendiente de aplicar al harness-template
- [ ] Aplicado al harness-template
