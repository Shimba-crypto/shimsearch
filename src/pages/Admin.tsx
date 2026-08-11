import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Admin({ token }: { token: string }) {
  usePageTitle("Admin");
  const [stats, setStats] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const h = { "X-Search-Token": token } as any;
  async function load() {
    const r = await fetch("/api/admin/stats", { headers: h });
    if (r.status === 401 || r.status === 403) { setErr("Admin access required."); return; }
    setStats(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function reindex() {
    setMsg("indexing...");
    const r = await fetch("/api/admin/reindex", { method: "POST", headers: h });
    const d = await r.json();
    setMsg(`indexed: ${d.papers} papers, ${d.schools} schools, ${d.health} health, ${d.laws} laws`);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
      {err && <p className="mt-4 text-red-600 text-sm">{err}</p>}
      {stats && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.papers}</p><p className="text-xs text-gray-500">Papers</p></div>
          <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.schools}</p><p className="text-xs text-gray-500">Schools</p></div>
          <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.health}</p><p className="text-xs text-gray-500">Health</p></div>
          <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.laws}</p><p className="text-xs text-gray-500">Laws</p></div>
          <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{stats.users}</p><p className="text-xs text-gray-500">Users</p></div>
        </div>
      )}
      <div className="mt-6">
        <button onClick={reindex} className="bg-[#1a73e8] text-white px-4 py-2 rounded-full text-sm">Reindex from ecosystem</button>
        {msg && <p className="text-sm text-gray-500 mt-2">{msg}</p>}
      </div>
    </div>
  );
}
