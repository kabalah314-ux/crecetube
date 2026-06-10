// util.js — helpers compartidos.
import { randomUUID } from "node:crypto";

export const uuid = () => randomUUID();
export const nowIso = () => new Date().toISOString();

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Merge profundo estilo PATCH parcial (03 §3.3.2): objetos se fusionan,
// arrays y primitivos se REEMPLAZAN, null asigna null.
export function mergeDeep(target, patch) {
  const out = { ...target };
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (isPlainObject(v) && isPlainObject(out[k])) out[k] = mergeDeep(out[k], v);
    else if (Array.isArray(v)) out[k] = structuredClone(v);
    else out[k] = v;
  }
  return out;
}

export function assert422(cond, campo, mensaje, errors) {
  if (!cond) errors.push({ campo, mensaje });
}
