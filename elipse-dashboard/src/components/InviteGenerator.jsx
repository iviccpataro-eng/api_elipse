import React, { useState, useEffect } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function InviteGenerator() {
    const [role, setRole] = useState("user");
    const [invite, setInvite] = useState("");
    const [msg, setMsg] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setIsAdmin(payload.role === "admin");
        } catch {
            setIsAdmin(false);
        }
    }, []);

    const handleInvite = async () => {
        setMsg("");
        setInvite("");
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_BASE}/auth/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro ao gerar convite.");

            setInvite(data.link);
            setMsg("Convite gerado com sucesso!");
        } catch (err) {
            setMsg(`Erro: ${err.message}`);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(invite);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
            setCopied(false);
        }
    };

    if (!isAdmin) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-4">Gerar Convite</h1>
                <p className="text-gray-700">
                    Apenas administradores podem gerar convites.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pt-8 max-w-4xl">
            <h3 className="text-2xl font-bold mb-4">Gerar Convite</h3>

            <div className="bg-white rounded-xl shadow p-6">
                <div className="space-y-4">
                    {/* Seleção de Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Grupo do Usuário *
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        >
                            <option value="admin">Administrador</option>
                            <option value="user">Operador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="client">Cliente</option>
                            <option value="maintenance">Manutenção</option>
                        </select>
                    </div>

                    {/* Botão para gerar convite */}
                    <div className="text-right">
                        <button
                            onClick={handleInvite}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Gerar Convite
                        </button>
                    </div>

                    {/* Mensagem de status */}
                    {msg && <p className="text-sm text-gray-700">{msg}</p>}

                    {/* Exibição do link gerado */}
                    {invite && (
                        <div className="mt-4 flex items-center gap-2">
                            <input
                                type="text"
                                value={invite}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-lg shadow-sm text-sm bg-gray-50 text-gray-700"
                            />
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                {copied ? "Copiado!" : "Copiar Link"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
