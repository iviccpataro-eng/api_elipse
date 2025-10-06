// src/components/SystemConfig.jsx
import React, { useState, useEffect } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function SystemConfig({ token }) {
    const [buildingName, setBuildingName] = useState("");
    const [address, setAddress] = useState("");
    const [adminName, setAdminName] = useState("");
    const [responsavelNome, setResponsavelNome] = useState("");
    const [responsavelTelefone, setResponsavelTelefone] = useState("");
    const [theme, setTheme] = useState("light");
    const [refreshTime, setRefreshTime] = useState(10);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        // Buscar config existente no backend
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE}/config/system`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setBuildingName(data.buildingName || "");
                    setAddress(data.address || "");
                    setAdminName(data.adminName || "");
                    setResponsavelNome(data.responsavelNome || "");
                    setResponsavelTelefone(data.responsavelTelefone || "");
                    setTheme(data.theme || "light");
                    setRefreshTime(data.refreshTime || 10);
                }
            } catch (err) {
                console.error("Erro ao buscar config:", err);
            }
        };
        fetchConfig();
    }, [token]);

    const handleSave = async (e) => {
        e.preventDefault();
        setMsg("");
        try {
            const res = await fetch(`${API_BASE}/config/system`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    buildingName,
                    address,
                    adminName,
                    responsavelNome,
                    responsavelTelefone,
                    theme,
                    refreshTime,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao salvar configuração.");
            setMsg("Configurações salvas com sucesso!");
        } catch (err) {
            setMsg(`Erro: ${err.message}`);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>

            <form onSubmit={handleSave} className="space-y-10 max-w-3xl">
                {/* --- Seção 1: Informações do Empreendimento --- */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">
                        Informações do Empreendimento
                    </h2>
                    <div className="space-y-4">
                        {/* Nome do Edifício */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome do Edifício
                            </label>
                            <input
                                type="text"
                                value={buildingName}
                                onChange={(e) => setBuildingName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                                placeholder="Digite o nome do edifício"
                            />
                        </div>

                        {/* Endereço */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Endereço Completo
                            </label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                                placeholder="Digite o endereço completo"
                            />
                            {address && (
                                <iframe
                                    title="Mapa do Endereço"
                                    className="mt-3 w-full h-64 rounded-lg border"
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                                        address
                                    )}&output=embed`}
                                    allowFullScreen
                                />
                            )}
                        </div>

                        {/* Nome Administradora */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome da Administradora / Empresa Ocupante
                            </label>
                            <input
                                type="text"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                                placeholder="Digite o nome da administradora"
                            />
                        </div>

                        {/* Contato do Responsável */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nome do Responsável
                                </label>
                                <input
                                    type="text"
                                    value={responsavelNome}
                                    onChange={(e) => setResponsavelNome(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Telefone do Responsável
                                </label>
                                <input
                                    type="text"
                                    value={responsavelTelefone}
                                    onChange={(e) => setResponsavelTelefone(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                                    placeholder="(99) 99999-9999"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Seção 2: Aparência e Temas --- */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Aparência e Temas</h2>
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tema
                            </label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            >
                                <option value="light">Claro</option>
                                <option value="dark">Escuro</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* --- Seção 3: Ajustes do Sistema --- */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">Ajustes do Sistema</h2>
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tempo de recarga (segundos) *
                            </label>
                            <input
                                type="number"
                                min={5}
                                value={refreshTime}
                                onChange={(e) => setRefreshTime(Number(e.target.value))}
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            />
                        </div>
                    </div>
                </section>

                {/* Botão salvar */}
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Salvar Configurações
                </button>
            </form>

            {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
        </div>
    );
}
