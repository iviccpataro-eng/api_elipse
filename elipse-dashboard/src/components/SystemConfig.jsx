// components/SystemConfig.jsx
import React, { useEffect, useState } from "react";
import { useTheme } from "../components/ThemeProvider"
import "../styles/theme.css";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";
const { theme, setTheme } = useTheme();

export default function SystemConfig({ userRole }) {
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [msg, setMsg] = useState("");
    const [themePreview, setThemePreview] = useState("light-blue");
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
            setThemePreview(data.config?.theme || "light-blue");
            document.documentElement.setAttribute(
                "data-theme",
                data.config?.theme || "light-blue"
            );
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
            document.documentElement.setAttribute("data-theme", theme);
            setMsg(`Tema alterado para "${theme}"`);
        } catch (err) {
            console.error("[SystemConfig] Erro ao atualizar tema:", err);
            setErro("Erro ao salvar tema.");
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    };

    const temas = [
        { nome: "Azul Claro", valor: "light-blue" },
        { nome: "Azul Escuro", valor: "dark-blue" },
        { nome: "Verde Claro", valor: "light-green" },
        { nome: "Verde Escuro", valor: "dark-green" },
        { nome: "Rosa Claro", valor: "light-rose" },
        { nome: "Escuro Neutro", valor: "dark" },
    ];

    return (
        <div
            className="max-w-3xl mx-auto rounded-xl shadow p-6 text-left transition-colors duration-300"
            style={{
                backgroundColor: "var(--bg-card)",
                color: "var(--text-color)",
            }}
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

                        <label className="block text-sm font-medium">Nome do Edifício</label>
                        <input
                            type="text"
                            name="building_name"
                            value={config.building_name || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full border rounded p-2"
                            disabled={!isAdmin}
                        />

                        <label className="block text-sm font-medium mt-3">Endereço</label>
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

                        <label className="block text-sm font-medium mt-3">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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

                    </section>

                    {/* --- Seção: Temas --- */}
                    <section>
                        <h3 className="text-lg font-semibold mb-2">🎨 Temas e Aparência</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            {temas.map((t) => (
                                <button
                                    key={t.valor}
                                    type="button"
                                    onClick={() => setTheme("dark-blue")}
                                    disabled={!isAdmin}
                                    className={`p-3 rounded-lg border transition-all ${themePreview === t.valor
                                        ? "border-[var(--accent)] ring-2 ring-[var(--accent)]"
                                        : "border-[var(--border-color)] hover:ring-1"
                                        }`}
                                    style={{
                                        backgroundColor: "var(--bg-card)",
                                        color: "var(--text-color)",
                                    }}
                                >
                                    {t.nome}
                                </button>
                            ))}
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
                            style={{
                                backgroundColor: "var(--accent)",
                                color: "white",
                            }}
                            className="px-4 py-2 rounded hover:opacity-90 transition"
                        >
                            {saving ? "Salvando..." : "Salvar Configuração"}
                        </button>
                    )}
                </form>
            )}
        </div>
    );
}
