// routes/auth.js — registro/login con email+password (scrypt) y Google Sign-In (ID token verificado con jose).
// Con SESSION_SECRET vacío las cuentas están desactivadas (503) pero el resto de la app sigue en modo local.
import { Router } from "express";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ApiError, h } from "../errors.js";
import { cfg } from "../config.js";
import { ensureDefaultChannel } from "../db.js";
import { sembrarDemo } from "../demoSeed.js";
import { assert422, nowIso, uuid } from "../util.js";
import { clearSessionCookie, createSessionToken, setSessionCookie } from "../middleware/auth.js";

const scrypt = promisify(scryptCb);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

// Formato passwordHash: "salt:hash" en hex (scrypt, salt aleatorio de 16 bytes).
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [salt, hex] = String(stored ?? "").split(":");
  if (!salt || !hex) return false;
  const esperado = Buffer.from(hex, "hex");
  const calculado = await scrypt(password, salt, 64);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

function requireSecret() {
  if (!cfg.SESSION_SECRET)
    throw new ApiError("AUTH_NOT_CONFIGURED", 503, "Las cuentas están desactivadas (falta SESSION_SECRET): la app funciona en modo local");
}

const publicUser = (u) => ({
  id: u.id,
  email: u.email ?? null,
  nombre: u.nombre ?? null,
  modo: "cuenta",
  esDemo: Boolean(u.esDemo),
});

const iniciarSesion = async (res, userId) => setSessionCookie(res, await createSessionToken(userId));

const router = Router();

// Config pública para el frontend: con qué métodos de acceso cuenta este servidor.
router.get("/config", h(async (_req, res) => {
  res.json({
    googleClientId: cfg.GOOGLE_CLIENT_ID || null,
    authConfigurada: Boolean(cfg.SESSION_SECRET),
  });
}));

router.post("/registro", h(async (req, res) => {
  requireSecret();
  const db = req.app.locals.db;
  const { email, password, nombre } = req.body ?? {};
  const errors = [];
  assert422(typeof email === "string" && EMAIL_RE.test(email.trim()), "email", "Email inválido", errors);
  assert422(typeof password === "string" && password.length >= 8, "password", "Mínimo 8 caracteres", errors);
  if (errors.length) throw new ApiError("VALIDATION_ERROR", 422, "Datos de registro inválidos", errors);

  const emailNorm = email.trim().toLowerCase();
  if (await db.get("SELECT 1 FROM users WHERE email=?", [emailNorm]))
    throw new ApiError("EMAIL_ALREADY_EXISTS", 409, "Ya existe una cuenta con ese email");

  const user = {
    id: uuid(),
    email: emailNorm,
    nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim().slice(0, 80) : null,
    passwordHash: await hashPassword(password),
    createdAt: nowIso(),
  };
  try {
    await db.run("INSERT INTO users(id,email,nombre,passwordHash,createdAt) VALUES(?,?,?,?,?)", [
      user.id, user.email, user.nombre, user.passwordHash, user.createdAt,
    ]);
  } catch (e) {
    if (String(e.message).includes("UNIQUE"))
      throw new ApiError("EMAIL_ALREADY_EXISTS", 409, "Ya existe una cuenta con ese email");
    throw e;
  }
  await ensureDefaultChannel(db, user.id);
  await iniciarSesion(res, user.id);
  res.status(201).json(publicUser(user));
}));

router.post("/login", h(async (req, res) => {
  requireSecret();
  const db = req.app.locals.db;
  const { email, password } = req.body ?? {};
  const user = typeof email === "string"
    ? await db.get("SELECT id,email,nombre,passwordHash FROM users WHERE email=?", [email.trim().toLowerCase()])
    : null;
  const ok = Boolean(user?.passwordHash) && typeof password === "string" && (await verifyPassword(password, user.passwordHash));
  if (!ok) throw new ApiError("INVALID_CREDENTIALS", 401, "Email o contraseña incorrectos");
  await iniciarSesion(res, user.id);
  res.json(publicUser(user));
}));

router.post("/google", h(async (req, res) => {
  requireSecret();
  if (!cfg.GOOGLE_CLIENT_ID)
    throw new ApiError("AUTH_NOT_CONFIGURED", 503, "El acceso con Google está desactivado (falta GOOGLE_CLIENT_ID)");
  const { credential } = req.body ?? {};
  if (typeof credential !== "string" || !credential)
    throw new ApiError("VALIDATION_ERROR", 422, "Se espera { credential } con el ID token de Google");

  let payload;
  try {
    ({ payload } = await jwtVerify(credential, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: cfg.GOOGLE_CLIENT_ID,
    }));
  } catch {
    throw new ApiError("INVALID_CREDENTIALS", 401, "El token de Google no es válido");
  }

  const db = req.app.locals.db;
  const googleSub = String(payload.sub);
  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  const nombre = typeof payload.name === "string" ? payload.name.slice(0, 80) : null;

  // Upsert: primero por googleSub; si no, vincula por email; si no, cuenta nueva.
  let user = await db.get("SELECT id,email,nombre FROM users WHERE googleSub=?", [googleSub]);
  if (!user && email) {
    const porEmail = await db.get("SELECT id,email,nombre FROM users WHERE email=?", [email]);
    if (porEmail) {
      await db.run("UPDATE users SET googleSub=? WHERE id=?", [googleSub, porEmail.id]);
      user = porEmail;
    }
  }
  if (!user) {
    user = { id: uuid(), email, nombre, createdAt: nowIso() };
    await db.run("INSERT INTO users(id,email,nombre,googleSub,createdAt) VALUES(?,?,?,?,?)", [
      user.id, user.email, user.nombre, googleSub, user.createdAt,
    ]);
  }
  await ensureDefaultChannel(db, user.id);
  await iniciarSesion(res, user.id);
  res.json(publicUser(user));
}));

// Cuenta demo efímera (T023): usuario sandbox con datos de muestra y sesión normal.
// initDb purga las cuentas demo con más de 7 días junto con todos sus datos.
router.post("/demo", h(async (req, res) => {
  requireSecret();
  const db = req.app.locals.db;
  const user = { id: `demo-${uuid()}`, email: null, nombre: "Cuenta demo", esDemo: 1, createdAt: nowIso() };
  await db.run("INSERT INTO users(id,email,nombre,esDemo,createdAt) VALUES(?,?,?,?,?)", [
    user.id, user.email, user.nombre, user.esDemo, user.createdAt,
  ]);
  await sembrarDemo(db, user.id);
  await iniciarSesion(res, user.id);
  res.status(201).json(publicUser(user));
}));

router.post("/logout", h(async (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
}));

router.get("/me", h(async (req, res) => {
  if (req.userId !== "local") {
    const user = await req.app.locals.db.get("SELECT id,email,nombre,esDemo FROM users WHERE id=?", [req.userId]);
    if (user) return res.json(publicUser(user));
  }
  res.json({ id: "local", email: null, nombre: null, modo: "local", esDemo: false });
}));

export default router;
