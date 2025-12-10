import React, { useState } from "react";
import InviteGenerator from "./components/InviteGenerator";
import SystemConfig from "./components/SystemConfig";
import UserConfig from "./components/UserConfig";
import AboutSystem from "./components/AboutSystem";

export default function ToolsPage() {
    const [selected, setSelected] = useState("system");

    const tabs = [
        { key: "system", label: "Configurações do Sistema" },
        { key: "user", label: "Configurações de Usuário" },
        { key: "invite", label: "Gerar Convite" },
        { key: "about", label: "Sobre o Sistema" }
    ];

    const renderContent = () => {
        switch (selected) {
            case "system": return <SystemConfig />;
            case "user": return <UserConfig />;
            case "invite": return <InviteGenerator />;
            case "about": return <AboutSystem />;
            default: return <div>Selecione uma opção no menu</div>;
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen md:pt-20 pt-16">

            {/* SIDEBAR (DESKTOP/TABLET) */}
            <aside className="hidden md:flex md:w-64 bg-gray-100 border-r p-4 flex-col justify-between fixed md:top-16 md:bottom-0 overflow-y-auto">
                <div>
                    <h2 className="text-lg font-semibold mb-4">Ferramentas</h2>
                    <nav className="space-y-2">
                        {tabs.slice(0, 3).map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setSelected(t.key)}
                                className={`block w-full text-left px-3 py-2 rounded-lg ${selected === t.key
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-gray-200"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="border-t mt-6 pt-3">
                    <button
                        onClick={() => setSelected("about")}
                        className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "about"
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-200 text-gray-700"
                            }`}
                    >
                        Sobre o Sistema
                    </button>
                </div>
            </aside>

            {/* ABAS HORIZONTAIS (MOBILE) */}
            <div className="md:hidden w-full bg-white border-b overflow-x-auto whitespace-nowrap px-3 py-2 flex space-x-3">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setSelected(t.key)}
                        className={`px-3 py-1 text-sm rounded-md whitespace-nowrap ${selected === t.key
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 p-4 md:p-6 md:ml-64 transition-all">
                {renderContent()}
            </main>
        </div>
    );
}
