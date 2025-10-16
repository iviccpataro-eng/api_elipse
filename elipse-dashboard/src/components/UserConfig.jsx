// components/UserConfig.jsx

import React, { useState, useEffect } from "react";
import UpdateProfile from "./UpdateProfile";
import ManageUsers from "./ManageUsers";

export default function UserConfig() {
    const [activeTab, setActiveTab] = useState("me");
    const [userRole, setUserRole] = useState("");

    useEffect(() => {
        // Lê o papel (role) do usuário logado
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                setUserRole(parsed.role || "");
            } catch {
                console.warn("Falha ao interpretar userInfo local.");
            }
        } else {
            try {
                const token = localStorage.getItem("authToken");
                if (token) {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    setUserRole(payload.role || "");
                }
            } catch {
                console.warn("Token inválido ou ausente.");
            }
        }
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Configurações de Usuário</h1>
            <div className="bg-white rounded-xl shadow p-6"> {/*className="max-w-5xl mx-auto"*/}

                {/* Abas superiores */}
                <div className="flex space-x-4 border-b mb-6">
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === "me"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-600 hover:text-blue-600"
                            }`}
                        onClick={() => setActiveTab("me")}
                    >
                        Meu Perfil
                    </button>

                    {/* A aba de Gerenciar só aparece para admin e supervisor */}
                    {["admin", "supervisor"].includes(userRole) && (
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === "manage"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-blue-600"
                                }`}
                            onClick={() => setActiveTab("manage")}
                        >
                            Gerenciar Usuários
                        </button>
                    )}
                </div>

                {/* Conteúdo da aba */}
                {activeTab === "me" && <UpdateProfile />}
                {activeTab === "manage" && ["admin", "supervisor"].includes(userRole) && (
                    <ManageUsers role={userRole} />
                )}
            </div>
        </div>
    );
}
