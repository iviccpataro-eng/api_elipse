import React, { useEffect, useMemo, useRef, useState } from "react";

// === Config ================================================================
const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

// === Helper utils ==========================================================
function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

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

function RelativeTime({ iso }) {
  if (!iso) return null;
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.round(diffMs / 60000);
  const text = mins < 1 ? "agora" : mins === 1 ? "há 1 min" : `há ${mins} min`;
  return <span title={date.toLocaleString()} className="text-xs text-gray-500">{text}</span>;
}

// === UI primitives (Tailwind) ==============================================
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-200 bg-dark shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = "" }) => (
  <div className={`p-4 border-b bg-gray-50 rounded-t-2xl ${className}`}>{children}</div>
);
const CardBody = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
const Button = ({ children, className = "", ...props }) => (
  <button className={`px-3 py-2 rounded-xl border shadow-sm hover:shadow transition text-sm ${className}`} {...props}>{children}</button>
);
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${className}`}>{children}</span>
);

// === Login page ============================================================
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
      const res = await fetch(`${API_BASE}/data`, {
        cache: "no-store",
        headers: { "Authorization": `Bearer ${token}` }
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

  const currentNode = useMemo(() => getNodeByPath(data, path) ?? data, [data, path]);

  const leafPayload = useMemo(() => {
    if (!currentNode || Array.isArray(currentNode)) return null;
    const keys = Object.keys(currentNode || {});
    if (keys.includes("info") || keys.includes("data")) {
      return {
        info: Array.isArray(currentNode.info) ? currentNode.info : [],
        data: Array.isArray(currentNode.data) ? currentNode.data : [],
      };
    }
    return null;
  }, [currentNode]);

  const childKeys = useMemo(() => {
    if (!currentNode || Array.isArray(currentNode)) return [];
    if (leafPayload) return [];
    return Object.keys(currentNode || {}).filter((k) => k.toLowerCase().includes(filter.toLowerCase()));
  }, [currentNode, leafPayload, filter]);

  const navigateTo = (k) => setPath((p) => [...p, k]);
  const navigateCrumb = (idx) => setPath((p) => p.slice(0, idx));
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
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto
            </label>
            <input
              type="number"
              min={5}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number(e.target.value) || 15)}
              className="w-20 px-2 py-2 rounded-xl border text-sm"
              title="Intervalo (s)"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Breadcrumbs */}
        <div className="mb-3 text-sm flex items-center gap-2 flex-wrap">
          <Button className="bg-gray-50" onClick={goHome}>🏠 Home</Button>
          {path.map((k, i) => (
            <React.Fragment key={i}>
              <span className="text-gray-400">/</span>
              <Button className="bg-gray-50" onClick={() => navigateCrumb(i + 1)}>{formatKeyLabel(k)}</Button>
            </React.Fragment>
          ))}
        </div>

        {loading && <div className="mb-3 text-sm text-gray-500">Carregando…</div>}
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        {leafPayload ? (
          <div className="space-y-4">
            {leafPayload.info?.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <h2 className="text-lg font-semibold">Cabeçalho</h2>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(leafPayload.info[0]).map(([k, v]) => (
                        <Badge key={k} className="bg-gray-50 border-gray-200">
                          <span className="text-gray-600 mr-1">{formatKeyLabel(k)}:</span>
                          <span className="font-medium">{String(v)}</span>
                        </Badge>
                      ))}
                    </div>
                    {leafPayload.info[0]?.["last-send"] && (
                      <div className="ml-auto">
                        <RelativeTime iso={leafPayload.info[0]["last-send"]} />
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {leafPayload.data?.filter(d => (d.name || "").toLowerCase().includes(filter.toLowerCase()))
                .map((d, idx) => {
                  const val = toNumberMaybe(d.value);
                  const nominal = toNumberMaybe(d.nominalValue);
                  const pct = val !== undefined && nominal ? Math.min(100, Math.round((val / nominal) * 100)) : undefined;
                  const showPct = typeof pct === "number" && isFinite(pct);
                  return (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{d.name}</div>
                          {String(d.hasGraph).toLowerCase() === "true" && (
                            <Badge className="bg-blue-50 border-blue-200">gráfico</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="text-2xl font-semibold">
                          {d.value}{d.EU ? <span className="text-base text-gray-500 ml-1">{` ${d.EU}`}</span> : null}
                        </div>
                        {nominal !== undefined && (
                          <div className="mt-2 text-sm text-gray-600">Nominal: <span className="font-medium">{nominal}{d.EU ? ` ${d.EU}` : ""}</span></div>
                        )}
                        {showPct && (
                          <div className="mt-3">
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div className={`h-2 rounded-full ${pct > 100 ? "bg-red-500" : pct > 90 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{pct}% do nominal</div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
            </div>
          </div>
        ) : (
          <div>
            {childKeys.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="text-sm text-gray-600">Nenhum item para exibir aqui.</div>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {childKeys.map((k) => (
                  <Card key={k}>
                    <CardHeader>
                      <div className="font-medium">{formatKeyLabel(k)}</div>
                    </CardHeader>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Abrir pasta</div>
                        <Button className="bg-white text-dark" onClick={() => navigateTo(k)}>Abrir →</Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="py-8 text-center text-xs text-gray-500">Fonte: {API_BASE}/data</footer>
    </div>
  );
}

// === Root App ==============================================================
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("authToken"));

  if (!token) {
    return <LoginPage onLogin={setToken} />;
  }

  return <Dashboard token={token} />;
}
