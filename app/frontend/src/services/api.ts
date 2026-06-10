// api.ts — wrapper fetch con errores normalizados ({error, code, details} de 03 §3.2).

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "code" in e && "status" in e;
}

const BASE = import.meta.env.VITE_BACKEND_URL || "";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw { status: 0, code: "NETWORK", message: "Sin conexión con el servidor" } satisfies ApiError;
  }
  const text = await res.text();
  const json = text ? safeJson(text) : null;
  if (!res.ok) {
    throw {
      status: res.status,
      code: (json as { code?: string })?.code ?? "UNKNOWN",
      message: (json as { error?: string })?.error ?? `Error ${res.status}`,
      details: (json as { details?: unknown })?.details,
    } satisfies ApiError;
  }
  return json as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
