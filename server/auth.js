import crypto from "crypto";
import bcrypt from "bcryptjs";
import { readJSON, writeJSON } from "./storage.js";
import { validEmail, validUsername, isDisposableEmail, passwordStrength } from "./security.js";

const TOKEN_TTL = 1000 * 60 * 60 * 24; // 24 hours

function uid(prefix) { return prefix + "_" + crypto.randomBytes(8).toString("hex"); }

export function listUsers() { return readJSON("users.json") || []; }

export function findUserByEmail(email) {
  return (readJSON("users.json") || []).find((u) => u.email === email.toLowerCase()) || null;
}

export function createUser({ name, email, password }) {
  // Validation
  if (!name || !email || !password) return { error: "name, email, password required" };
  name = name.trim().slice(0, 100);
  email = email.toLowerCase().trim();
  if (!validEmail(email)) return { error: "invalid email format" };
  if (isDisposableEmail(email)) return { error: "disposable emails not allowed" };
  if (passwordStrength(password) < 3) return { error: "password too weak. Need 8+ chars, upper+lower+digit+special" };
  const users = readJSON("users.json") || [];
  if (users.some((u) => u.email === email)) return { error: "email already registered" };

  const user = {
    id: uid("usr"),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "user",
    tier: "free",
    active: true,
    twoFactor: false,
    username: "",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeJSON("users.json", users);
  return { user: publicUser(user) };
}

export function loginUser(email, password) {
  if (!email || !password) return { error: "email and password required" };
  email = email.toLowerCase().trim();
  const user = findUserByEmail(email);
  // Constant-time failure (don't reveal if email exists)
  if (!user) {
    bcrypt.compareSync(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    return { error: "invalid email or password" };
  }
  if (!user.active) return { error: "account not activated" };
  if (!bcrypt.compareSync(password, user.passwordHash)) return { error: "invalid email or password" };

  if (user.twoFactor) {
    const tempToken = uid("tmp") + crypto.randomBytes(8).toString("hex");
    const otps = readJSON("otps.json") || {};
    otps[tempToken] = { email, expiresAt: Date.now() + 5 * 60 * 1000 };
    writeJSON("otps.json", otps);
    return { requiresTwoFactor: true, tempToken, message: "enter 2FA code" };
  }

  return completeLogin(user);
}

export function verify2FA(tempToken, code) {
  const otps = readJSON("otps.json") || {};
  const record = otps[tempToken];
  if (!record || Date.now() > record.expiresAt) return { error: "expired or invalid" };
  // Demo: accept any 6-digit code (in production use TOTP)
  if (!/^\d{6}$/.test(code)) return { error: "invalid code format" };
  delete otps[tempToken];
  writeJSON("otps.json", otps);
  const user = findUserByEmail(record.email);
  if (!user) return { error: "user not found" };
  return completeLogin(user);
}

function completeLogin(user) {
  const token = uid("sst") + crypto.randomBytes(16).toString("hex");
  const tokens = readJSON("tokens.json") || [];
  tokens.push({ token, userId: user.id, expiresAt: Date.now() + TOKEN_TTL, createdAt: new Date().toISOString() });
  writeJSON("tokens.json", tokens);
  return { token, user: publicUser(user) };
}

// Generate a token for a user (used by SSO and other flows)
export function createToken(userId) {
  const token = uid("sst") + crypto.randomBytes(16).toString("hex");
  const tokens = readJSON("tokens.json") || [];
  tokens.push({ token, userId, expiresAt: Date.now() + TOKEN_TTL, createdAt: new Date().toISOString() });
  writeJSON("tokens.json", tokens);
  return token;
}

export function verifyToken(token) {
  if (!token) return null;
  const tokens = readJSON("tokens.json") || [];
  const t = tokens.find((x) => x.token === token);
  if (!t || Date.now() > t.expiresAt) return null;
  return (readJSON("users.json") || []).find((u) => u.id === t.userId) || null;
}

export function requireAuth(req, res, next) {
  const token = req.headers["x-search-token"] || req.query.token;
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: "login required" });
  req.user = user;
  next();
}

export function logoutUser(token) {
  const tokens = readJSON("tokens.json") || [];
  writeJSON("tokens.json", tokens.filter((t) => t.token !== token));
  return { ok: true };
}

export function upgradeTier(userId, tier) {
  const users = readJSON("users.json") || [];
  const u = users.find((x) => x.id === userId);
  if (!u) return { error: "not found" };
  u.tier = tier;
  writeJSON("users.json", users);
  return { ok: true, tier };
}

export function publicUser(u) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role, tier: u.tier, username: u.username, createdAt: u.createdAt };
}

export function seedAdminIfNeeded() {
  const users = readJSON("users.json") || [];
  if (users.some((u) => u.role === "admin")) return null;
  const user = {
    id: uid("adm"),
    name: "Admin",
    email: (process.env.ADMIN_EMAIL || "admin@shimsearch.com").toLowerCase(),
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "SearchAdmin2026!Secure", 10),
    role: "admin",
    tier: "pro",
    active: true,
    twoFactor: false,
    username: "admin",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeJSON("users.json", users);
  return user;
}
