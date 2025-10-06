// src/components/SystemConfig.jsx
import React, { useState, useEffect } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function SystemConfig({ token, user }) {
    const [buildingName, setBuildingName] = useState("");
    const [address, setAddress] = useState("");
    const [adminName, setAdminName] = useState("");
    const [responsavelNome, setResponsavelNome] = useState("");
    const [responsavelTelefone, setResponsavelTelefone] = useState("");
    const [theme, setTheme] = useState("light");
    const [refreshTime, setRefreshTime] = useState(10);
    const [modifiedBy, setModifiedBy] = useState("");
    const [updatedAt, setUpdatedAt] = useState(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Determina se é admin
    const isAdmin = user?.role === "admin";

    // --- Buscar configuração existente ---
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE}/config/system`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const c = data.config || {};
                    setBuildingName(c.building_name || "");
                    setAddress(c.address || "");
                    setAdminName(c.admin_name || "");
                    setResponsavelNome(c.responsavel_nome || "");
                    setResponsavelTelefone(c.responsavel_telefone || "");
                    setRefreshTime(c.refresh_time || 10);
                    setModifiedBy(c.modified_by || "");
                    setUpdatedAt(c.updated_at ? new Date(c.updated_at) : null);
                } else {
                    console.error("Falha ao buscar configuração");
                }
            } catch (err) {
                console.error("[SystemConfig] Erro ao buscar config:", err);
            }
        };
        fetchConfig();
    }, [token]);

    // --- Salvar nova configuração ---
    const handleSave = async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/config/system`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    building_name: buildingName,
                    address,
                    admin_name: adminName,
                    responsavel_nome: responsavelNome,
                    responsavel_telefone: responsavelTelefone,
                    refresh_time: refreshTime,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro ao salvar configuração.");
            setMsg("✅ Configurações salvas com sucesso!");
            setModifiedBy(user?.user || "admin");
            setUpdatedAt(new Date());
        } catch (err) {
            setMsg(`❌ Erro: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Estilo padrão de campo (com bloqueio dinâmico) ---
    const fieldStyle = (extra = "") =>
        `mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm ${extra} ${!isAdmin ? "bg-gray-100 cursor-not-allowed" : ""
        }`;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>

            <form
                onSubmit={handleSave}
                className="space-y-10 max-w-3xl bg-white p-6 rounded-xl shadow"
            >
                {/* --- Seção 1: Informações do Empreendimento --- */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
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
                                disabled={!isAdmin}
                                className={fieldStyle()}
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
                                disabled={!isAdmin}
                                className={fieldStyle()}
                                placeholder="Digite o endereço completo do empreendimento"
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
                                disabled={!isAdmin}
                                className={fieldStyle()}
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
                                    disabled={!isAdmin}
                                    className={fieldStyle()}
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
                                    onChange={(e) =>
                                        setResponsavelTelefone(e.target.value)
                                    }
                                    disabled={!isAdmin}
                                    className={fieldStyle()}
                                    placeholder="(99) 99999-9999"
                                />
                            </div>
                        </div>

                        {/* Última modificação */}
                        {modifiedBy && (
                            <p className="text-xs text-gray-500 mt-2">
                                Última modificação por <b>{modifiedBy}</b>{" "}
                                {updatedAt && (
                                    <>
                                        em{" "}
                                        {updatedAt.toLocaleString("pt-BR", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })}
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                </section>

                {/* --- Seção 2: Aparência e Temas --- */}
                <section>
                    <hr className="my-6" />
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        Aparência e Temas
                    </h2>
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tema
                            </label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                disabled={!isAdmin}
                                className={fieldStyle()}
                            >
                                <option value="light">Claro</option>
                                <option value="dark">Escuro</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* --- Seção 3: Ajustes do Sistema --- */}
                <section>
                    <hr className="my-6" />
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        Ajustes do Sistema
                    </h2>
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
                                disabled={!isAdmin}
                                className={fieldStyle()}
                            />
                        </div>
                    </div>
                </section>

                {/* Botão salvar */}
                {isAdmin && (
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-white font-medium transition ${loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                        >
                            {loading ? "Salvando..." : "Salvar Configurações"}
                        </button>
                        {msg && (
                            <span
                                className={`text-sm ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {msg}
                            </span>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
