import { readJSON, writeJSON } from "./storage.js";

// ── NexasPay billing integration ─────────────────────
// Pro: K50/month paid in NCN via NexasPay
// API: 0.01 NCN/query paid in NCN
// All payments go through NexasPay merchant API

const NEXAS_PAY = process.env.NEXAS_PAY_URL || "https://nexas-pay.onrender.com";
const MERCHANT_KEY = process.env.NEXAS_MERCHANT_KEY || "np_9txq8poxi6_xwof2mc7ds"; // ShimbaData key (demo)
const PRO_PRICE_NCN = 50; // 50 NCN/month
const API_PRICE_NCN = 0.01; // per query

// ── Search rewards (Nexas Search) ────────────────────
// Logged-in users earn NexasCoin for every search.
export const REWARD_NCN = 0.001; // per search
export const MAX_REWARD_SEARCHES = 100; // rewarded searches per day

function today() { return new Date().toISOString().slice(0, 10); }

export async function rewardSearch(user) {
  if (!user || !user.email) return { credited: false, reason: "no-user" };
  try {
    // Only reward users who already have a Nexas wallet (signed in to NexasPay)
    const w = await fetch(`${NEXAS_PAY}/api/merchant/balance/${encodeURIComponent(user.email)}`, {
      headers: { "X-Merchant-Key": MERCHANT_KEY },
      signal: AbortSignal.timeout(10000),
    });
    const wd = await w.json().catch(() => ({}));
    if (!w.ok || wd.exists !== true) return { credited: false, reason: "no-nexas-wallet", wallet: wd.exists };

    const rewards = readJSON("rewards.json") || {};
    const key = `${user.id}_${today()}`;
    const row = rewards[key] || { userId: user.id, email: user.email, date: today(), count: 0, ncn: 0 };
    if (row.count >= MAX_REWARD_SEARCHES) return { credited: false, reason: "daily-cap", dailyCount: row.count, cap: MAX_REWARD_SEARCHES, coins: REWARD_NCN };

    const r = await fetch(`${NEXAS_PAY}/api/merchant/credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Merchant-Key": MERCHANT_KEY },
      body: JSON.stringify({ email: user.email, coins: REWARD_NCN, memo: "ShimSearch search reward" }),
      signal: AbortSignal.timeout(10000),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.credited) return { credited: false, reason: "nexaspay-error", detail: d.error };

    row.count++;
    row.ncn = Math.round((row.ncn + REWARD_NCN) * 1000) / 1000;
    rewards[key] = row;
    writeJSON("rewards.json", rewards);
    return { credited: true, coins: REWARD_NCN, balance: d.balance, dailyCount: row.count, cap: MAX_REWARD_SEARCHES };
  } catch {
    return { credited: false, reason: "nexaspay-down" };
  }
}

export function getRewards(userId) {
  const rewards = readJSON("rewards.json") || {};
  let todayCount = 0, todayNcn = 0, totalCount = 0, totalNcn = 0;
  for (const k of Object.keys(rewards)) {
    const row = rewards[k];
    if (row.userId !== userId) continue;
    totalCount += row.count;
    totalNcn = Math.round((totalNcn + row.ncn) * 1000) / 1000;
    if (row.date === today()) { todayCount = row.count; todayNcn = row.ncn; }
  }
  return { today: todayCount, todayNcn, total: totalCount, totalNcn, rate: REWARD_NCN, cap: MAX_REWARD_SEARCHES };
}

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
