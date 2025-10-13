import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SystemConfig() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("system");

    // ------------------ Configurações do Sistema ------------------
    const [systemConfig, setSystemConfig] = useState({
        nomeEmpreendimento: "",
        enderecoEmpreendimento: "",
        nomeAdministradora: "",
        nomeResponsavel: "",
        telefoneResponsavel: "",
        tempoRecarga: 30,
        temaSelecionado: "Padrão",
    });

    // ------------------ Configurações de Usuário ------------------
    const [userConfig, setUserConfig] = useState({
        nomeCompleto: "",
        matricula: "",
        username: "",
        grupos: "operator",
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
    });

    // Mock de role do usuário (depois substituir por payload do token)
    const [role, setRole] = useState("admin");

    useEffect(() => {
        // Simular carregamento de dados iniciais do usuário
        const savedUser = JSON.parse(localStorage.getItem("userInfo"));
        if (savedUser && savedUser.user) {
            setUserConfig((u) => ({ ...u, username: savedUser.user }));
            setRole(savedUser.role || "reader");
        }
    }, []);

    const handleSaveSystem = () => {
        alert("Configurações do sistema salvas (simulação).");
    };

    const handleSaveUser = () => {
        if (userConfig.novaSenha && userConfig.novaSenha !== userConfig.confirmarSenha) {
            alert("As senhas não coincidem!");
            return;
        }
        alert("Configurações de usuário salvas (simulação).");
    };

    const handleGenerateInvite = () => {
        alert("Convite gerado (simulação).");
    };

    const handleUsernameChange = (value) => {
        // Bloquear caracteres especiais e limitar a 10
        const sanitized = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
        setUserConfig({ ...userConfig, username: sanitized });
    };

    // ------------------ Renderização ------------------
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Configurações</h1>

            {/* Abas principais */}
            <div className="flex border-b mb-4">
                {[
                    { id: "system", label: "Configurações do Sistema" },
                    { id: "user", label: "Configurações de Usuário" },
                    { id: "invite", label: "Gerar Convite", restricted: true },
                ].map((tab) =>
                    !tab.restricted || role === "admin" ? (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ) : null
                )}
            </div>

            {/* ------------------ Aba: Configurações do Sistema ------------------ */}
            {activeTab === "system" && (
                <div className="space-y-8">
                    {/* Características do Sistema */}
                    <section className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">
                            Características do Sistema
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">
                                    Nome do Empreendimento
                                </label>
                                <input
                                    type="text"
                                    value={systemConfig.nomeEmpreendimento}
                                    onChange={(e) =>
                                        setSystemConfig({
                                            ...systemConfig,
                                            nomeEmpreendimento: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">
                                    Endereço do Empreendimento
                                </label>
                                <input
                                    type="text"
                                    value={systemConfig.enderecoEmpreendimento}
                                    onChange={(e) =>
                                        setSystemConfig({
                                            ...systemConfig,
                                            enderecoEmpreendimento: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                        </div>

                        {systemConfig.enderecoEmpreendimento && (
                            <div className="mt-4">
                                <iframe
                                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                                        systemConfig.enderecoEmpreendimento
                                    )}&output=embed`}
                                    className="w-full h-64 rounded-lg border"
                                    allowFullScreen
                                    loading="lazy"
                                    title="Localização do Empreendimento"
                                ></iframe>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium">
                                    Nome da Administradora
                                </label>
                                <input
                                    type="text"
                                    value={systemConfig.nomeAdministradora}
                                    onChange={(e) =>
                                        setSystemConfig({
                                            ...systemConfig,
                                            nomeAdministradora: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium">
                                        Supervisor/Responsável
                                    </label>
                                    <input
                                        type="text"
                                        value={systemConfig.nomeResponsavel}
                                        onChange={(e) =>
                                            setSystemConfig({
                                                ...systemConfig,
                                                nomeResponsavel: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Telefone</label>
                                    <input
                                        type="tel"
                                        value={systemConfig.telefoneResponsavel}
                                        onChange={(e) =>
                                            setSystemConfig({
                                                ...systemConfig,
                                                telefoneResponsavel: e.target.value,
                                            })
                                        }
                                        className="mt-1 w-full border rounded p-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Ajustes do Sistema */}
                    <section className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Ajustes do Sistema</h2>
                        <label className="block text-sm font-medium">
                            Tempo de Recarga (segundos)
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={systemConfig.tempoRecarga}
                            onChange={(e) =>
                                setSystemConfig({
                                    ...systemConfig,
                                    tempoRecarga: parseInt(e.target.value, 10),
                                })
                            }
                            className="mt-1 w-40 border rounded p-2"
                        />
                    </section>

                    {/* Temas e Aparência */}
                    <section className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Temas e Aparência</h2>
                        <label className="block text-sm font-medium">
                            Seletor de Tema (temporário)
                        </label>
                        <select
                            value={systemConfig.temaSelecionado}
                            onChange={(e) =>
                                setSystemConfig({
                                    ...systemConfig,
                                    temaSelecionado: e.target.value,
                                })
                            }
                            className="mt-1 w-60 border rounded p-2"
                        >
                            <option>Padrão</option>
                            <option>Claro</option>
                            <option>Escuro</option>
                            <option>Alto Contraste</option>
                        </select>
                    </section>

                    <div className="text-right">
                        <button
                            onClick={handleSaveSystem}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            )}

            {/* ------------------ Aba: Configurações de Usuário ------------------ */}
            {activeTab === "user" && (
                <div className="space-y-8">
                    <section className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">
                            Características de Usuário
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    value={userConfig.nomeCompleto}
                                    onChange={(e) =>
                                        setUserConfig({
                                            ...userConfig,
                                            nomeCompleto: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Matrícula</label>
                                <input
                                    type="text"
                                    value={userConfig.matricula}
                                    onChange={(e) =>
                                        setUserConfig({
                                            ...userConfig,
                                            matricula: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium">
                                    Nome de Usuário (máx. 10 caracteres)
                                </label>
                                <input
                                    type="text"
                                    value={userConfig.username}
                                    onChange={(e) => handleUsernameChange(e.target.value)}
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                            {role === "admin" && (
                                <div>
                                    <label className="block text-sm font-medium">
                                        Grupo de Usuário
                                    </label>
                                    <select
                                        value={userConfig.grupos}
                                        onChange={(e) =>
                                            setUserConfig({ ...userConfig, grupos: e.target.value })
                                        }
                                        className="mt-1 w-full border rounded p-2"
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="operator">Operador</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="maintenence">Manutenção</option>
                                        <option value="client">Cliente</option>
                                        <option value="reader">Leitor</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Mudança de Senhas */}
                    <section className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Mudança de Senha</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">
                                    Senha Atual
                                </label>
                                <input
                                    type="password"
                                    value={userConfig.senhaAtual}
                                    onChange={(e) =>
                                        setUserConfig({
                                            ...userConfig,
                                            senhaAtual: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Nova Senha</label>
                                <input
                                    type="password"
                                    value={userConfig.novaSenha}
                                    onChange={(e) =>
                                        setUserConfig({
                                            ...userConfig,
                                            novaSenha: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">
                                    Confirmar Senha
                                </label>
                                <input
                                    type="password"
                                    value={userConfig.confirmarSenha}
                                    onChange={(e) =>
                                        setUserConfig({
                                            ...userConfig,
                                            confirmarSenha: e.target.value,
                                        })
                                    }
                                    className="mt-1 w-full border rounded p-2"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="text-right">
                        <button
                            onClick={handleSaveUser}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            )}

            {/* ------------------ Aba: Gerar Convite ------------------ */}
            {activeTab === "invite" && role === "admin" && (
                <div className="bg-white p-4 rounded-lg shadow space-y-4">
                    <h2 className="text-xl font-semibold">Gerar Convite</h2>
                    <div>
                        <label className="block text-sm font-medium">
                            Tipo de Grupo de Usuário
                        </label>
                        <select
                            value={userConfig.grupos}
                            onChange={(e) =>
                                setUserConfig({ ...userConfig, grupos: e.target.value })
                            }
                            className="mt-1 w-60 border rounded p-2"
                        >
                            <option value="admin">Administrador</option>
                            <option value="operator">Operador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="maintenence">Manutenção</option>
                            <option value="client">Cliente</option>
                            <option value="reader">Leitor</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateInvite}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Gerar Convite
                    </button>
                    <div className="border rounded p-3 bg-gray-50">
                        <p className="text-sm break-all">
                            https://api-elipse.vercel.app/register?invite=EXEMPLO_DE_TOKEN
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
