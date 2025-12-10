import React, { useState } from "react";
import Settings from "lucide-react";
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
        <div className="flex flex-col md:flex-row min-h-screen pt-16">

            {/* SIDEBAR (DESKTOP/TABLET) */}
            <aside className="hidden md:flex md:w-64 bg-gray-100 border-r p-4 flex-col justify-between fixed md:top-16 md:bottom-0 overflow-y-auto">
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Configurações
                    </h2>
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
            <div className="md:hidden w-full bg-white border-b px-3 pb-2 pt-4 flex space-x-4 overflow-x-auto">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setSelected(t.key)}
                        className={`pb-2 whitespace-nowrap border-b-2 transition-colors ${selected === t.key
                                ? "border-blue-600 text-blue-600 font-medium"
                                : "border-transparent text-gray-600 hover:text-black"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 p-4 md:p-6 md:ml-64 transition-all">

                {/* Título apenas no MOBILE */}
                <div className="md:hidden">
                    <h1 className="text-2xl font-semibold flex items-center gap-2 mb-6 mt-4">
                        <Settings className="w-5 h-5" />
                        Configurações
                    </h1>
                </div>

                {renderContent()}
            </main>
        </div>
    );
}
