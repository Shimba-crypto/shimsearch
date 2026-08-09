import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Search from "./pages/Search";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("ss-token") || "");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Handle SSO redirect token
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("token");
    if (ssoToken && params.get("sso") === "1") {
      localStorage.setItem("ss-token", ssoToken);
      setToken(ssoToken);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("ss-token", token);
      fetch("/api/auth/me", { headers: { "X-Search-Token": token } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setUser(d)).catch(() => setUser(null));
    } else {
      localStorage.removeItem("ss-token");
      setUser(null);
    }
  }, [token]);

  return (
    <Routes>
      <Route element={<Layout token={token} user={user} logout={() => setToken("")} />}>
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search token={token} />} />
        <Route path="/pricing" element={<Pricing token={token} />} />
        <Route path="/login" element={<Login onLogin={(t) => setToken(t)} />} />
        <Route path="/register" element={<Register onLogin={(t) => setToken(t)} />} />
        <Route path="/dashboard" element={token ? <Dashboard token={token} user={user} /> : <Login onLogin={(t) => setToken(t)} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
