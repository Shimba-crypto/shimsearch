import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { usePageTitle } from "../lib/usePageTitle";

export default function Landing() {
  usePageTitle("");
  const [q, setQ] = useState("");
  const nav = useNavigate();

  function go(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="flex flex-col items-center px-4 pt-[10vh] sm:pt-[14vh]">
      <Logo size="lg" />
      <p className="text-[14px] text-[#4d5156] mt-3">Search everything Zambian education.</p>
      <form onSubmit={go} className="w-full max-w-[584px] mt-7">
        <div className="flex items-center gap-3 rounded-full border border-[#dfe1e5] px-5 h-12 shadow-none transition-shadow hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus-within:border-transparent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search ECZ papers, schools, health facilities, laws..."
            className="flex-1 min-w-0 outline-none text-[16px] text-[#202124] bg-transparent"
            aria-label="Search"
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#4285f4"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z"/></svg>
        </div>
        <div className="flex justify-center gap-3 mt-8">
          <button type="submit" className="google-btn">ShimSearch Search</button>
          <button type="button" onClick={() => nav("/search?q=mathematics")} className="google-btn">I'm Feeling Lucky</button>
        </div>
      </form>
      <p className="text-[14px] text-[#4d5156] mt-8">
        New here? <Link to="/register" className="text-[#1a0dab] hover:underline">Create a free account</Link> · <Link to="/docs" className="text-[#1a0dab] hover:underline">API docs</Link>
      </p>
      <p className="text-[13px] text-[#70757a] mt-10 text-center max-w-md">
        ECZ past papers · Schools · Health facilities · Zambian laws — free tier: 1,000 searches/day.
      </p>
    </div>
  );
}
