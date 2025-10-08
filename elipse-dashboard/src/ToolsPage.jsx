// ToolsPage.jsx
import React, { useState, useEffect } from "react";
import InviteGenerator from "./components/InviteGenerator";
import SystemConfig from "./components/SystemConfig";
import UpdateProfile from "./components/UpdateProfile";
import { jwtDecode } from "jwt-decode";

export default function ToolsPage() {
    const [selected, setSelected] = useState("system");
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        try {
            const token = localStorage.getItem("authToken");
            if (token) {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role || "reader");
                console.log("[ToolsPage] Usuário logado:", decoded);
            } else {
                console.warn("[ToolsPage] Nenhum token encontrado no localStorage.");
            }
        } catch (err) {
            console.error("[ToolsPage] Erro ao decodificar token:", err);
        }
    }, []);

    const renderContent = () => {
        switch (selected) {
            case "system":
                return <SystemConfig userRole={userRole} />;
            case "user":
                return <UpdateProfile userRole={userRole} />;
            case "invite":
                return <InviteGenerator userRole={userRole} />;
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
                    {userRole === "admin" && (
                        <button
                            onClick={() => setSelected("invite")}
                            className={`block w-full text-left px-3 py-2 rounded-lg ${selected === "invite"
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-200"
                                }`}
                        >
                            Gerar Convite
                        </button>
                    )}
                </nav>
                <div className="mt-6 text-sm text-gray-500">
                    <strong>Perfil:</strong>{" "}
                    {userRole ? (
                        <span className={userRole === "admin" ? "text-green-600" : "text-gray-700"}>
                            {userRole}
                        </span>
                    ) : (
                        "carregando..."
                    )}
                </div>
            </aside>

            {/* Conteúdo principal */}
            <main className="flex-1 p-8">
                {userRole ? renderContent() : <div>Carregando permissões...</div>}
            </main>
        </div>
    );
}
