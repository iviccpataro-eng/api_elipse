// ToolsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { apiFetch } from "./api";

import InviteGenerator from "./components/InviteGenerator";
import SystemConfig from "./components/SystemConfig";
import UpdateProfile from "./components/UpdateProfile";

export default function ToolsPage({ token, user }) {
    const [selected, setSelected] = useState("system");
    const [validToken, setValidToken] = useState(true);
    const navigate = useNavigate();

    // 🔐 Valida o token ao carregar a página
    useEffect(() => {
        async function validateToken() {
            const tk = token || localStorage.getItem("authToken");
            if (!tk) {
                console.warn("[ToolsPage] Nenhum token encontrado. Redirecionando para login.");
                navigate("/");
                return;
            }

            try {
                jwtDecode(tk); // apenas testa se o JWT é válido estruturalmente

                // opcional: valida no servidor se ainda é válido
                const resp = await apiFetch("/auth/validate", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${tk}` },
                });

                if (!resp.ok) {
                    console.warn("[ToolsPage] Token inválido no servidor:", resp.status);
                    setValidToken(false);
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("userInfo");
                    navigate("/");
                }
            } catch (err) {
                console.warn("[ToolsPage] Token malformado:", err);
                setValidToken(false);
                localStorage.removeItem("authToken");
                localStorage.removeItem("userInfo");
                navigate("/");
            }
        }

        validateToken();
    }, [token, navigate]);

    // 🔧 Define o conteúdo da aba selecionada
    const renderContent = () => {
        switch (selected) {
            case "system":
                return <SystemConfig token={token} />;
            case "user":
                return <UpdateProfile token={token} user={user} />;
            case "invite":
                return <InviteGenerator token={token} />;
            default:
                return <div>Selecione uma opção no menu</div>;
        }
    };

    if (!validToken) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Sessão expirada</h2>
                    <p className="text-sm mb-4">
                        Seu token de acesso não é mais válido. Por favor, refaça o login.
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-100 border-r p-4">
                <h2 className="text-lg font-semibold mb-4">⚙️ Ferramentas</h2>
                <nav className="space-y-2">
                    <button
                        onClick={() => setSelected("system")}
                        className={`block w-full text-left px-3 py-2 rounded-lg transition ${selected === "system"
                                ? "bg-blue-600 text-white shadow"
                                : "hover:bg-gray-200"
                            }`}
                    >
                        Configurações do Sistema
                    </button>
                    <button
                        onClick={() => setSelected("user")}
                        className={`block w-full text-left px-3 py-2 rounded-lg transition ${selected === "user"
                                ? "bg-blue-600 text-white shadow"
                                : "hover:bg-gray-200"
                            }`}
                    >
                        Configurações de Usuário
                    </button>
                    <button
                        onClick={() => setSelected("invite")}
                        className={`block w-full text-left px-3 py-2 rounded-lg transition ${selected === "invite"
                                ? "bg-blue-600 text-white shadow"
                                : "hover:bg-gray-200"
                            }`}
                    >
                        Gerar Convite
                    </button>
                </nav>
            </aside>

            {/* Conteúdo principal */}
            <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}
