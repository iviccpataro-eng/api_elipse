// components/ManageUsers.jsx

import React, { useState, useEffect } from "react";

export default function ManageUsers({ role }) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [fullname, setFullname] = useState("");
    const [registerNumb, setRegisterNumb] = useState("");
    const [username, setUsername] = useState("");
    const [roleName, setRoleName] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [currentUser, setCurrentUser] = useState("");

    const token = localStorage.getItem("authToken");

    const roleLabels = {
        admin: "Administrador",
        supervisor: "Supervisor",
        user: "Operador",
        client: "Cliente",
        maintnance: "Manutenção",
    };

    // 🔐 Obtém o nome do usuário logado
    useEffect(() => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setCurrentUser(payload.user || "");
        } catch {
            console.warn("Token inválido ao tentar identificar usuário atual.");
        }
    }, []);

    // 📥 Busca lista de usuários
    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch(`${API_BASE}/auth/list-users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const text = await res.text();

                try {
                    const data = JSON.parse(text);
                    if (data.ok) setUsers(data.usuarios);
                    else console.error("Erro ao listar usuários:", data.erro || text);
                } catch {
                    console.error("Resposta não JSON:", text);
                }
            } catch (err) {
                console.error("Erro ao buscar lista de usuários:", err);
            }
        }
        fetchUsers();
    }, []);

    // 📦 Busca dados do usuário selecionado
    async function fetchUserData(username) {
        if (!username) return;
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(`${API_BASE}/auth/user/${username}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const text = await res.text();

            try {
                const data = JSON.parse(text);
                if (data.ok && data.usuario) {
                    setFullname(data.usuario.fullname || "");
                    setRegisterNumb(data.usuario.registernumb || "");
                    setUsername(data.usuario.username || "");
                    setRoleName(data.usuario.rolename || "");
                } else {
                    setMessage(data.erro || "Erro ao carregar dados do usuário.");
                }
            } catch {
                console.error("Resposta não JSON:", text);
                setMessage("Erro inesperado ao buscar dados do usuário.");
            }
        } catch (err) {
            console.error("Erro ao carregar dados do usuário:", err);
            setMessage("Erro ao carregar dados do usuário.");
        } finally {
            setLoading(false);
        }
    }

    // 📤 Atualiza dados no servidor
    async function handleSave() {
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(`${API_BASE}/auth/admin-update-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetUser: selectedUser,
                    fullname,
                    registernumb: registerNumb,
                    username,
                    role: roleName,
                }),
            });

            const data = await res.json();
            if (data.ok) {
                setMessage("Usuário atualizado com sucesso!");
            } else {
                setMessage(data.erro || "Erro ao salvar alterações.");
            }
        } catch (err) {
            console.error("Erro ao salvar:", err);
            setMessage("Erro ao salvar alterações.");
        } finally {
            setLoading(false);
        }
    }

    const isSelf = selectedUser === currentUser;

    return (
        <div>
            {/* Selecionar usuário */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                    Selecione o Usuário
                </label>
                <select
                    className="w-full p-2 border rounded-lg"
                    value={selectedUser}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedUser(val);
                        fetchUserData(val);
                    }}
                >
                    <option value="">-- Selecione --</option>
                    {users.map((u) => (
                        <option key={u.username} value={u.username}>
                            {u.username} ({roleLabels[u.rolename] || u.rolename})
                        </option>
                    ))}
                </select>
            </div>
            {/* Quebra de seção */}
            <hr className="my-6" />
            {/* Campos de edição */}
            <h2 className="text-md font-semibold mb-2">Editar Informações</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Nome Completo</label>
                    <input
                        type="text"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        disabled={isSelf}
                        className={`w-full p-2 border rounded-lg ${isSelf ? "bg-gray-100" : ""
                            }`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Matrícula / Registro
                    </label>
                    <input
                        type="text"
                        value={registerNumb}
                        onChange={(e) => setRegisterNumb(e.target.value)}
                        disabled={isSelf}
                        className={`w-full p-2 border rounded-lg ${isSelf ? "bg-gray-100" : ""
                            }`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Nome de Usuário</label>
                    <input
                        type="text"
                        value={username}
                        disabled={role !== "admin"}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full p-2 border rounded-lg ${role !== "admin" ? "bg-gray-100" : ""
                            }`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Grupo de Usuário</label>
                    <select
                        className={`w-full p-2 border rounded-lg ${role === "user" ? "bg-gray-100" : ""
                            }`}
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        disabled={role === "user"}
                    >
                        {Object.entries(roleLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {/* Botão de salvar */}
            <div className="mt-6 text-right">
                <button
                    onClick={handleSave}
                    disabled={!selectedUser || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
            </div>
            {message && (
                <p
                    className={`mt-4 text-sm ${message.includes("sucesso") ? "text-green-600" : "text-red-600"
                        }`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
