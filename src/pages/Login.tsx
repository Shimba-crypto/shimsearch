import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Login({ onLogin }: { onLogin: (t: string) => void }) {
  usePageTitle("Login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
    const d = await r.json(); setLoading(false);
    if (d.token) { onLogin(d.token); window.location.href = "/dashboard"; }
    else setErr(d.error || "login failed");
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
      <p className="text-sm text-gray-500 mb-6">Log in to ShimSearch.</p>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} required placeholder="Password" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading} className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700 disabled:opacity-50">{loading ? "..." : "Log in"}</button>
      </form>
      <div className="my-4 flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"/><span className="text-xs text-gray-400">or</span><div className="flex-1 h-px bg-gray-200"/></div>
      <button onClick={ssoLogin} className="w-full border border-violet-300 text-violet-700 text-sm font-medium py-2 rounded-md hover:bg-violet-50 flex items-center justify-center gap-2">
        <span className="font-bold text-violet-600">A</span> Login with AllID
      </button>
      <p className="text-sm text-gray-500 mt-4 text-center">No account? <Link to="/register" className="text-gray-900 font-medium hover:underline">Sign up free</Link></p>
    </div>
  );
}

async function ssoLogin() {
  // Open AllID login popup
  const popup = window.open("https://allid.onrender.com/login?redirect=sso", "allid-sso", "width=450,height=600");
  // Listen for token from AllID
  window.addEventListener("message", async (e) => {
    if (e.origin !== "https://allid.onrender.com") return;
    if (e.data?.type === "allid-token" && e.data.token) {
      popup?.close();
      const r = await fetch("/api/auth/sso/allid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: e.data.token }) });
      const d = await r.json();
      if (d.token) { localStorage.setItem("ss-token", d.token); window.location.href = "/dashboard"; }
    }
  });
}
