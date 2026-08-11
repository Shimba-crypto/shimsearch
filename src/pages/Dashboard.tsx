import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Dashboard({ token, user, setToken }: { token: string; user: any; setToken?: (t: string) => void; }) {
  usePageTitle("Dashboard");
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Normal auth: try cookie first, then token
    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) { setToken?.(d.token || ""); setLoading(false); }
        else if (token) {
          fetch("/api/user/me", { headers: { "X-User-Token": token } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d2) => { if (d2) setToken?.(d2.token || ""); setLoading(false); })
            .catch(() => setLoading(false));
        } else { setLoading(false); }
      })
      .catch(() => setLoading(false));
  }, [token, setToken]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/billing/subscription", { headers: { "X-User-Token": token } }).then((r) => r.json()).then(setSub).catch(() => {});
    fetch("/api/billing/usage", { headers: { "X-User-Token": token } }).then((r) => r.json()).then(setUsage).catch(() => {});
  }, [token]);

  if (loading) return <div className="max-w-md mx-auto px-6 py-24 text-center"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="text-sm text-gray-500 mt-1">{user?.email || "..."}</p>
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{sub?.tier || "free"}</p><p className="text-xs text-gray-500">Tier</p></div>
        <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{usage?.count || 0}</p><p className="text-xs text-gray-500">Searches today</p></div>
        <div className="border rounded-lg p-4 text-center"><p className="text-2xl font-bold">{sub?.tier === "pro" ? "∞" : 1000 - (usage?.count || 0)}</p><p className="text-xs text-gray-500">Remaining</p></div>
      </div>
      {sub?.tier !== "pro" && (
        <div className="mt-6 border border-blue-200 bg-blue-50 rounded-lg p-4">
          <p className="font-medium text-blue-900">Upgrade to Pro</p>
          <p className="text-sm text-blue-700 mt-1">Unlimited searches + API access for K50/month in NexasCoin.</p>
          <Link to="/pricing" className="inline-block mt-3 text-sm bg-gray-900 text-white px-4 py-2 rounded-md">View Plans</Link>
        </div>
      )}
    </div>
  );
}
