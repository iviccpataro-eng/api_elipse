// components/SystemConfig.jsx
import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function SystemConfig({ userRole }) {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");

    const isAdmin = userRole === "admin";

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        setLoading(true);
        setErro("");
        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_BASE}/config/system`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.erro || "Falha ao buscar configuração");
            setConfig(data.config || {});
        } catch (err) {
            console.error(err);
            setErro("Falha ao buscar configuração");
        } finally {
            setLoading(false);
        }
    }

    async function salvarConfig(e) {
        e.preventDefault();
        if (!isAdmin) return alert("Apenas administradores podem salvar configurações.");

        setSaving(true);
        setMsg("");
        setErro("");

        try {
            const token = localStorage.getItem("authToken");
            const res = await fetch(`${API_BASE}/config/system`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(config),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro ao salvar");
            setMsg(data.msg || "Configuração salva com sucesso!");
        } catch (err) {
            console.error(err);
            setErro("Erro ao salvar configuração.");
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Configurações do Sistema</h2>

            {erro && <p className="text-red-500 mb-3">{erro}</p>}
            {msg && <p className="text-green-600 mb-3">{msg}</p>}
            {loading ? (
                <p>Carregando dados...</p>
            ) : (
                <form onSubmit={salvarConfig} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nome do Edifício</label>
                        <input
                            type="text"
                            name="building_name"
                            value={config.building_name || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            disabled={!isAdmin}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Endereço</label>
                        <input
                            type="text"
                            name="address"
                            value={config.address || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            disabled={!isAdmin}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Administradora</label>
                        <input
                            type="text"
                            name="admin_name"
                            value={config.admin_name || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            disabled={!isAdmin}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Responsável</label>
                        <input
                            type="text"
                            name="responsavel_nome"
                            value={config.responsavel_nome || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            disabled={!isAdmin}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Telefone do Responsável</label>
                        <input
                            type="text"
                            name="responsavel_telefone"
                            value={config.responsavel_telefone || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            disabled={!isAdmin}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">
                            Intervalo de Atualização (s)
                        </label>
                        <input
                            type="number"
                            name="refresh_time"
                            value={config.refresh_time || 10}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            disabled={!isAdmin}
                        />
                    </div>

                    {isAdmin && (
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            {saving ? "Salvando..." : "Salvar Configuração"}
                        </button>
                    )}
                </form>
            )}
        </div>
    );
}
