import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { readJSON, writeJSON, initStorage } from "./storage.js";
import { createUser, loginUser, verify2FA, verifyToken, requireAuth, logoutUser, upgradeTier, publicUser, findUserByEmail, seedAdminIfNeeded } from "./auth.js";
import { freeLimiter, authLimiter, securityHeaders, sanitize, validEmail, trackUsage, getUsage } from "./security.js";
import { search, suggest, indexPapers, indexSchools, indexHealth, indexLaws, getStats, seedFromEcosystem } from "./search.js";
import { createProSubscription, getSubscription, isPro, chargeQuery, getBilling, checkQuota, priceList } from "./billing.js";

const ALLID_SSO = "https://allid.onrender.com";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10kb" })); // limit body size
app.use(securityHeaders);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), ...getStats() });
});

/* ── SSO: Login with AllID ─────────────────────────── */
app.post("/api/auth/sso/allid", async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "token required" });
  try {
    const r = await fetch(`${ALLID_SSO}/api/sso/verify`, { headers: { "X-Allid-Token": token } });
    const d = await r.json();
    if (!d.ok) return res.status(401).json({ error: "invalid AllID token" });

    let user = findUserByEmail(d.student.email);
    if (!user) {
      createUser({ name: d.student.name, email: d.student.email, password: crypto.randomBytes(16).toString("hex") });
      user = findUserByEmail(d.student.email);
    }

    // Issue ShimSearch token directly
    const tokens = readJSON("tokens.json") || [];
    const newToken = "sst_sso_" + crypto.randomBytes(24).toString("hex");
    tokens.push({ token: newToken, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: new Date().toISOString() });
    writeJSON("tokens.json", tokens);

    res.json({ token: newToken, user: publicUser(user), sso: "allid" });
  } catch (e) {
    res.status(500).json({ error: "sso failed" });
  }
});

/* ── SSO: Login with AllID (token-based) ──────────── */
const ALLID = "https://allid.onrender.com";
const CLIENT_ID = "shimsearch";

// Redirect user to AllID authorize
app.get("/api/auth/sso", (req, res) => {
  res.redirect(`${ALLID}/sso/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(`https://shimsearch.onrender.com/api/auth/sso/callback`)}`);
});

// AllID redirects back with sso_token
app.get("/api/auth/sso/callback", async (req, res) => {
  const { sso_token } = req.query;
  if (!sso_token) return res.redirect("/login?error=sso_failed");

  try {
    // Verify SSO token with AllID
    const r = await fetch(`${ALLID}/api/sso/verify?sso_token=${sso_token}`);
    const d = await r.json();
    if (!d.ok) return res.redirect("/login?error=sso_failed");

    // Find or create local user
    let user = findUserByEmail(d.student.email);
    if (!user) {
      createUser({ name: d.student.name, email: d.student.email, password: crypto.randomBytes(16).toString("hex") });
      user = findUserByEmail(d.student.email);
    }

    // Issue ShimSearch token
    const tokens = readJSON("tokens.json") || [];
    const token = "sst_sso_" + crypto.randomBytes(24).toString("hex");
    tokens.push({ token, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: new Date().toISOString() });
    writeJSON("tokens.json", tokens);

    res.redirect(`/dashboard?sso=1&token=${token}`);
  } catch {
    res.redirect("/login?error=sso_failed");
  }
});

/* ── auth (hardened) ───────────────────────────────── */
app.post("/api/auth/register", authLimiter, (req, res) => {
  const { name, email, password } = req.body || {};
  const result = createUser({ name: sanitize(name), email, password });
  if (result.error) return res.status(400).json(result);
  res.status(201).json(result);
});

app.post("/api/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const result = loginUser(email, password);
  if (result.error) return res.status(401).json(result);
  res.json(result);
});

app.post("/api/auth/2fa/verify", authLimiter, (req, res) => {
  const { tempToken, code } = req.body || {};
  const result = verify2FA(tempToken, code);
  if (result.error) return res.status(401).json(result);
  res.json(result);
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.headers["x-search-token"] || "";
  res.json(logoutUser(token));
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

/* ── search (rate-limited by tier) ─────────────────── */
app.get("/api/search", freeLimiter, (req, res) => {
  const user = verifyToken(req.headers["x-search-token"] || "");
  const tier = user?.tier || "free";
  const quota = checkQuota(user?.id || req.ip, tier);
  if (!quota.allowed) return res.status(429).json({ error: "quota exceeded", upgrade: "/pricing" });

  trackUsage(user?.id || req.ip, tier);
  const q = sanitize(req.query.q || "");
  const vertical = ["all", "papers", "schools", "health", "laws"].includes(req.query.vertical) ? req.query.vertical : "all";
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const result = search(q, { vertical, limit });
  res.json({ ...result, tier, quota });
});

app.get("/api/suggest", (req, res) => {
  res.json({ suggestions: suggest(sanitize(req.query.q || "")) });
});

/* ── vertical search ───────────────────────────────── */
app.get("/api/search/papers", freeLimiter, (req, res) => {
  const q = sanitize(req.query.q || "");
  res.json(search(q, { vertical: "papers", limit: 20 }));
});

app.get("/api/search/schools", freeLimiter, (req, res) => {
  const q = sanitize(req.query.q || "");
  res.json(search(q, { vertical: "schools", limit: 20 }));
});

app.get("/api/search/health", freeLimiter, (req, res) => {
  const q = sanitize(req.query.q || "");
  res.json(search(q, { vertical: "health", limit: 20 }));
});

app.get("/api/search/laws", freeLimiter, (req, res) => {
  const q = sanitize(req.query.q || "");
  res.json(search(q, { vertical: "laws", limit: 20 }));
});

/* ── billing (NexasPay) ────────────────────────────── */
app.get("/api/pricing", (req, res) => res.json(priceList()));

app.post("/api/billing/subscribe", requireAuth, (req, res) => {
  res.json(createProSubscription(req.user.id, req.user.email));
});

app.get("/api/billing/subscription", requireAuth, (req, res) => {
  res.json(getSubscription(req.user.id) || { tier: "free" });
});

app.get("/api/billing/usage", requireAuth, (req, res) => {
  res.json(getUsage(req.user.id || req.ip));
});

app.get("/api/billing", requireAuth, (req, res) => {
  res.json(getBilling(req.user.id));
});

/* ── admin ─────────────────────────────────────────── */
app.get("/api/admin/stats", (req, res) => {
  const stats = getStats();
  const users = readJSON("users.json") || [];
  const subs = readJSON("subscriptions.json") || {};
  res.json({ ...stats, users: users.length, subscribers: Object.keys(subs).length });
});

app.post("/api/admin/reindex", async (req, res) => {
  await seedFromEcosystem();
  res.json({ ok: true, ...getStats() });
});

/* ── frontend ──────────────────────────────────────── */
app.use(express.static(DIST));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(DIST, "index.html"), (e) => {
    if (e) res.status(200).send("ShimSearch — build frontend first");
  });
});

export default app;
