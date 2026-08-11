import { Link, Outlet, useLocation } from "react-router-dom";
import TopLinks from "./TopLinks";

export default function Layout({ token, user, logout }: { token?: string; user?: any; logout?: () => void }) {
  const loc = useLocation();
  const isSearch = loc.pathname.startsWith("/search");

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#202124]">
      {!isSearch && (
        <header className="flex items-center justify-end gap-4 px-4 sm:px-6 pt-4 pb-2">
          <TopLinks token={token} user={user} logout={logout} />
        </header>
      )}
      <main className="flex-1 min-w-0"><Outlet /></main>
      <footer className="bg-[#f2f2f2] border-t border-[#e4e4e4] text-[13px] text-[#70757a] mt-10">
        <div className="px-6 py-3 border-b border-[#e4e4e4]">Zambia</div>
        <div className="px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/" className="hover:text-[#202124]">About</Link>
            <Link to="/pricing" className="hover:text-[#202124]">Pricing</Link>
            <Link to="/docs" className="hover:text-[#202124]">API Docs</Link>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-auto">
            <Link to="/docs" className="hover:text-[#202124]">Privacy</Link>
            <Link to="/docs" className="hover:text-[#202124]">Terms</Link>
            <Link to="/search" className="hover:text-[#202124]">Search</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
