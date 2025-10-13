import React, { useState, useEffect } from "react";

export default function SystemConfig() {
    const [nomeEmpreendimento, setNomeEmpreendimento] = useState("");
    const [enderecoEmpreendimento, setEnderecoEmpreendimento] = useState("");
    const [nomeAdministradora, setNomeAdministradora] = useState("");
    const [nomeResponsavel, setNomeResponsavel] = useState("");
    const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
    const [refreshTime, setRefreshTime] = useState(10);
    const [theme, setTheme] = useState("light");

    // Carregar configurações salvas
    useEffect(() => {
        const saved = localStorage.getItem("systemConfig");
        if (saved) {
            const conf = JSON.parse(saved);
            setNomeEmpreendimento(conf.nomeEmpreendimento || "");
            setEnderecoEmpreendimento(conf.enderecoEmpreendimento || "");
            setNomeAdministradora(conf.nomeAdministradora || "");
            setNomeResponsavel(conf.nomeResponsavel || "");
            setTelefoneResponsavel(conf.telefoneResponsavel || "");
            setRefreshTime(conf.refreshTime || 10);
            setTheme(conf.theme || "light");
        }
    }, []);

    // Salvar configurações no localStorage (pode ser substituído por API futuramente)
    const handleSave = () => {
        const config = {
            nomeEmpreendimento,
            enderecoEmpreendimento,
            nomeAdministradora,
            nomeResponsavel,
            telefoneResponsavel,
            refreshTime,
            theme,
        };
        localStorage.setItem("systemConfig", JSON.stringify(config));
        alert("Configurações do sistema salvas com sucesso!");
    };

    return (
        <div className="space-y-10 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>

            {/* === Características do Sistema === */}
            <section className="bg-white p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold mb-4">Características do Sistema</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Nome do Empreendimento
                    </label>
                    <input
                        type="text"
                        value={nomeEmpreendimento}
                        onChange={(e) => setNomeEmpreendimento(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Ex: Condomínio Solar das Árvores"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Endereço do Empreendimento
                    </label>
                    <input
                        type="text"
                        value={enderecoEmpreendimento}
                        onChange={(e) => setEnderecoEmpreendimento(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Ex: Av. Paulista, 1000 - São Paulo/SP"
                    />
                </div>

                {enderecoEmpreendimento && (
                    <div className="mt-4">
                        <iframe
                            src={`https://www.google.com/maps?q=${encodeURIComponent(
                                enderecoEmpreendimento
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
                        value={nomeAdministradora}
                        onChange={(e) => setNomeAdministradora(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Ex: Alpha Gestão Predial"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nome do Supervisor/Responsável
                        </label>
                        <input
                            type="text"
                            value={nomeResponsavel}
                            onChange={(e) => setNomeResponsavel(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            value={telefoneResponsavel}
                            onChange={(e) => setTelefoneResponsavel(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Ex: (11) 99999-9999"
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

            {/* === Botão de Salvar === */}
            <div className="text-right">
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
}
