import { usePageTitle } from "../lib/usePageTitle";

export default function Docs() {
  usePageTitle("API Docs");
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold">API Documentation</h1>
      <p className="text-sm text-gray-500 mt-1">Search everything Zambian education via REST API or the free CLI.</p>
      <div className="mt-6 space-y-4">
        <Section title="CLI (free)" method="SH" path="npm install -g shimsearch">
          {`shimsearch "mathematics"                 # free search, no key needed
shimsearch "Lusaka" --vertical schools --limit 5
shimsearch "papers" --token sst_xxx --json        # logged-in: earns NexasCoin
shimsearch --suggest "math"`}
        </Section>
        <Section title="Earn NexasCoin" method="NCN" path="0.001 NCN per search">
          {`Logged-in users earn 0.001 NexasCoin per search (max 100 rewarded/day).
Rewards only go to accounts with a Nexas wallet (same email) at
https://nexas-pay.onrender.com — no wallet, no rewards.`}
        </Section>
        <Section title="Search" method="GET" path="/api/search?q=mathematics&vertical=papers">
          {`{ "results": [...], "total": 42, "tier": "free", "reward": { "credited": true, "coins": 0.001 } }`}
        </Section>
        <Section title="Auto-complete" method="GET" path="/api/suggest?q=math">
          {`{ "suggestions": ["Mathematics", "Maths Paper 1", ...] }`}
        </Section>
        <Section title="Pricing" method="GET" path="/api/pricing">
          {`{ "free": { "price": 0, "limit": "1000/day" }, "pro": { "price": "50 NCN/month" }, "api": { "price": "0.01 NCN/query" } }`}
        </Section>
        <Section title="Register" method="POST" path="/api/auth/register">
          {`Body: { "name": "Jane", "email": "jane@school.com", "password": "Secure123!" }`}
        </Section>
        <Section title="Login" method="POST" path="/api/auth/login">
          {`Body: { "email": "jane@school.com", "password": "Secure123!" } → { "token": "sst_xxx", "user": {...} }`}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, method, path, children }: any) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2"><span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded">{method}</span><code className="text-sm font-medium">{path}</code></div>
      <p className="text-sm font-medium mt-2">{title}</p>
      <pre className="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg mt-2 overflow-x-auto">{children}</pre>
    </div>
  );
}
