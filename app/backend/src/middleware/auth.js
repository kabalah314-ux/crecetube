// middleware/auth.js — sesión por cookie JWT (HS256, jose) con fallback a MODO LOCAL.
// Sin cookie válida o sin SESSION_SECRET, req.userId = "local" y la app funciona como siempre (nunca 401).
import { SignJWT, jwtVerify } from "jose";
import { cfg } from "../config.js";

export const SESSION_COOKIE = "ct_session";
const DIAS_30_SEG = 30 * 24 * 60 * 60;

const secret = () => new TextEncoder().encode(cfg.SESSION_SECRET);

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

export async function createSessionToken(userId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOpts(), maxAge: DIAS_30_SEG * 1000 });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOpts());
}

export async function authMiddleware(req, _res, next) {
  req.userId = "local";
  const token = req.cookies?.[SESSION_COOKIE];
  if (token && cfg.SESSION_SECRET) {
    try {
      const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
      if (payload.sub) req.userId = String(payload.sub);
    } catch {
      /* cookie inválida o caducada → modo local */
    }
  }
  next();
}
