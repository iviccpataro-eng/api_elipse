import React, { useEffect, useRef, useState } from "react";

// === Config ================================================================
const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

// === Helpers ===============================================================
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
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${className}`}
  >
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
  const [path, setPath] = useState([]); // caminho atual
  const [filter, setFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalSec, setIntervalSec] = useState(15);
  const timerRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (!token) throw new Error("JWT ausente, faça login novamente");

      const res = await fetch(`${API_BASE}/dados`, {
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

  // nó atual (sub-árvore)
  const currentNode = useMemo(() => getNodeByPath(data, path) ?? data, [data, path]);

  // checa se é nó final (tem info+data)
  const isLeafNode = currentNode && typeof currentNode === "object" &&
    (Array.isArray(currentNode.info) || Array.isArray(currentNode.data));

  const goHome = () => setPath([]);
  const navigateTo = (k) => setPath((p) => [...p, k]);
  const navigateCrumb = (idx) => setPath((p) => p.slice(0, idx));

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

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-3 text-sm flex items-center gap-2 flex-wrap">
          <Button className="bg-gray-50" onClick={goHome}>🏠 Home</Button>
          {path.map((k, i) => (
            <React.Fragment key={i}>
              <span className="text-gray-400">/</span>
              <Button className="bg-gray-50" onClick={() => navigateCrumb(i + 1)}>
                {formatKeyLabel(k)}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {loading && <div className="mb-3 text-sm text-gray-500">Carregando…</div>}
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        {/* Se for nó final: mostra info + data */}
        {isLeafNode ? (
          <LeafNode node={currentNode} filter={filter} />
        ) : (
          <FolderNode node={currentNode} filter={filter} onOpen={navigateTo} />
        )}
      </div>
    </div>
  );
}

// === Renderização de pasta =================================================
function FolderNode({ node, filter, onOpen }) {
  if (!node || typeof node !== "object") return null;
  const keys = Object.keys(node).filter((k) =>
    k.toLowerCase().includes(filter.toLowerCase())
  );

  if (keys.length === 0) {
    return <div className="text-gray-500">Nenhum item encontrado.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {keys.map((k) => (
        <div key={k} className="rounded-xl border bg-white shadow p-4">
          <div className="font-medium">{formatKeyLabel(k)}</div>
          <Button className="mt-2 bg-blue-50" onClick={() => onOpen(k)}>Abrir →</Button>
        </div>
      ))}
    </div>
  );
}

// === Renderização de folha (equipamento) ==================================
function LeafNode({ node, filter }) {
  const info = node.info || [];
  const data = node.data || [];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data
          .filter((d) => (d[0] || "").toLowerCase().includes(filter.toLowerCase()))
          .map((d, idx) => {
            const [name, value, unit, hasGraph, nominal] = d;
            const valNum = toNumberMaybe(value);
            const nomNum = toNumberMaybe(nominal);
            const pct = valNum !== undefined && nomNum ? Math.round((valNum / nomNum) * 100) : null;

            return (
              <div key={idx} className="rounded-xl border bg-white shadow p-4">
                <div className="font-medium">{name}</div>
                <div className="text-2xl font-semibold">
                  {value}{unit ? ` ${unit}` : ""}
                </div>
                {pct !== null && (
                  <div className="mt-2 text-sm text-gray-600">
                    {pct}% do nominal
                  </div>
                )}
              </div>
            );
          })}
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
