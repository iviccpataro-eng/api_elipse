// components/SystemConfig.jsx
import React, { useEffect, useState } from "react";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function SystemConfig({ userRole }) {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [themePreview, setThemePreview] = useState("slate"); // tema visual aplicado
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
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Falha ao buscar configuração");
            setConfig(data.config || {});
            setThemePreview(data.config?.theme || "slate");
        } catch (err) {
            console.error(err);
            setErro("Falha ao buscar configuração");
        } finally {
            setLoading(false);
        }
    }

    async function salvarConfig(e) {
        e.preventDefault();
        if (!isAdmin)
            return alert("Apenas administradores podem salvar configurações.");

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

    async function atualizarTema(theme) {
        try {
            const token = localStorage.getItem("authToken");
            await fetch(`${API_BASE}/auth/update-theme`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ theme }),
            });
            setConfig((prev) => ({ ...prev, theme }));
            setThemePreview(theme);
            setMsg(`Tema atualizado para "${theme}"`);
        } catch (err) {
            console.error("[SystemConfig] Erro ao atualizar tema:", err);
            setErro("Erro ao salvar tema.");
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    };

    const themeColors = [
        "slate",
        "blue",
        "emerald",
        "violet",
        "rose",
        "amber",
        "cyan",
        "neutral",
    ];

    // Mapeamento de cores para pré-visualização
    const themeClasses = {
        slate: "bg-slate-50 text-slate-800",
        blue: "bg-blue-50 text-blue-800",
        emerald: "bg-emerald-50 text-emerald-800",
        violet: "bg-violet-50 text-violet-800",
        rose: "bg-rose-50 text-rose-800",
        amber: "bg-amber-50 text-amber-800",
        cyan: "bg-cyan-50 text-cyan-800",
        neutral: "bg-neutral-50 text-neutral-800",
    };

    return (
        <div
            className={`max-w-3xl mx-auto rounded-xl shadow p-6 text-left transition-colors duration-300 ${themeClasses[themePreview] || "bg-white text-gray-800"
                }`}
        >
            <h2 className="text-2xl font-bold mb-4">Configurações do Sistema</h2>

            {erro && <p className="text-red-500 mb-3">{erro}</p>}
            {msg && <p className="text-green-600 mb-3">{msg}</p>}

            {loading ? (
                <p>Carregando dados...</p>
            ) : (
                <form onSubmit={salvarConfig} className="space-y-8">
                    {/* --- Seção: Dados do Edifício --- */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2">🏢 Dados do Edifício</h3>

                        <div className="mb-3">
                            <label className="block text-sm font-medium">
                                Nome do Edifício
                            </label>
                            <input
                                type="text"
                                name="building_name"
                                value={config.building_name || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full border rounded p-2"
                                disabled={!isAdmin}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="block text-sm font-medium">Endereço</label>
                            <input
                                type="text"
                                name="address"
                                value={config.address || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full border rounded p-2"
                                disabled={!isAdmin}
                            />
                            {config.address && (
                                <iframe
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                                        config.address
                                    )}&output=embed`}
                                    width="100%"
                                    height="250"
                                    className="rounded-xl mt-3 border"
                                    loading="lazy"
                                ></iframe>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">
                                    Gerente/Contato Responsável
                                </label>
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
                                <label className="block text-sm font-medium">Telefone</label>
                                <input
                                    type="text"
                                    name="responsavel_telefone"
                                    value={config.responsavel_telefone || ""}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border rounded p-2"
                                    disabled={!isAdmin}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium">
                                Empresa Administradora
                            </label>
                            <input
                                type="text"
                                name="admin_name"
                                value={config.admin_name || ""}
                                onChange={handleChange}
                                className="mt-1 block w-full border rounded p-2"
                                disabled={!isAdmin}
                            />
                        </div>
                    </section>

                    {/* --- Seção: Temas e Aparência --- */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2">🎨 Temas e Aparência</h3>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {themeColors.map((cor) => (
                                <button
                                    key={cor}
                                    type="button"
                                    className={`h-8 w-8 rounded-full border-2 transition transform ${themePreview === cor
                                        ? "scale-110 border-black"
                                        : "border-transparent hover:scale-105"
                                        } bg-${cor}-500`}
                                    onClick={() => atualizarTema(cor)}
                                    disabled={!isAdmin}
                                    title={`Tema ${cor}`}
                                ></button>
                            ))}
                        </div>

                        <div className="mt-4 p-4 border rounded-lg bg-white/60">
                            <p className="text-sm">
                                <strong>Pré-visualização:</strong> O painel acima já reflete o tema
                                selecionado (<em>{themePreview}</em>).
                            </p>
                        </div>
                    </section>

                    {/* --- Seção: Ajustes do Sistema --- */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2">⚙️ Ajustes do Sistema</h3>
                        <label className="block text-sm font-medium">
                            Intervalo de Atualização (segundos)
                        </label>
                        <input
                            type="number"
                            name="refresh_time"
                            value={config.refresh_time || 10}
                            onChange={handleChange}
                            className="mt-1 block w-40 border rounded p-2"
                            disabled={!isAdmin}
                        />
                    </section>

                    {isAdmin && (
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                            {saving ? "Salvando..." : "Salvar Configuração"}
                        </button>
                    )}
                </form>
            )}
        </div>
    );
}
