import React, { useState } from "react";
import InviteGenerator from "./components/InviteGenerator";
import SystemConfig from "./components/SystemConfig";
import UserConfig from "./components/UserConfig";
import AboutSystem from "./components/AboutSystem"; // ✅ nova página "Em breve"

export default function ToolsPage() {
    const [selected, setSelected] = useState("system");

    const renderContent = () => {
        switch (selected) {
            case "system":
                return <SystemConfig />;
            case "user":
                return <UserConfig />;
            case "invite":
                return <InviteGenerator />;
            case "about":
                return <AboutSystem />; // ✅ nova aba
            default:
                return <div>Selecione uma opção no menu</div>;
        }
    };

    return (
        <div className="flex min-h-screen pt-16">
            {/* Sidebar fixa */}
            <aside className="w-64 bg-gray-100 border-r p-4 flex flex-col justify-between fixed top-16 bottom-0 overflow-y-auto">
                <div>
                    <h2 className="text-lg font-semibold mb-4">Ferramentas</h2>
                    <nav className="space-y-2">
                        <button
                            onClick={() => setSelected("system")}
                            className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "system"
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-200"
                                }`}
                        >
                            Configurações do Sistema
                        </button>

                        <button
                            onClick={() => setSelected("user")}
                            className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "user"
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-200"
                                }`}
                        >
                            Configurações de Usuário
                        </button>

                        <button
                            onClick={() => setSelected("invite")}
                            className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "invite"
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-200"
                                }`}
                        >
                            Gerar Convite
                        </button>
                    </nav>
                </div>

                {/* Rodapé fixo da sidebar */}
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

            {/* Conteúdo principal */}
            <main className="flex-1 p-6 ml-64 overflow-y-auto">{renderContent()}</main>
        </div>
    );
}
