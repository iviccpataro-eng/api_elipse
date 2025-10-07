// LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { apiFetch } from "./api";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function LoginPage() {
    const [user, setUser] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            // 🔐 Requisição de login
            const resp = await apiFetch(`${API_BASE}/auth/login`, {
                method: "POST",
                body: JSON.stringify({ user, senha }),
            });

            let data = {};
            try {
                data = await resp.json();
            } catch {
                data = {};
            }

            if (resp.ok && data.token && data.token !== "undefined") {
                try {
                    // ✅ Valida o token imediatamente
                    const decoded = jwtDecode(data.token);

                    // Armazena token e info do usuário
                    localStorage.setItem("authToken", data.token);
                    localStorage.setItem("userInfo", JSON.stringify(decoded));

                    // Redireciona
                    navigate("/dashboard");
                } catch (err) {
                    console.warn("[Login] Token inválido recebido:", err);
                    setErro("Token inválido recebido do servidor.");
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("userInfo");
                }
            } else {
                setErro(data.erro || "Usuário ou senha incorretos");
            }
        } catch (e) {
            console.error("[Login] Erro de conexão:", e);
            setErro("Erro ao conectar ao servidor");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm"
            >
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Entrar no Sistema
                </h2>

                {erro && (
                    <div className="text-red-500 mb-4 text-center border border-red-300 bg-red-50 rounded p-2">
                        {erro}
                    </div>
                )}

                <label className="block mb-2">
                    <span className="text-gray-700 font-medium">Usuário</span>
                    <input
                        type="text"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        autoComplete="username"
                    />
                </label>

                <label className="block mb-4">
                    <span className="text-gray-700 font-medium">Senha</span>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        autoComplete="current-password"
                    />
                </label>

                <button
                    type="submit"
                    className={`w-full py-2 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all ${loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    disabled={loading}
                >
                    {loading ? "Verificando..." : "Entrar"}
                </button>
            </form>
        </div>
    );
}
