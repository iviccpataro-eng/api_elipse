// App.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

import ToolsPage from "./ToolsPage";
import Navbar from "./components/Navbar";
import Eletrica from "./pages/Eletrica"; // ✅ Nova página integrada

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

/* --- Funções utilitárias --- */
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

function getNodeByPath(obj, path) {
  let ref = obj;
  for (const key of path) {
    if (
      !ref ||
      typeof ref !== "object" ||
      !Object.prototype.hasOwnProperty.call(ref, key)
    ) {
      return undefined;
    }
    ref = ref[key];
  }
  return ref;
}

/* --- UI primitives --- */
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-3 py-2 rounded-xl border shadow-sm hover:shadow transition text-sm ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${className}`}
  >
    {children}
  </span>
);

/* --- Login --- */
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
        const decoded = jwtDecode(data.token);
        localStorage.setItem("userInfo", JSON.stringify(decoded));
        onLogin(data.token, decoded);
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

/* --- Dashboard --- */
function Dashboard({ token }) {
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
      const fixedToken = import.meta.env.VITE_REACT_TOKEN;
      const res = await fetch(`${API_BASE}/dados`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${fixedToken}` },
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

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!autoRefresh) return () => { };
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchData, Math.max(5, intervalSec) * 1000);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoRefresh, intervalSec]);

  const currentNode = useMemo(
    () => getNodeByPath(data, path) ?? data,
    [data, path]
  );
  const isLeafNode =
    currentNode &&
    typeof currentNode === "object" &&
    (Array.isArray(currentNode.info) || Array.isArray(currentNode.data));

  const goHome = () => setPath([]);
  const navigateTo = (k) => setPath((p) => [...p, k]);
  const navigateCrumb = (idx) => setPath((p) => p.slice(0, idx));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-3 text-sm flex items-center gap-2 flex-wrap">
          <Button className="bg-gray-50" onClick={goHome}>
            🏠 Home
          </Button>
          {path.map((k, i) => (
            <React.Fragment key={i}>
              <span className="text-gray-400">/</span>
              <Button
                className="bg-gray-50"
                onClick={() => navigateCrumb(i + 1)}
              >
                {formatKeyLabel(k)}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {loading && (
          <div className="mb-3 text-sm text-gray-500">Carregando…</div>
        )}
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        {isLeafNode ? (
          <LeafNode node={currentNode} filter={filter} />
        ) : (
          <FolderNode node={currentNode} filter={filter} onOpen={navigateTo} />
        )}
      </div>
    </div>
  );
}

/* --- Folder / Leaf renderers --- */
function FolderNode({ node, filter, onOpen }) {
  if (!node || typeof node !== "object") return null;
  const keys = Object.keys(node).filter((k) =>
    k.toLowerCase().includes(filter.toLowerCase())
  );
  if (keys.length === 0)
    return <div className="text-gray-500">Nenhum item encontrado.</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {keys.map((k) => (
        <div key={k} className="rounded-xl border bg-white shadow p-4">
          <div className="font-medium">{formatKeyLabel(k)}</div>
          <Button className="mt-2 bg-blue-50" onClick={() => onOpen(k)}>
            Abrir →
          </Button>
        </div>
      ))}
    </div>
  );
}

function LeafNode({ node }) {
  const info = node.info || [];
  return (
    <div className="space-y-4">
      {info.length > 0 && (
        <div className="rounded-xl border bg-white shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Cabeçalho</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(info[0]).map(([k, v]) => (
              <Badge key={k} className="bg-gray-50 border-gray-200">
                <span className="text-gray-600 mr-1">{formatKeyLabel(k)}:</span>
                <span className="font-medium">{String(v)}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Root component --- */
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("authToken");
    return t ? jwtDecode(t) : null;
  });

  const handleLogin = (tk, decodedUser) => {
    localStorage.setItem("authToken", tk);
    setToken(tk);
    setUser(decodedUser || jwtDecode(tk));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <Routes>
        {/* Página inicial (Dashboard geral) */}
        <Route index element={<Dashboard token={token} />} />

        {/* 🔌 Disciplinas */}
        <Route path="eletrica" element={<Eletrica />} />
        <Route path="dashboard/el" element={<Eletrica />} />

        <Route path="ar" element={<div className="p-6">Ar Condicionado</div>} />
        <Route path="iluminacao" element={<div className="p-6">Iluminação</div>} />
        <Route path="hidraulica" element={<div className="p-6">Hidráulica</div>} />
        <Route path="incendio" element={<div className="p-6">Incêndio</div>} />
        <Route path="comunicacao" element={<div className="p-6">Comunicação</div>} />

        <Route path="tools" element={<ToolsPage token={token} user={user} />} />
        <Route path="*" element={<Dashboard token={token} />} />
      </Routes>
    </>
  );
}
