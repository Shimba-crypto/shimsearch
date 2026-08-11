#!/usr/bin/env node
// ShimSearch CLI — free searches via the public API.
// Free tier by default (IP-based 1,000 searches/day). Pass --token to search
// as a logged-in user (own quota + earn NexasCoin).
//   shimsearch "mathematics"
//   shimsearch "Lusaka" --vertical schools --limit 5
//   shimsearch "sst_..." --token sst_xxx --json
//   shimsearch --suggest "math"
//   shimsearch paper paper_1        (view a paper page)
//   shimsearch paper paper_1 --url  (print the paper page URL)

const BASE = process.env.SHIMSEARCH_URL || "https://shimsearch.onrender.com";

function parseArgs(argv) {
  const args = { vertical: "all", limit: 10, json: false, suggest: "", token: "", base: BASE, url: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--vertical") args.vertical = argv[++i] || "all";
    else if (a === "--limit") args.limit = parseInt(argv[++i]) || 10;
    else if (a === "--token") args.token = argv[++i] || "";
    else if (a === "--suggest") args.suggest = argv[++i] || "";
    else if (a === "--base") args.base = argv[++i] || BASE;
    else if (a === "--json") args.json = true;
    else if (a === "--url") args.url = true;
    else if (a.startsWith("-")) { console.error(`unknown flag: ${a}`); process.exit(1); }
    else positional.push(a);
  }
  args.q = positional.join(" ").trim();
  if (args.q.startsWith("search ")) args.q = args.q.slice(7).trim();
  args.positional = positional;
  return args;
}

async function api(path, args, headers = {}) {
  const r = await fetch(args.base + path, { headers });
  const d = await r.json().catch(() => ({}));
  return { r, d };
}

function printResults(d, args) {
  if (args.json) { console.log(JSON.stringify(d, null, 2)); return; }
  if (d.reward?.credited) console.log(`\x1b[32m+${d.reward.coins} NCN earned\x1b[0m for this search.`);
  if (d.reward?.reason === "no-nexas-wallet") console.log("Sign up on nexas-pay.onrender.com with your account email to start earning NCN per search.");
  if (!d.results || d.results.length === 0) {
    console.log(`No results for "${d.query || args.q}".`);
    return;
  }
  console.log(`About ${d.total} results${d.quota?.remaining !== undefined && d.quota.remaining !== Infinity ? ` · ${d.quota.remaining} searches left today` : ""}\n`);
  for (const r of d.results) {
    const meta = r.subject || r.name || r.title;
    const extra = r.province || r.category || "";
    console.log(`\x1b[1m${r.title || r.name}\x1b[0m`);
    console.log(`  ${meta}${r.grade ? ` (Grade ${r.grade})` : ""}${r.year ? ` · ${r.year}` : ""}${extra ? ` · ${extra}` : ""} [${r.type}]`);
    console.log("");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.suggest) {
    const { r, d } = await api(`/api/suggest?q=${encodeURIComponent(args.suggest)}`, args);
    if (!r.ok) return console.error("Suggest failed:", d.error || r.status);
    d.suggestions.forEach((s) => console.log(s));
    return;
  }

  if (args.positional[0] === "paper") {
    const id = args.positional[1] || "";
    if (!id) {
      console.error("Usage: shimsearch paper <id> [--url]");
      console.error("Find ids from search results, e.g. shimsearch 'grade 6 mathematics' --vertical papers");
      process.exit(1);
    }
    const { r, d } = await api(`/api/paper/${encodeURIComponent(id)}`, args);
    if (!r.ok) {
      console.error(`Paper "${id}" not found.`);
      process.exit(1);
    }
    if (args.url) {
      console.log(`${args.base}/paper/${encodeURIComponent(id)}`);
      return;
    }
    if (args.json) { console.log(JSON.stringify(d, null, 2)); return; }
    console.log(`\x1b[1m${d.title}\x1b[0m`);
    console.log(`  ${args.base}/paper/${encodeURIComponent(id)}`);
    console.log("");
    if (d.subject) console.log(`Subject: ${d.subject}`);
    if (d.grade) console.log(`Grade:   ${d.grade}`);
    if (d.year) console.log(`Year:    ${d.year}`);
    console.log(`Source:  ${d.source || "unknown"}`);
    console.log("");
    if (d.related?.length) {
      console.log(`\x1b[1mRelated papers\x1b[0m`);
      for (const p of d.related) {
        console.log(`  ${p.title}  (\x1b[34mshimsearch paper ${p.id}\x1b[0m)`);
      }
    }
    return;
  }

  if (!args.q) {
    console.log("Usage: shimsearch <query> [--vertical all|papers|schools|health|laws] [--limit N] [--token sst_xxx] [--json]");
    console.log("       shimsearch --suggest <prefix>");
    console.log("       shimsearch paper <id> [--url]");
    return;
  }

  const headers = args.token ? { "X-Search-Token": args.token } : {};
  const path = `/api/search?q=${encodeURIComponent(args.q)}&vertical=${encodeURIComponent(args.vertical)}&limit=${args.limit}`;
  const { r, d } = await api(path, args, headers);

  if (r.status === 429) {
    console.error("Daily free limit reached. Create an account for your own quota: shimsearch.onrender.com/register");
    process.exit(1);
  }
  if (!r.ok) {
    console.error("Search failed:", d.error || r.status);
    process.exit(1);
  }
  printResults(d, args);
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
