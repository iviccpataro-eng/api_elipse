// LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
            const resp = await fetch("https://api-elipse.onrender.com/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user, senha }),
            });

            let data = {};
            try {
                data = await resp.json();
            } catch {
                data = {};
            }

            if (resp.ok && data.token) {
                // ✅ salvar token no localStorage
                localStorage.setItem("token", data.token);

                // ✅ redirecionar para o dashboard
                navigate("/dashboard");
            } else {
                setErro(data.erro || "Falha desconhecida no login");
            }
        } catch (e) {
            console.error(e);
            setErro("Erro ao conectar ao servidor");
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
                    />
                </label>

                <label className="block mb-4">
                    <span className="text-gray-700">Senha</span>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-500"
                    />
                </label>

                <button
                    type="submit"
                    className={`w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    disabled={loading}
                >
                    {loading ? "Carregando..." : "Entrar"}
                </button>
            </form>
        </div>
    );
}
