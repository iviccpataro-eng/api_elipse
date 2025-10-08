// components/InviteGenerator.jsx
import React, { useState } from "react";

export default function InviteGenerator() {
    const [role, setRole] = useState("reader");
    const [invite, setInvite] = useState("");
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    async function gerarConvite() {
        setLoading(true);
        setErro("");
        setInvite("");

        const token = localStorage.getItem("authToken");
        if (!token) {
            setErro("Usuário não autenticado.");
            setLoading(false);
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/auth/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });

            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.erro || "Falha ao gerar convite.");
            }

            // 🔗 Monta o link completo para envio ao novo usuário
            const frontBase =
                import.meta.env.VITE_FRONT_URL ||
                "https://api-elipse.onrender.com";

            const fullLink = `${frontBase}/register?invite=${data.token}`;
            setInvite(fullLink);
        } catch (err) {
            console.error(err);
            setErro("Erro ao gerar convite: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg mx-auto bg-white shadow rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Gerar Convite</h2>

            <label className="block mb-4">
                <span className="text-gray-700">Função do novo usuário:</span>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
                >
                    <option value="reader">Leitor</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                </select>
            </label>

            <button
                onClick={gerarConvite}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white w-full ${loading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {loading ? "Gerando..." : "Gerar Convite"}
            </button>

            {erro && (
                <div className="mt-4 text-red-500 text-sm text-center">{erro}</div>
            )}

            {invite && (
                <div className="mt-6">
                    <p className="text-gray-700 text-sm mb-1">🔗 Link de convite gerado:</p>
                    <textarea
                        readOnly
                        value={invite}
                        className="w-full p-2 border rounded text-xs bg-gray-50"
                        rows={3}
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(invite);
                            alert("Link copiado para a área de transferência!");
                        }}
                        className="mt-2 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                    >
                        Copiar Link
                    </button>
                </div>
            )}
        </div>
    );
}
