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

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!autoRefresh) return () => { };
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchData, Math.max(5, intervalSec) * 1000);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoRefresh, intervalSec]);

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
              />{" "}
              Auto
            </label>
            <input
              type="number"
              min={5}
              value={intervalSec}
              onChange={(e) =>
                setIntervalSec(Number(e.target.value) || 15)
              }
              className="w-20 px-2 py-2 rounded-xl border text-sm"
              title="Intervalo (s)"
            />
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={onLogout}
            >
              🚪 Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto p-4">
        {loading && <div className="mb-3 text-sm text-gray-500">Carregando…</div>}
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        {data?.info && data?.data ? (
          <div className="space-y-4">
            {/* Cabeçalho */}
            {data.info.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2">Cabeçalho</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.info[0]).map(([k, v]) => (
                    <Badge key={k} className="bg-gray-50 border-gray-200">
                      <span className="text-gray-600 mr-1">
                        {formatKeyLabel(k)}:
                      </span>
                      <span className="font-medium">{String(v)}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.data
                .filter((arr) =>
                  (arr[0] || "").toLowerCase().includes(filter.toLowerCase())
                )
                .map((arr, idx) => {
                  const [name, value, unit, hasGraph, nominal] = arr;
                  const val = toNumberMaybe(value);
                  const nominalVal = toNumberMaybe(nominal);
                  const pct =
                    val !== undefined && nominalVal
                      ? Math.min(100, Math.round((val / nominalVal) * 100))
                      : undefined;
                  const showPct = typeof pct === "number" && isFinite(pct);

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl shadow-md p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{name}</div>
                        {String(hasGraph).toLowerCase() === "true" && (
                          <Badge className="bg-blue-50 border-blue-200">
                            gráfico
                          </Badge>
                        )}
                      </div>
                      <div className="text-2xl font-semibold">
                        {value}
                        {unit ? (
                          <span className="text-base text-gray-500 ml-1">
                            {` ${unit}`}
                          </span>
                        ) : null}
                      </div>
                      {nominalVal !== undefined && nominalVal !== "" && (
                        <div className="mt-2 text-sm text-gray-600">
                          Nominal:{" "}
                          <span className="font-medium">
                            {nominalVal}
                            {unit ? ` ${unit}` : ""}
                          </span>
                        </div>
                      )}
                      {showPct && (
                        <div className="mt-3">
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full ${pct > 100
                                  ? "bg-red-500"
                                  : pct > 90
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {pct}% do nominal
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-sm text-gray-600">Nenhum dado disponível.</div>
          </div>
        )}
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
