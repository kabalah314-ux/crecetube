// llm.js — cliente OpenRouter según 04 §4.3, con transporte inyectable para tests (08 §8.2).
import { cfg } from "./config.js";
import { ApiError } from "./errors.js";

export function resolveIaConfig(profile) {
  const ia = profile?.iaConfig ?? {};
  return {
    proveedor: ia.proveedor || cfg.LLM_PROVIDER,
    modelo: ia.modelo || cfg.LLM_MODEL,
    apiKey: ia.apiKey || cfg.LLM_API_KEY,
    baseUrl: ia.baseUrl || cfg.LLM_BASE_URL,
    temperatura: typeof ia.temperatura === "number" ? ia.temperatura : 0.7,
  };
}

// Transporte inyectable: (iaCfg, body) => respuesta JSON estilo OpenAI. Tests lo sustituyen.
let transport = null;
export const setTransport = (fn) => { transport = fn; };

async function realTransport(iaCfg, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const res = await fetch(`${iaCfg.baseUrl}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${iaCfg.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "CRECETUBE Assistant",
      },
      body: JSON.stringify(body),
    });
    if (res.status === 429)
      throw new ApiError("AI_RATE_LIMIT", 429, "Límite del modelo gratuito alcanzado (20/min, 200/día). Espera un poco o cambia de modelo.");
    if (res.status === 401 || res.status === 403)
      throw new ApiError("AI_PROVIDER_ERROR", 502, "Tu clave no es válida o ha caducado. Revísala en Ajustes.");
    if (!res.ok) {
      const txt = (await res.text()).slice(0, 140);
      throw new ApiError("AI_PROVIDER_ERROR", 502, `Error del proveedor: ${txt}`);
    }
    return await res.json();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("AI_PROVIDER_ERROR", 502, "El modelo no responde. Inténtalo de nuevo.");
  } finally {
    clearTimeout(timer);
  }
}

async function send(iaCfg, body) {
  if (!iaCfg.apiKey) throw new ApiError("AI_NOT_CONFIGURED", 503, "No hay clave de IA configurada");
  return (transport ?? realTransport)(iaCfg, body);
}

export async function chat(iaCfg, { system, user, temperature, maxTokens }) {
  const json = await send(iaCfg, {
    model: iaCfg.modelo,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
  });
  return {
    content: json?.choices?.[0]?.message?.content ?? "",
    modeloUsado: json?.model ?? iaCfg.modelo,
    tokensUsados: json?.usage?.total_tokens ?? null,
  };
}

export async function testConexion(iaCfg) {
  const t0 = Date.now();
  const json = await send(iaCfg, {
    model: iaCfg.modelo,
    messages: [{ role: "user", content: "Responde solo: OK" }],
    max_tokens: 5,
  });
  return { ok: true, modelo: json?.model ?? iaCfg.modelo, latenciaMs: Date.now() - t0 };
}
