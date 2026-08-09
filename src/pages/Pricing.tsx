import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Pricing({ token }: { token: string }) {
  usePageTitle("Pricing");
  const [pricing, setPricing] = useState<any>(null);
  useEffect(() => { fetch("/api/pricing").then((r) => r.json()).then(setPricing).catch(() => {}); }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold">Pricing</h1>
      <p className="text-sm text-gray-500 mt-1">Free for students. Pro for power users. API for developers.</p>
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {pricing && Object.entries(pricing).map(([tier, p]: [string, any]) => (
          <div key={tier} className={`border rounded-lg p-5 ${tier === "pro" ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"}`}>
            <h3 className="font-semibold capitalize">{tier}</h3>
            <p className="text-2xl font-bold mt-2">{p.price}</p>
            <p className="text-xs text-gray-500 mt-1">{p.limit}</p>
            {tier !== "free" && <Link to={token ? "/dashboard" : "/login"} className="mt-4 block text-center text-sm bg-gray-900 text-white py-2 rounded-md">{token ? "Manage" : "Get Started"}</Link>}
          </div>
        ))}
      </div>
    </div>
  );
}
