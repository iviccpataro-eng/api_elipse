import React, { useState } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function InviteGenerator({ token }) {
    const [role, setRole] = useState("user");
    const [expiresIn, setExpiresIn] = useState("1h");
    const [inviteLink, setInviteLink] = useState("");
    const [message, setMessage] = useState("");

    const handleGenerate = async () => {
        setMessage("");
        try {
            const res = await fetch(`${API_BASE}/auth/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role, expiresIn }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro ao gerar convite.");

            setInviteLink(data.link);
            setMessage("Convite gerado com sucesso!");
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Gerar Convite</h2>

            {message && <div className="mb-2 text-sm">{message}</div>}

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Perfil
                </label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-xl text-sm"
                >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700">
                    Expira em
                </label>
                <input
                    type="text"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="Ex: 1h, 7d"
                />
            </div>

            <button
                onClick={handleGenerate}
                className="w-full px-3 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
                Gerar Convite
            </button>

            {inviteLink && (
                <div className="mt-3 p-2 bg-gray-100 rounded-md break-words text-sm">
                    {inviteLink}
                </div>
            )}
        </div>
    );
}
