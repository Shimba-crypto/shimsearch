import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { readJSON, writeJSON } from "./storage.js";
import { createUser, loginUser, verify2FA, verifyToken, requireAuth, logoutUser, upgradeTier, publicUser, findUserByEmail, seedAdminIfNeeded } from "./auth.js";
import { freeLimiter, authLimiter, securityHeaders, sanitize, validEmail, trackUsage, getUsage } from "./security.js";
import { search, suggest, indexPapers, indexSchools, indexHealth, indexLaws, getStats, seedFromEcosystem } from "./search.js";
import { createProSubscription, getSubscription, isPro, chargeQuery, getBilling, checkQuota, priceList } from "./billing.js";

const ALLID = "https://allid.onrender.com";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(securityHeaders);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), ...getStats() });
});

/* ── SSO: Login with AllID ─────────────────────────── */
app.get("/api/auth/sso", (req, res) => {
  res.redirect(`${ALLID}/sso/authorize?client_id=shimsearch&redirect_uri=${encodeURIComponent("https://shimsearch.onrender.com/api/auth/sso/callback")}`);
});

app.get("/api/auth/sso/callback", (req, res) => {
  const { sso_token } = req.query;
  if (!sso_token) return res.redirect("/login?error=sso_failed");
  // Redirect to dashboard with sso_token — browser verifies client-side (AllID has CORS *)
  res.redirect(`/dashboard?sso_token=${sso_token}`);
});

// Dashboard calls this after verifying sso_token with AllID client-side
app.post("/api/auth/sso/verify", async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "name and email required" });
  try {
    let user = findUserByEmail(email);
    if (!user) {
      createUser({ name, email, password: crypto.randomBytes(16).toString("hex") });
      user = findUserByEmail(email);
    }
    const token = signToken({ userId: user.id, email: user.email });
    const tokens = readJSON("tokens.json") || [];
    tokens.push({ token, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: new Date().toISOString() });
    writeJSON("tokens.json", tokens);
    res.cookie("nsp_token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true, token, user: publicUser(user) });
  } catch {
    res.status(500).json({ error: "failed" });
  }
});
app.post("/api/auth/sso/allid", async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "token required" });
  // Retry logic for cold starts
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${ALLID}/api/sso/verify?sso_token=${token}`, { signal: AbortSignal.timeout(20000) });
      const d = await r.json();
      if (!d.ok) return res.status(401).json({ error: "invalid token" });
      let user = findUserByEmail(d.student.email);
      if (!user) {
        createUser({ name: d.student.name, email: d.student.email, password: crypto.randomBytes(16).toString("hex") });
        user = findUserByEmail(d.student.email);
      }
      const tokens = readJSON("tokens.json") || [];
      const ssToken = "sst_sso_" + crypto.randomBytes(24).toString("hex");
      tokens.push({ token: ssToken, userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: new Date().toISOString() });
      writeJSON("tokens.json", tokens);
      res.json({ token: ssToken, user: publicUser(user) });
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 2000)); // wait 2s between retries
    }
  }
  res.status(500).json({ error: "sso verification failed" });
});
/* ── auth (hardened) ───────────────────────────────── */
app.post("/api/auth/register", authLimiter, (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
  const result = createUser({ name: sanitize(name), email, password });
  if (result.error) return res.status(409).json(result);
  res.status(201).json(result);
});

app.post("/api/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
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
  res.json(logoutUser(req.headers["x-search-token"] || ""));
});

app.get("/api/auth/me", requireAuth, (req, res) => res.json(publicUser(req.user)));

/* ── search (rate-limited) ─────────────────────────── */
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

app.get("/api/suggest", (req, res) => res.json({ suggestions: suggest(sanitize(req.query.q || "")) }));

app.get("/api/search/papers", freeLimiter, (req, res) => res.json(search(sanitize(req.query.q || ""), { vertical: "papers", limit: 20 })));
app.get("/api/search/schools", freeLimiter, (req, res) => res.json(search(sanitize(req.query.q || ""), { vertical: "schools", limit: 20 })));
app.get("/api/search/health", freeLimiter, (req, res) => res.json(search(sanitize(req.query.q || ""), { vertical: "health", limit: 20 })));
app.get("/api/search/laws", freeLimiter, (req, res) => res.json(search(sanitize(req.query.q || ""), { vertical: "laws", limit: 20 })));

/* ── billing (NexasPay) ────────────────────────────── */
app.get("/api/pricing", (req, res) => res.json(priceList()));
app.post("/api/billing/subscribe", requireAuth, (req, res) => res.json(createProSubscription(req.user.id, req.user.email)));
app.get("/api/billing/subscription", requireAuth, (req, res) => res.json(getSubscription(req.user.id) || { tier: "free" }));
app.get("/api/billing/usage", requireAuth, (req, res) => res.json(getUsage(req.user.id)));
app.get("/api/billing", requireAuth, (req, res) => res.json(getBilling(req.user.id)));

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
