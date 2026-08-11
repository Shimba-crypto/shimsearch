import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Admin() {
  usePageTitle("Admin");
  const [stats, setStats] = useState<any>(null);
  const [msg, setMsg] = useState("");

  async function load() { setStats(await fetch("/api/admin/stats").then((r) => r.json())); }
  useEffect(() => { load(); }, []);

  async function reindex() {
    setMsg("indexing...");
    const r = await fetch("/api/admin/reindex", { method: "POST" });
    const d = await r.json();
    setMsg(`indexed: ${d.papers} papers, ${d.schools} schools, ${d.health} health, ${d.laws} laws`);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
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
