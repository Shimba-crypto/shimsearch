import { useState, useEffect } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Search({ token }: { token: string }) {
  usePageTitle("Search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [vertical, setVertical] = useState("all");

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&vertical=${vertical}`, { headers: token ? { "X-Search-Token": token } : {} });
      setResults(await r.json());
    } catch { setResults({ error: "search failed" }); }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold">Search</h1>
      <form onSubmit={doSearch} className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search papers, schools, laws..." className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm" />
        <select value={vertical} onChange={(e) => setVertical(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
          <option value="all">All</option><option value="papers">Papers</option><option value="schools">Schools</option><option value="health">Health</option><option value="laws">Laws</option>
        </select>
        <button disabled={loading} className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm">{loading ? "..." : "Search"}</button>
      </form>
      {results && (
        <div className="mt-6">
          <p className="text-sm text-gray-500">{results.total} results {results.tier ? `(${results.tier} tier)` : ""}</p>
          <div className="mt-3 space-y-2">
            {results.results?.map((r: any) => (
              <div key={r.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <p className="font-medium">{r.title || r.name}</p>
                <p className="text-xs text-gray-500">{r.subject || r.type || r.province} {r.year ? `· ${r.year}` : ""} {r.source ? `· ${r.source}` : ""}</p>
              </div>
            ))}
            {results.results?.length === 0 && <p className="text-sm text-gray-500">No results found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
