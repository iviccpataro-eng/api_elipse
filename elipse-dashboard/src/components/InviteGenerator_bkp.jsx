// components/InviteGenerator.jsx
import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function InviteGenerator() {
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("reader");
    const [token, setToken] = useState("");
    const [msg, setMsg] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const isAdmin =
        (() => {
            try {
                const user = JSON.parse(localStorage.getItem("userInfo"));
                return user?.role === "admin";
            } catch {
                return false;
            }
        })();

    async function gerarConvite(e) {
        e.preventDefault();
        if (!isAdmin) {
            return setErro("Apenas administradores podem gerar convites.");
        }

        setLoading(true);
        setErro("");
        setMsg("");
        setToken("");

        try {
            const tokenAuth = localStorage.getItem("authToken");
            const res = await fetch(`${API_BASE}/auth/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenAuth}`,
                },
                body: JSON.stringify({ username, role }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Falha ao gerar convite");

            setMsg("Convite gerado com sucesso!");
            setToken(data.token || "");
        } catch (err) {
            console.error(err);
            setErro("Erro ao gerar convite.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-4">Gerar Convite</h2>

            {erro && <p className="text-red-500 mb-3">{erro}</p>}
            {msg && <p className="text-green-600 mb-3">{msg}</p>}

            <form onSubmit={gerarConvite} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Usuário convidado
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-1 block w-full border rounded p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Tipo de acesso
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-1 block w-full border rounded p-2"
                    >
                        <option value="reader">Leitor</option>
                        <option value="operator">Operador</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {loading ? "Gerando..." : "Gerar Convite"}
                </button>
            </form>

            {token && (
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                        Token de Convite:
                    </h3>
                    <textarea
                        value={token}
                        readOnly
                        className="w-full h-24 border rounded p-2 bg-gray-100 text-xs"
                    />
                </div>
            )}
        </div>
    );
}
