import { readJSON, writeJSON } from "./storage.js";
import { sanitize } from "./security.js";

// ── Search index (in-memory + persisted) ─────────────
let INDEX = null;

function ensureIndex() {
  if (INDEX) return INDEX;
  INDEX = readJSON("search-index.json") || { papers: [], schools: [], health: [], laws: [], content: [] };
  return INDEX;
}

export function saveIndex() { writeJSON("search-index.json", INDEX); }

// ── Subject inference ────────────────────────────────
const SUBJECTS = [
  "Mathematics", "English Language", "Science", "Biology", "Physics", "Chemistry",
  "Geography", "History", "Civic Education", "Religious Education", "Computer Studies",
  "Home Economics", "Art and Design", "Music", "Physical Education", "Social Studies",
  "Agricultural Science", "Commerce", "Accounts", "Business Studies", "Integrated Science",
  "Environmental Science", "Design and Technology", "Literature", "French", "Technology Studies",
];

function inferSubject(title) {
  if (!title) return "";
  const t = String(title);
  return SUBJECTS.find((s) => t.toLowerCase().includes(s.toLowerCase())) || "";
}

export { inferSubject };

// ── Indexing ─────────────────────────────────────────
export function indexPapers(papers) {
  ensureIndex();
  for (const p of papers) {
    if (!INDEX.papers.some((x) => x.id === p.id)) {
      INDEX.papers.push({
        id: p.id || `paper_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: (p.title || "").slice(0, 200),
        subject: (p.subject || inferSubject(p.title) || "").slice(0, 50),
        grade: parseInt(p.grade) || 0,
        year: parseInt(p.year) || 0,
        source: p.source || "unknown",
        type: "paper",
      });
    }
  }
  saveIndex();
  return INDEX.papers.length;
}

export function indexSchools(schools) {
  ensureIndex();
  for (const s of schools) {
    if (!INDEX.schools.some((x) => x.id === s.id)) {
      INDEX.schools.push({
        id: s.id || `school_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: (s.name || "").slice(0, 200),
        province: (s.province || "").slice(0, 50),
        district: (s.district || "").slice(0, 50),
        amenity: (s.amenity || "").slice(0, 50),
        operator: (s.operator || "").slice(0, 120),
        level: (s.level || "").slice(0, 50),
        type: s.type || "school",
        lat: parseFloat(s.lat) || 0,
        lon: parseFloat(s.lon) || 0,
      });
    }
  }
  saveIndex();
  return INDEX.schools.length;
}

export function indexHealth(facilities) {
  ensureIndex();
  for (const f of facilities) {
    if (!INDEX.health.some((x) => x.id === f.id)) {
      INDEX.health.push({
        id: f.id || `health_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: (f.name || "").slice(0, 200),
        type: (f.type || "").slice(0, 50),
        province: (f.province || "").slice(0, 50),
        district: (f.district || "").slice(0, 50),
        lat: parseFloat(f.lat) || 0,
        lon: parseFloat(f.lon) || 0,
      });
    }
  }
  saveIndex();
  return INDEX.health.length;
}

export function indexLaws(laws) {
  ensureIndex();
  for (const l of laws) {
    if (!INDEX.laws.some((x) => x.id === l.id)) {
      INDEX.laws.push({
        id: l.id || `law_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: (l.title || "").slice(0, 200),
        year: parseInt(l.year) || 0,
        category: (l.category || "").slice(0, 50),
        type: "law",
      });
    }
  }
  saveIndex();
  return INDEX.laws.length;
}

// ── Search ───────────────────────────────────────────
export function search(query, { vertical = "all", limit = 20, offset = 0 } = {}) {
  ensureIndex();
  const q = sanitize(query).toLowerCase();
  if (!q) return { results: [], total: 0 };

  const terms = q.split(/\s+/).filter((t) => t.length > 1);
  let results = [];

  const searchIn = (items, fields) => {
    return items
      .map((item) => {
        let score = 0;
        for (const term of terms) {
          for (const field of fields) {
            const val = String(item[field] || "").toLowerCase();
            if (val === term) score += 10;
            else if (val.startsWith(term)) score += 5;
            else if (val.includes(term)) score += 2;
          }
        }
        return { ...item, _score: score };
      })
      .filter((item) => item._score > 0)
      .sort((a, b) => b._score - a._score);
  };

  if (vertical === "all" || vertical === "papers") {
    results = results.concat(searchIn(INDEX.papers, ["title", "subject"]));
  }
  if (vertical === "all" || vertical === "schools") {
    results = results.concat(searchIn(INDEX.schools, ["name", "province", "district", "amenity", "operator", "level"]));
  }
  if (vertical === "all" || vertical === "health") {
    results = results.concat(searchIn(INDEX.health, ["name", "type", "province"]));
  }
  if (vertical === "all" || vertical === "laws") {
    results = results.concat(searchIn(INDEX.laws, ["title", "category"]));
  }

  results.sort((a, b) => b._score - a._score);
  const total = results.length;
  results = results.slice(offset, offset + limit);
  results.forEach((r) => delete r._score);

  return { results, total, query: q, vertical };
}

export function suggest(query) {
  ensureIndex();
  const q = sanitize(query).toLowerCase();
  if (!q) return [];
  const suggestions = new Set();
  for (const item of [...INDEX.papers, ...INDEX.schools, ...INDEX.health, ...INDEX.laws]) {
    const title = item.title || item.name || "";
    if (title.toLowerCase().includes(q)) suggestions.add(title);
    if (suggestions.size >= 8) break;
  }
  return [...suggestions];
}

export function getItem(id) {
  ensureIndex();
  if (!id) return null;
  for (const list of [INDEX.papers, INDEX.schools, INDEX.health, INDEX.laws]) {
    const found = list.find((x) => x.id === id);
    if (found) return found;
  }
  return null;
}

export function relatedPapers(paper, limit = 6) {
  ensureIndex();
  const sameSubject = paper.subject
    ? INDEX.papers.filter((p) => p.id !== paper.id && p.subject === paper.subject)
    : [];
  const others = sameSubject.length >= limit
    ? sameSubject
    : sameSubject.concat(
        INDEX.papers.filter((p) => p.id !== paper.id && p.grade === paper.grade)
      );
  const seen = new Set();
  const out = [];
  for (const p of others) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

export function getStats() {
  ensureIndex();
  return {
    papers: INDEX.papers.length,
    schools: INDEX.schools.length,
    health: INDEX.health.length,
    laws: INDEX.laws.length,
    total: INDEX.papers.length + INDEX.schools.length + INDEX.health.length + INDEX.laws.length,
  };
}

// ── Seed from ecosystem ──────────────────────────────
async function fetchList(url) {
  const r = await fetch(url);
  if (!r.ok) return [];
  const d = await r.json();
  return Array.isArray(d) ? d : d.results || [];
}

export async function seedFromEcosystem() {
  // Pull from ShimbaData public API (no limit — index the full datasets)
  try {
    const data = await fetchList("https://shimbadata.onrender.com/api/sd/papers");
    indexPapers(data.map((p) => ({ ...p, source: "ShimbaData" })));
  } catch {}

  try {
    const schools = await fetchList("https://shimbadata.onrender.com/api/sd/schools?lat=-13.5&lon=28.0&radiusKm=900");
    indexSchools(schools.map((s) => ({ ...s, type: "school" })));
  } catch {}

  try {
    const health = await fetchList("https://shimbadata.onrender.com/api/sd/health-facilities?lat=-13.5&lon=28.0&radiusKm=900");
    indexHealth(health.map((h) => ({ ...h, type: h.type || "clinic" })));
  } catch {}

  try {
    const laws = await fetchList("https://shimbadata.onrender.com/api/sd/laws");
    indexLaws(laws);
  } catch {}
}
