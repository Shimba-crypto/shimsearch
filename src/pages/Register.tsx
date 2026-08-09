import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Register({ onLogin }: { onLogin: (t: string) => void }) {
  usePageTitle("Sign up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password: pass }) });
    const d = await r.json(); setLoading(false);
    if (d.user) {
      const lr = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
      const ld = await lr.json();
      if (ld.token) { onLogin(ld.token); window.location.href = "/dashboard"; }
    } else setErr(d.error || "signup failed");
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-semibold mb-1">Create account</h1>
      <p className="text-sm text-gray-500 mb-6">Free forever. 1,000 searches/day.</p>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={8} placeholder="Password (8+ chars, upper+lower+digit+special)" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading} className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700 disabled:opacity-50">{loading ? "..." : "Sign up"}</button>
      </form>
      <p className="text-sm text-gray-500 mt-4 text-center">Have an account? <Link to="/login" className="text-gray-900 font-medium hover:underline">Log in</Link></p>
    </div>
  );
}
