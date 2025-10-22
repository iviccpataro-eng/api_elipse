// App.jsx
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import ToolsPage from "./ToolsPage";
import Navbar from "./components/Navbar";
import Eletrica from "./pages/Eletrica";
import Dashboard from "./pages/Dashboard"; // 🔹 Dashboard movido para arquivo separado

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

  if (!token) return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <Routes>
        {/* Página inicial */}
        <Route index element={<Dashboard token={token} />} />

        {/* 🔌 Disciplinas */}
        <Route path="/eletrica" element={<Eletrica />} />
        <Route path="/arcondicionado" element={<div className="p-6">Ar Condicionado</div>} />
        <Route path="/iluminacao" element={<div className="p-6">Iluminação</div>} />
        <Route path="/hidraulica" element={<div className="p-6">Hidráulica</div>} />
        <Route path="/incendio" element={<div className="p-6">Incêndio</div>} />
        <Route path="/comunicacao" element={<div className="p-6">Comunicação</div>} />

        <Route path="/tools" element={<ToolsPage token={token} user={user} />} />
        <Route path="*" element={<Dashboard token={token} />} />

        {/* Página de equipamento genérica */}
        <Route path="/eletrica/equipamento/:tag" element={<Equipamento />} />
      </Routes>
    </>
  );
}
