import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout({ token, user, logout }: { token?: string; user?: any; logout?: () => void }) {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const nav = (to: string, label: string) => (
    <Link to={to} onClick={() => setOpen(false)} className={`block px-4 py-2.5 rounded-md text-[14px] transition ${loc.pathname === to ? "bg-gray-900 text-white font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}>{label}</Link>
  );
  return (
    <div className="min-h-screen flex bg-white text-gray-900">
      <div className={`fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 border-b md:hidden bg-gray-50 border-gray-200`}>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-gray-200" aria-label="Menu">
          {open ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
               : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>}
        </button>
        <Link to="/" className="text-base font-semibold tracking-tight">Shim<span className="text-blue-600">Search</span></Link>
      </div>
      {open && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed md:static z-20 top-0 left-0 h-full w-64 shrink-0 border-r flex-col flex transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} bg-gray-50 border-gray-200`}>
        <div className="px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-base font-semibold tracking-tight">Shim<span className="text-blue-600">Search</span></Link>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg md:hidden hover:bg-gray-200"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav("/", "Home")}
          {nav("/search", "Search")}
          {nav("/pricing", "Pricing")}
          {nav("/docs", "API Docs")}
          {user?.role === "admin" && nav("/admin", "Admin")}
        </nav>
        <div className="px-5 py-4 border-t border-gray-200 text-xs text-gray-400">
          {token ? (<div><p className="truncate text-gray-700">{user?.email}</p><button onClick={logout} className="text-red-600 hover:underline mt-1">Logout</button></div>)
                : (<Link to="/login" className="text-gray-700 hover:text-gray-900">Login / Register</Link>)}
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto pt-16 md:pt-0"><Outlet /></main>
    </div>
  );
}
