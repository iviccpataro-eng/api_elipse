import React, { useState } from "react";
import InviteGenerator from "./components/InviteGenerator";
import SystemConfig from "./components/SystemConfig";
import UpdateProfile from "./components/UpdateProfile";

export default function ToolsPage() {
    const [selected, setSelected] = useState("system");

    const renderContent = () => {
        switch (selected) {
            case "system":
                return <SystemConfig />;
            case "user":
                return <UpdateProfile />;
            case "invite":
                return <InviteGenerator />;
            default:
                return <div>Selecione uma opção no menu</div>;
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-100 border-r p-4">
                <h2 className="text-lg font-semibold mb-4">Ferramentas</h2>
                <nav className="space-y-2">
                    <button
                        onClick={() => setSelected("system")}
                        className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "system" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
                            }`}
                    >
                        Configurações do Sistema
                    </button>
                    <button
                        onClick={() => setSelected("user")}
                        className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "user" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
                            }`}
                    >
                        Configurações de Usuário
                    </button>
                    <button
                        onClick={() => setSelected("invite")}
                        className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "invite" ? "bg-blue-600 text-white" : "hover:bg-gray-200"
                            }`}
                    >
                        Gerar Convite
                    </button>
                    <span class="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
                        Somente usuários com privilégios de administrador
                    </span>
                </nav>
            </aside>

            {/* Conteúdo principal */}
            <main className="flex-1 p-6">{renderContent()}</main>
        </div>
    );
}
