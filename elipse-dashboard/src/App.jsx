import React, { useEffect, useMemo, useRef, useState } from "react";

// === Config ================================================================
const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

// === Helpers ===============================================================
function getNodeByPath(obj, path) {
  let ref = obj;
  for (const key of path) {
    if (!ref || !Object.prototype.hasOwnProperty.call(ref, key)) return undefined;
    ref = ref[key];
  }
  return ref;
}

function formatKeyLabel(k) {
  if (!k) return "";
  return k.replace(/_/g, " ").replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
}

function toNumberMaybe(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}

// === UI Components =========================================================
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-3 py-2 rounded-xl border shadow-sm hover:shadow transition text-sm ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${className}`}>
    {children}
  </span>
);

// === Login Page ============================================================
function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, senha }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("authToken", data.token);
        onLogin(data.token);
      } else {
        setErro(data.erro || "Falha ao autenticar");
      }
    } catch (err) {
      setErro("Erro de conexão com servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        {erro && <p className="text-red-500 mb-2 text-center">{erro}</p>}
        <input
          type="text"
          placeholder="Usuário"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {loading ? "Carregando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

// === Dashboard =============================================================
function Dashboard({ token, onLogout }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [path, setPath] = useState([]);
  const [filter, setFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalSec, setIntervalSec] = useState(15);
  const timerRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (!token) throw new Error("JWT ausente, faça login novamente");

      const res = await fetch(`${API_BASE}/data`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json || {});
    } catch (e) {
      setError("Falha ao buscar dados da API.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);
  useEffect(() => {
    if (!autoRefresh) return () => { };
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchData, Math.max(5, intervalSec) * 1000);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoRefresh, intervalSec]);

  const goHome = () => setPath([]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-dark/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold">TJRJ - Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar itens"
              className="px-3 py-2 rounded-xl border text-sm"
            />
            <Button onClick={fetchData}>🔄 Atualizar</Button>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              /> Auto
            </label>
            <input
              type="number"
              min={5}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value) || 15)}
              className="w-20 px-2 py-2 rounded-xl border text-sm"
              title="Intervalo (s)"
            />
            <Button className="bg-red-500 text-white hover:bg-red-600" onClick={onLogout}>
              🚪 Logout
            </Button>
          </div>
        </div>
      </div>

      {/* resto do conteúdo do Dashboard permanece igual */}
      <div className="max-w-7xl mx-auto p-4">
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {/* renderização dos dados */}
      </div>
    </div>
  );
}

// === Root App ==============================================================
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("authToken"));

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
  };

  if (!token) {
    return <LoginPage onLogin={setToken} />;
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
}
