// App.jsx
import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import ToolsPage from "./ToolsPage";
import Navbar from "./components/Navbar";
import ArCondicionado from "./pages/ArCondicionado";
import Iluminacao from "./pages/Iluminacao";
import Eletrica from "./pages/Eletrica";
import Hidraulica from "./pages/Hidraulica";
import Dashboard from "./pages/Dashboard";
import Equipamento from "./pages/Equipamento";
import RegisterPage from "./RegisterPage";
import useAlarms from "./hooks/useAlarms";
import AlarmBanner from "./components/AlarmBanner";
import AlarmPanel from "./components/AlarmPanel";
import AlarmFab from "./components/AlarmFAB";
import AlarmHistory from "./pages/AlarmHistory";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

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
    } catch {
      setErro("Erro de conexão com o servidor");
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

/* --- Root component --- */
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("authToken");
    return t ? jwtDecode(t) : null;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invite = params.get("invite");

    // ✅ Redireciona para a tela de registro se tiver convite
    if (invite && location.pathname !== "/register") {
      navigate(`/register?invite=${invite}`, { replace: true });
    }
  }, [location, navigate]);

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

  // Se não há token e não é um link de convite, mostra login
  const params = new URLSearchParams(location.search);
  const invite = params.get("invite");
  if (!token && !invite) return <LoginPage onLogin={handleLogin} />;

  // Se o link é de convite, mostra a tela de registro
  if (invite) return <RegisterPage />;

  const { alarms, hasNew, banner, setBanner, ack, clear, clearRecognized } = useAlarms(3000);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <Navbar onLogout={handleLogout} />

      <AlarmBanner banner={banner} onClose={() => setBanner(null)} />
      <AlarmFab count={alarms.length} hasNew={hasNew} onClick={() => setShowPanel(true)} />
      <AlarmPanel
        alarms={alarms}
        open={showPanel}
        onClose={() => setShowPanel(false)}
        onAck={ack}
        onClear={clear}
        onClearRecognized={clearRecognized}
      />

      <Routes>
        {/* Página inicial */}
        <Route index element={<Dashboard token={token} />} />

        {/* 🔌 Disciplinas */}
        <Route path="/arcondicionado" element={<ArCondicionado />} />
        <Route path="/iluminacao" element={<Iluminacao />} />
        <Route path="/eletrica" element={<Eletrica />} />
        <Route path="/hidraulica" element={<Hidraulica />} />
        <Route path="/incendio" element={<div className="p-6">Incêndio</div>} />
        <Route path="/comunicacao" element={<div className="p-6">Comunicação</div>} />

        {/* Página de equipamento genérica */}
        <Route path="/arcondicionado/equipamento/:tag" element={<Equipamento />} />
        <Route path="/iluminacao/equipamento/:tag" element={<Equipamento />} />
        <Route path="/eletrica/equipamento/:tag" element={<Equipamento />} />
        <Route path="/hidraulica/equipamento/:tag" element={<Equipamento />} />

        {/* Ferramentas e admin */}
        <Route path="/tools" element={<ToolsPage token={token} user={user} />} />

        {/* Tela de registro */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Tela de Histório de Alarme */}
        <Route path="/alarms/history" element={<AlarmHistory />} />

        {/* Rota fallback */}
        <Route path="*" element={<Dashboard token={token} />} />
      </Routes>
    </>
  );
}
