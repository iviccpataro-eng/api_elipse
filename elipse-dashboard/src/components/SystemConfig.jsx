import React, { useState, useEffect } from "react";
const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function SystemConfig() {
    const [config, setConfig] = useState({
        buildingname: "",
        buildingaddress: "",
        adminenterprise: "",
        adminname: "",
        admincontact: "",
    });
    const [refreshTime, setRefreshTime] = useState(10);
    const [theme, setTheme] = useState("light");
    const [msg, setMsg] = useState("");
    const [userRole, setUserRole] = useState("");
    const [username, setUsername] = useState("");
    const [isEditable, setIsEditable] = useState(false);

    // === Carregar dados do usuário ===
    useEffect(() => {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                setUserRole(parsed.role || "");
                setUsername(parsed.user || "");
                setIsEditable(["admin", "supervisor"].includes(parsed.role));
            } catch {
                console.warn("Falha ao ler informações do usuário.");
            }
        }
    }, []);

    // === Carregar configuração do sistema ===
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const loadConfig = async () => {
            try {
                const res = await fetch(`${API_BASE}/config/system`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const text = await res.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch {
                    console.error("Resposta inesperada da API:", text);
                    return;
                }

                if (data.ok && data.config) {
                    setConfig(data.config);
                }

                // Carregar preferências pessoais
                const userRes = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = await userRes.json();
                if (userData.ok && userData.usuario) {
                    if (userData.usuario.refreshtime)
                        setRefreshTime(userData.usuario.refreshtime);
                    if (userData.usuario.usertheme)
                        setTheme(userData.usuario.usertheme);
                }
            } catch (err) {
                console.error("Erro ao carregar configurações:", err);
            }
        };
        loadConfig();
    }, []);

    // === Salvar configurações ===
    const handleSave = async () => {
        setMsg("");
        const token = localStorage.getItem("authToken");
        if (!token) return alert("Usuário não autenticado.");

        try {
            let res, data;

            if (isEditable) {
                // Admin / Supervisor → Salva tudo (sistema + preferências)
                const systemSave = fetch(`${API_BASE}/config/system`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(config),
                });

                const prefsSave = fetch(`${API_BASE}/auth/update-profile`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        username,
                        refreshtime: refreshTime,
                        usertheme: theme,
                    }),
                });

                const [sysRes, prefRes] = await Promise.all([systemSave, prefsSave]);
                const sysData = await sysRes.json();
                const prefData = await prefRes.json();

                if (!sysRes.ok || !sysData.ok)
                    throw new Error(sysData.erro || "Erro ao salvar configurações.");
                if (!prefRes.ok || !prefData.ok)
                    throw new Error(prefData.erro || "Erro ao salvar preferências.");

                setMsg("Configurações do sistema e preferências salvas com sucesso!");
            } else {
                // Outros usuários → Salva apenas preferências pessoais
                res = await fetch(`${API_BASE}/auth/update-profile`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        username,
                        refreshtime: refreshTime,
                        usertheme: theme,
                    }),
                });
                data = await res.json();
                if (!res.ok || !data.ok) {
                    const msg = data.erro || `Erro HTTP ${res.status}`;
                    throw new Error(msg);
                }
                setMsg("Preferências pessoais salvas com sucesso!");
            }
        } catch (err) {
            console.error("Erro ao salvar:", err);
            setMsg("Erro ao salvar configurações: " + err.message);
        }
    };

    const inputClass =
        "mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm " +
        (isEditable ? "bg-white" : "bg-gray-100 cursor-not-allowed text-gray-600");

    return (
        <div className="space-y-10 pt-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>
            {/* === Características do Sistema === */}
            <section className="bg-white p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold mb-4">
                    Características do Sistema
                </h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Nome do Empreendimento
                    </label>
                    <input
                        type="text"
                        value={config.buildingname}
                        onChange={(e) =>
                            setConfig({ ...config, buildingname: e.target.value })
                        }
                        className={inputClass}
                        disabled={!isEditable}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Endereço do Empreendimento
                    </label>
                    <input
                        type="text"
                        value={config.buildingaddress}
                        onChange={(e) =>
                            setConfig({ ...config, buildingaddress: e.target.value })
                        }
                        className={inputClass}
                        disabled={!isEditable}
                    />
                </div>
                {config.buildingaddress && (
                    <div className="mt-4">
                        <iframe
                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                                config.buildingaddress
                            )}&output=embed`}
                            className="w-full h-64 rounded-lg border"
                            allowFullScreen
                            loading="lazy"
                            title="Localização do Empreendimento"
                        ></iframe>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Nome da Administradora
                    </label>
                    <input
                        type="text"
                        value={config.adminenterprise}
                        onChange={(e) =>
                            setConfig({ ...config, adminenterprise: e.target.value })
                        }
                        className={inputClass}
                        disabled={!isEditable}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Supervisor/Responsável
                        </label>
                        <input
                            type="text"
                            value={config.adminname}
                            onChange={(e) =>
                                setConfig({ ...config, adminname: e.target.value })
                            }
                            className={inputClass}
                            disabled={!isEditable}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            value={config.admincontact}
                            onChange={(e) =>
                                setConfig({ ...config, admincontact: e.target.value })
                            }
                            className={inputClass}
                            disabled={!isEditable}
                        />
                    </div>
                </div>
            </section>
            {/* === Ajustes do Sistema === */}
            <section className="bg-white p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold mb-4">Ajustes do Sistema</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Tempo de Recarga (segundos)
                    </label>
                    <input
                        type="number"
                        min={5}
                        value={refreshTime}
                        onChange={(e) => setRefreshTime(Number(e.target.value))}
                        className="mt-1 block w-40 px-3 py-2 border rounded-lg shadow-sm text-sm"
                    />
                </div>
            </section>
            {/* === Temas e Aparência === */}
            <section className="bg-white p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold mb-4">Temas e Aparência</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Seletor de Tema
                    </label>
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="mt-1 block w-60 px-3 py-2 border rounded-lg shadow-sm text-sm"
                    >
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                        <option value="contrast">Alto Contraste</option>
                    </select>
                </div>
            </section>
            <div className="text-right">
                <button
                    onClick={handleSave}
                    className={`px-4 py-2 rounded-lg text-white ${isEditable
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-green-600 hover:bg-green-700"
                        }`}
                >
                    {isEditable
                        ? "Salvar Configurações do Sistema"
                        : "Salvar Preferências Pessoais"}
                </button>
            </div>
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            {!isEditable && (
                <p className="text-sm text-gray-500 italic">
                    Somente leitura para configurações do sistema — você pode alterar
                    apenas suas preferências pessoais.
                </p>
            )}
        </div>
    );
}
