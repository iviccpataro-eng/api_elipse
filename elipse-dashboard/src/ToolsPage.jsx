import React, { useState } from "react";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function ToolsPage({ token, user }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("user");
    const [expiresIn, setExpiresIn] = useState("1h");
    const [inviteLink, setInviteLink] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerateInvite = async () => {
        setError("");
        setInviteLink("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email, role, expiresIn }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro ao gerar convite");

            setInviteLink(data.link);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Ferramentas do Sistema</h1>

            {/* Painel de Convite só aparece para admin */}
            {user?.role === "admin" && (
                <div className="mb-6 bg-white shadow rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-3">Gerar Convite</h2>
                    <div className="space-y-3">
                        <input
                            type="email"
                            placeholder="E-mail (opcional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl"
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl"
                        >
                            <option value="user">Usuário</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Validade (ex: 1h, 24h, 7d)"
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl"
                        />
                        <button
                            onClick={handleGenerateInvite}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-3 py-2 rounded-xl hover:bg-blue-700"
                        >
                            {loading ? "Gerando..." : "Gerar Convite"}
                        </button>
                    </div>

                    {error && <p className="text-red-500 mt-3">{error}</p>}
                    {inviteLink && (
                        <div className="mt-4">
                            <p className="text-green-600">Convite gerado com sucesso!</p>
                            <a
                                href={inviteLink}
                                className="text-blue-600 underline break-all"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {inviteLink}
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Outras ferramentas (visíveis a todos) */}
            <div className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">Outras Ferramentas</h2>
                <p className="text-gray-600">Em breve você poderá configurar tempo de scan, relatórios, etc.</p>
            </div>
        </div>
    );
}
