import { Link, useLocation } from "react-router-dom";

export default function TopLinks({ token, user, logout }: { token?: string; user?: any; logout?: () => void }) {
  const loc = useLocation();
  const link = (to: string, label: string) => (
    <Link to={to} className={`text-[14px] hover:underline ${loc.pathname === to ? "text-[#1a73e8]" : "text-[#202124]"}`}>{label}</Link>
  );
  return (
    <div className="flex items-center gap-5">
      {link("/search", "Search")}
      {link("/pricing", "Pricing")}
      {link("/docs", "Docs")}
      {token ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm font-medium" title={user?.email || "Account"}>
            {(user?.email || "S").charAt(0).toUpperCase()}
          </div>
          {logout && <button onClick={logout} className="text-[14px] text-[#202124] hover:underline">Logout</button>}
        </div>
      ) : (
        <Link to="/login" className="bg-[#1a73e8] hover:bg-[#1765cc] text-white text-[14px] font-medium px-6 py-2 rounded-full">
          Sign in
        </Link>
      )}
    </div>
  );
}
