import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import TopLinks from "../components/TopLinks";
import { usePageTitle } from "../lib/usePageTitle";

const VERTICALS = [
  { id: "all", label: "All" },
  { id: "papers", label: "Papers" },
  { id: "schools", label: "Schools" },
  { id: "health", label: "Health" },
  { id: "laws", label: "Laws" },
];

export default function Search({ token }: { token: string }) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const vertical = params.get("v") || "all";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  usePageTitle(q ? `${q} - ShimSearch` : "Search");

  const doSearch = useCallback(async (query: string, vert: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&vertical=${vert}`, { headers: token ? { "X-Search-Token": token } : {} });
      setResults(await r.json());
    } catch { setResults({ error: "search failed" }); }
    setLoading(false);
  }, [token]);

  useEffect(() => { if (q.trim()) doSearch(q, vertical); }, [q, vertical, doSearch]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const p = new URLSearchParams({ q: input.trim() });
    if (vertical !== "all") p.set("v", vertical);
    setParams(p, { replace: false });
  }

  function setVertical(v: string) {
    const p = new URLSearchParams({ q });
    if (v !== "all") p.set("v", v);
    setParams(p);
  }

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 bg-white">
        <div className="flex items-center gap-4 sm:gap-8 px-4 sm:px-6 pt-4 pb-2 max-w-[1100px] mx-auto">
          <Link to="/" aria-label="ShimSearch home"><Logo size="sm" /></Link>
          <form onSubmit={submit} className="flex-1 max-w-[652px]">
            <div className="flex items-center gap-3 rounded-full border border-[#dfe1e5] px-4 h-11 shadow-[0_1px_1px_rgba(32,33,36,0.08)] transition-shadow hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:border-transparent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
              <input value={input} onChange={(e) => setInput(e.target.value)} aria-label="Search"
                className="flex-1 min-w-0 outline-none text-[16px] text-[#202124] bg-transparent" />
            </div>
          </form>
          <div className="hidden md:block ml-auto shrink-0"><TopLinks token={token} user={null} logout={undefined} /></div>
        </div>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="flex gap-1 border-b border-[#ebebeb]">
            {VERTICALS.map((v) => (
              <button key={v.id} onClick={() => setVertical(v.id)}
                className={`px-3 py-3 text-[14px] whitespace-nowrap border-b-[3px] -mb-px transition-colors ${vertical === v.id ? "border-[#1a73e8] text-[#1a73e8] font-medium" : "border-transparent text-[#5f6368] hover:text-[#202124]"}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-[652px] mx-auto px-4 sm:px-6 pt-4">
        {q && results && !results.error && (
          <p className="text-[13px] text-[#70757a] mb-5">
            About {results.total.toLocaleString()} results {results.tier === "free" && results.quota?.remaining !== Infinity ? `· ${results.quota.remaining.toLocaleString()} searches left today` : ""}
          </p>
        )}

        {loading && <p className="text-[14px] text-[#70757a]">Loading results...</p>}

        {q && !loading && results?.error && (
          <div className="mt-4">
            <p className="text-[20px] font-light text-[#202124]">{results.error === "quota exceeded" ? "You've used your daily free searches." : "Something went wrong."}</p>
            <p className="text-[14px] text-[#70757a] mt-2">
              {results.error === "quota exceeded"
                ? <>Upgrade to Pro for unlimited searches — <Link to="/pricing" className="text-[#1a0dab] hover:underline">view pricing</Link>.</>
                : "Please try again."}
            </p>
          </div>
        )}

        {q && !loading && results && !results.error && (
          results.results?.length === 0 ? (
            <div className="mt-4">
              <p className="text-[20px] font-light text-[#202124]">Your search - <span className="font-normal">{q}</span> - did not match any documents.</p>
              <p className="text-[15px] text-[#202124] mt-6">Suggestions:</p>
              <ul className="list-disc pl-6 text-[13px] text-[#70757a] mt-2 space-y-1">
                <li>Make sure that all words are spelled correctly.</li>
                <li>Try different keywords.</li>
                <li>Try more general keywords.</li>
                <li>Try switching to a different tab (Papers, Schools, Health, Laws).</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {results.results.map((r: any) => <Result key={r.id} r={r} q={q} />)}
            </div>
          )
        )}

        {!q && (
          <div className="mt-8 text-center text-[14px] text-[#70757a]">
            <p>Type a query above to search papers, schools, health facilities and laws.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["mathematics", "Lusaka", "hospital", "education"].map((s) => (
                <Link key={s} to={`/search?q=${encodeURIComponent(s)}`} className="google-btn">{s}</Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({ r, q }: { r: any; q: string }) {
  const u = displayUrl(r);
  const snippet = snippetFor(r, q);
  return (
    <div>
      <div className="text-[13px] leading-[20px] text-[#202124]">
        {u.domain}<span className="text-[#70757a]"> › {u.crumb}</span>
      </div>
      <h3 className="text-[20px] leading-[26px] text-[#1a0dab] mt-[2px] hover:underline cursor-pointer">
        {r.title || r.name}
      </h3>
      <p className="text-[14px] leading-[22px] text-[#4d5156] mt-1">{snippet}</p>
    </div>
  );
}

function displayUrl(r: any) {
  const domain = "shimsearch.onrender.com";
  switch (r.type) {
    case "paper": return { domain, crumb: `papers › ${r.subject || r.grade || "ECZ"}` };
    case "school": return { domain, crumb: `schools › ${r.province || "Zambia"}` };
    case "health": return { domain, crumb: `health › ${r.province || "Zambia"}` };
    case "law": return { domain, crumb: `laws › ${r.category || r.year || "Zambia"}` };
    default: return { domain, crumb: r.type || "shimsearch" };
  }
}

function snippetFor(r: any, q: string) {
  const parts: string[] = [];
  switch (r.type) {
    case "paper": {
      if (r.subject) parts.push(`ECZ ${r.subject} exam paper`);
      if (r.grade) parts.push(`Grade ${r.grade}`);
      if (r.year) parts.push(`${r.year} session`);
      break;
    }
    case "school": {
      parts.push(r.type === "school" ? "School" : "Education institution");
      if (r.district) parts.push(`Located in ${r.district}`);
      if (r.province) parts.push(`${r.province} Province`);
      break;
    }
    case "health": {
      parts.push(r.type ? `${r.type} facility` : "Health facility");
      if (r.district) parts.push(r.district);
      if (r.province) parts.push(`${r.province} Province`);
      break;
    }
    case "law": {
      parts.push(r.category ? `Zambian ${r.category} legislation` : "Zambian legislation");
      if (r.year) parts.push(`enacted ${r.year}`);
      break;
    }
  }
  if (r.source && r.source !== "unknown") parts.push(`Source: ${r.source}`);
  let s = parts.join(" · ");
  const i = s.toLowerCase().indexOf(q.toLowerCase());
  if (i > -1) {
    const start = Math.max(0, i - 40);
    const end = Math.min(s.length, i + q.length + 60);
    s = (start > 0 ? "… " : "") + s.slice(start, end) + (end < s.length ? " …" : "");
  }
  return s;
}
