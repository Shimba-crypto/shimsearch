import rateLimit from "express-rate-limit";
import { readJSON, writeJSON } from "./storage.js";

// ── Rate limiting ────────────────────────────────────
export const freeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "free tier limit reached (1000/day). Upgrade to Pro." },
  keyGenerator: (req) => req.ip,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: "too many attempts. Try again in 15 min." },
  keyGenerator: (req) => req.ip,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  message: { error: "rate limit: 60 req/min max." },
  keyGenerator: (req) => req.ip,
});

// ── Input sanitization ──────────────────────────────
export function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/['";\\]/g, "")
    .trim()
    .slice(0, 500);
}

export function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function validUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

// Disposable email domains (common list)
const DISPOSABLE = new Set(["tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com", "yopmail.com", "10minutemail.com"]);
export function isDisposableEmail(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE.has(domain);
}

// ── Security headers ────────────────────────────────
export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  res.removeHeader("X-Powered-By");
  next();
}

// ── Password strength (simple) ──────────────────────
export function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score; // 0-5
}

// ── Usage tracking ──────────────────────────────────
export function trackUsage(ip, tier) {
  const today = new Date().toISOString().slice(0, 10);
  const usage = readJSON("usage.json") || {};
  const key = `${ip}_${today}`;
  if (!usage[key]) usage[key] = { ip, date: today, count: 0, tier };
  usage[key].count++;
  writeJSON("usage.json", usage);
  return usage[key].count;
}

export function getUsage(ip) {
  const today = new Date().toISOString().slice(0, 10);
  const usage = readJSON("usage.json") || {};
  return usage[`${ip}_${today}`] || { count: 0, tier: "free" };
}
