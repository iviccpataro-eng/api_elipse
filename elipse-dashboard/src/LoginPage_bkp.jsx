// LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

// Timeout de segurança para conexões lentas (Render free)
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 15000 } = options; // 15 segundos
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err.name === "AbortError"
            ? new Error("Tempo limite excedido. Servidor demorando para responder.")
            : err;
    }
}

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
            const resp = await fetchWithTimeout(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user, senha }),
                timeout: 15000,
            });

            let data = {};
            try {
                data = await resp.json();
            } catch {
                data = {};
            }

            if (resp.ok && data.token) {
                // Decodifica o token recebido
                const decoded = jwtDecode(data.token);

                // Impede login com o token fixo (Elipse)
                if (
                    decoded.user === "react-dashboard" ||
                    decoded.role === "reader"
                ) {
                    throw new Error(
                        "Token inválido para login. Este token é reservado ao Elipse."
                    );
                }

                // Salva o token de usuário
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("userInfo", JSON.stringify(decoded));

                navigate("/dashboard");
            } else {
                setErro(data.erro || "Falha ao autenticar. Verifique usuário e senha.");
            }
        } catch (e) {
            console.error(e);
            if (e.message.includes("Tempo limite"))
                setErro("Servidor está iniciando. Tente novamente em alguns segundos.");
            else setErro("Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded shadow-md w-full max-w-sm"
            >
                <h2 className="text-2xl font-bold mb-6 text-center">Entrar</h2>

                {erro && <div className="text-red-500 mb-4 text-center">{erro}</div>}

                <label className="block mb-2">
                    <span className="text-gray-700">Usuário</span>
                    <input
                        type="text"
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
                        required
                    />
                </label>

                <label className="block mb-4">
                    <span className="text-gray-700">Senha</span>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
                        required
                    />
                </label>

                <button
                    type="submit"
                    className={`w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    disabled={loading}
                >
                    {loading ? "Conectando..." : "Entrar"}
                </button>

                <p className="mt-4 text-center text-sm text-gray-500">
                    {loading
                        ? "Aguarde, verificando o servidor..."
                        : "Use suas credenciais de acesso"}
                </p>
            </form>
        </div>
    );
}
