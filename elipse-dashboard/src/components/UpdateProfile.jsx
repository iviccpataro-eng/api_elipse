// components/UpdateProfile.jsx
import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function UpdateProfile() {
    const [perfil, setPerfil] = useState({});
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        carregarPerfil();
    }, []);

    async function carregarPerfil() {
        setLoading(true);
        setErro("");
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro ao buscar perfil");
            setPerfil(data.usuario);
        } catch (err) {
            console.error(err);
            setErro("Falha ao carregar dados do perfil");
        } finally {
            setLoading(false);
        }
    }

    async function salvarAlteracoes(e) {
        e.preventDefault();
        setSaving(true);
        setErro("");
        setMsg("");

        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_BASE}/auth/update-theme`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ theme: perfil.theme }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Falha ao atualizar tema");
            setMsg(data.msg || "Tema atualizado com sucesso!");
        } catch (err) {
            console.error(err);
            setErro("Erro ao salvar alterações.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-4">Configurações de Usuário</h2>

            {erro && <p className="text-red-500 mb-2">{erro}</p>}
            {msg && <p className="text-green-600 mb-2">{msg}</p>}

            {loading ? (
                <p>Carregando perfil...</p>
            ) : (
                <form onSubmit={salvarAlteracoes} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Usuário
                        </label>
                        <input
                            type="text"
                            value={perfil.username || ""}
                            className="mt-1 block w-full border rounded p-2 bg-gray-100"
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={perfil.fullname || ""}
                            className="mt-1 block w-full border rounded p-2 bg-gray-100"
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Cargo / Role
                        </label>
                        <input
                            type="text"
                            value={perfil.rolename || ""}
                            className="mt-1 block w-full border rounded p-2 bg-gray-100"
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Tema do Sistema
                        </label>
                        <select
                            value={perfil.theme || "light"}
                            onChange={(e) =>
                                setPerfil((p) => ({ ...p, theme: e.target.value }))
                            }
                            className="mt-1 block w-full border rounded p-2"
                        >
                            <option value="light">Claro</option>
                            <option value="dark">Escuro</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        {saving ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </form>
            )}
        </div>
    );
}
