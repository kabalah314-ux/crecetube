// errors.js — error tipado + handler global con el formato de 03 §3.2/3.6.
export class ApiError extends Error {
  constructor(code, status, message, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const notFound = (entity, code) => new ApiError(code, 404, `${entity} no encontrado`);

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    const body = { error: err.message, code: err.code };
    if (err.details !== undefined) body.details = err.details;
    return res.status(err.status).json(body);
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido en el body", code: "VALIDATION_ERROR" });
  }
  console.error(err);
  return res.status(500).json({ error: "Error interno", code: "INTERNAL_ERROR" });
}

// Envuelve handlers async para que sus throws lleguen al errorHandler.
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
