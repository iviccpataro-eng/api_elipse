// components/ManageUsers.jsx

import React, { useState, useEffect } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function ManageUsers({ role }) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [msg, setMsg] = useState("");

    const [formData, setFormData] = useState({
        fullname: "",
        registernumb: "",
        username: "",
        rolename: "",
    });

    // Buscar lista de usuários
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch(`${API_BASE}/test-users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (Array.isArray(data)) setUsers(data);
            } catch (err) {
                console.error("Erro ao buscar usuários:", err);
            }
        };
        fetchUsers();
    }, []);

    // Atualiza o formulário quando o usuário é selecionado
    useEffect(() => {
        if (selectedUser) {
            setFormData({
                fullname: selectedUser.fullname || "",
                registernumb: selectedUser.registernumb || "",
                username: selectedUser.username || "",
                rolename: selectedUser.rolename || "",
            });
        }
    }, [selectedUser]);

    const handleSave = async () => {
        if (!selectedUser) return;
        setMsg("");
        try {
            const token = localStorage.getItem("authToken");

            // Admin pode atualizar tudo. Supervisor só rolename, fullname, registernumb.
            const payload = {};
            if (["admin"].includes(role)) {
                payload.fullname = formData.fullname;
                payload.registernumb = formData.registernumb;
                payload.username = formData.username;
                payload.role = formData.rolename;
            } else if (role === "supervisor") {
                payload.fullname = formData.fullname;
                payload.registernumb = formData.registernumb;
                payload.role = formData.rolename;
            }

            payload.targetUser = selectedUser.username;

            const res = await fetch(`${API_BASE}/auth/admin-update-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.erro || "Erro ao atualizar usuário.");
            }

            setMsg("Usuário atualizado com sucesso!");
        } catch (err) {
            console.error("Erro ao salvar:", err);
            setMsg("Erro ao salvar: " + err.message);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Selecione o Usuário
                    </label>
                    <select
                        className="block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        value={selectedUser?.username || ""}
                        onChange={(e) =>
                            setSelectedUser(
                                users.find((u) => u.username === e.target.value)
                            )
                        }
                    >
                        <option value="">-- Selecione --</option>
                        {users.map((u) => (
                            <option key={u.username} value={u.username}>
                                {u.username} ({u.rolename})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedUser && (
                    <div className="space-y-4 col-span-2 mt-4">
                        <h3 className="text-lg font-medium text-gray-800">
                            Editar Informações
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={formData.fullname}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        fullname: e.target.value,
                                    })
                                }
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Matrícula
                            </label>
                            <input
                                type="text"
                                value={formData.registernumb}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        registernumb: e.target.value,
                                    })
                                }
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome de Usuário
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        username: e.target.value,
                                    })
                                }
                                disabled={role !== "admin"}
                                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm ${role !== "admin"
                                    ? "bg-gray-100 cursor-not-allowed"
                                    : ""
                                    }`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Grupo de Usuário
                            </label>
                            <select
                                value={formData.rolename}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        rolename: e.target.value,
                                    })
                                }
                                className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            >
                                <option value="admin">Administrador</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="operator">Operador</option>
                                <option value="maintnance">Manutenção</option>
                                <option value="client">Cliente</option>
                                <option value="reader">Leitor</option>
                            </select>
                        </div>

                        <div className="text-right mt-6">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {msg && (
                <p className="text-sm mt-4 text-green-600 font-medium">{msg}</p>
            )}
        </div>
    );
}
