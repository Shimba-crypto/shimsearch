import { readJSON, writeJSON } from "./storage.js";

// ── NexasPay billing integration ─────────────────────
// Pro: K50/month paid in NCN via NexasPay
// API: 0.01 NCN/query paid in NCN
// All payments go through NexasPay merchant API

const NEXAS_PAY = "https://nexas-pay.onrender.com";
const MERCHANT_KEY = process.env.NEXAS_MERCHANT_KEY || "np_9txq8poxi6_xwof2mc7ds"; // ShimbaData key (demo)
const PRO_PRICE_NCN = 50; // 50 NCN/month
const API_PRICE_NCN = 0.01; // per query

export async function createProSubscription(userId, userEmail) {
  // In production: call NexasPay to charge NCN
  // For demo: record subscription locally
  const subs = readJSON("subscriptions.json") || {};
  subs[userId] = {
    userId,
    email: userEmail,
    tier: "pro",
    priceNcn: PRO_PRICE_NCN,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  };
  writeJSON("subscriptions.json", subs);

  // Upgrade user tier
  const users = readJSON("users.json") || [];
  const u = users.find((x) => x.id === userId);
  if (u) { u.tier = "pro"; writeJSON("users.json", users); }

  return { ok: true, tier: "pro", expiresAt: subs[userId].expiresAt };
}

export function getSubscription(userId) {
  const subs = readJSON("subscriptions.json") || {};
  return subs[userId] || null;
}

export function isPro(userId) {
  const sub = getSubscription(userId);
  if (!sub) return false;
  return sub.active && new Date(sub.expiresAt) > new Date();
}

// Pay-per-query for API users
export async function chargeQuery(userId, queries = 1) {
  const cost = queries * API_PRICE_NCN;
  const billing = readJSON("billing.json") || {};
  if (!billing[userId]) billing[userId] = { userId, totalNcn: 0, queries: 0, history: [] };
  billing[userId].totalNcn += cost;
  billing[userId].queries += queries;
  billing[userId].history.push({ queries, costNcn: cost, at: new Date().toISOString() });
  writeJSON("billing.json", billing);
  return { charged: cost, total: billing[userId].totalNcn };
}

export function getBilling(userId) {
  const billing = readJSON("billing.json") || {};
  return billing[userId] || { userId, totalNcn: 0, queries: 0, history: [] };
}

// Usage quota check
export function checkQuota(userId, tier) {
  const today = new Date().toISOString().slice(0, 10);
  const usage = readJSON("usage.json") || {};
  const key = `${userId}_${today}`;
  const count = usage[key]?.count || 0;

  if (tier === "pro" || isPro(userId)) {
    return { allowed: true, remaining: Infinity, tier: "pro" };
  }
  // Free tier: 1000/day
  const remaining = Math.max(0, 1000 - count);
  return { allowed: remaining > 0, remaining, tier: "free" };
}

export function priceList() {
  return {
    free: { price: 0, limit: "1,000 queries/day" },
    pro: { price: "50 NCN/month", limit: "unlimited", payment: "NexasPay" },
    api: { price: "0.01 NCN/query", limit: "pay-as-you-go", currency: "NexasCoin" },
  };
}
