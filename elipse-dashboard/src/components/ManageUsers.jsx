import React, { useState, useEffect } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function ManageUsers({ role }) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [fullname, setFullname] = useState("");
    const [registerNumb, setRegisterNumb] = useState("");
    const [username, setUsername] = useState("");
    const [userRole, setUserRole] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Buscar lista de usuários
    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE}/test-users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setUsers(data);
                } else {
                    console.warn("Formato inesperado da lista de usuários:", data);
                }
            } catch (err) {
                console.error("Erro ao carregar usuários:", err);
            }
        };

        fetchUsers();
    }, []);

    // Buscar dados do usuário selecionado
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token || !selectedUser) return;

        const fetchUserData = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const current = await res.json();

                // Se o usuário selecionado for o logado, evita erro de permissão
                const endpoint =
                    current?.usuario?.username === selectedUser
                        ? `${API_BASE}/auth/me`
                        : `${API_BASE}/auth/user/${selectedUser}`;

                const resUser = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await resUser.json();

                if (data.ok && data.usuario) {
                    setFullname(data.usuario.fullname || "");
                    setRegisterNumb(data.usuario.registernumb || "");
                    setUsername(data.usuario.username || "");
                    setUserRole(data.usuario.rolename || "");
                } else {
                    console.warn("Erro ao carregar usuário:", data.erro);
                }
            } catch (err) {
                console.error("Erro ao carregar dados do usuário:", err);
            }
        };

        fetchUserData();
    }, [selectedUser]);

    const handleSave = async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);

        try {
            const token = localStorage.getItem("authToken");
            if (!token) throw new Error("Token não encontrado");

            const payload = {
                targetUser: selectedUser,
                fullname,
                registernumb: registerNumb,
                role: userRole,
            };

            // Admin pode mudar username
            if (role === "admin") payload.username = username;

            const res = await fetch(`${API_BASE}/auth/admin-update-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!data.ok) throw new Error(data.erro || "Erro ao salvar alterações.");

            setMsg("✅ Alterações salvas com sucesso!");
        } catch (err) {
            console.error("Erro ao salvar usuário:", err);
            setMsg(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl bg-white shadow-sm p-6 rounded-xl border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Gerenciar Usuários</h2>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selecione o Usuário
                </label>
                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:border-blue-500"
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
                <form onSubmit={handleSave} className="space-y-4">
                    <h3 className="text-lg font-semibold">Editar Informações</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Digite o nome completo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Matrícula / Registro
                        </label>
                        <input
                            type="text"
                            value={registerNumb}
                            onChange={(e) => setRegisterNumb(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Número de registro"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nome de Usuário
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={role !== "admin"} // apenas admin pode alterar username
                            className={`mt-1 block w-full px-3 py-2 border rounded-lg text-sm ${role !== "admin"
                                    ? "bg-gray-100 cursor-not-allowed"
                                    : "focus:border-blue-500"
                                }`}
                            placeholder="Nome de usuário"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Grupo de Usuário
                        </label>
                        <select
                            value={userRole}
                            onChange={(e) => setUserRole(e.target.value)}
                            disabled={!["admin", "supervisor"].includes(role)}
                            className={`mt-1 block w-full px-3 py-2 border rounded-lg text-sm ${!["admin", "supervisor"].includes(role)
                                    ? "bg-gray-100 cursor-not-allowed"
                                    : "focus:border-blue-500"
                                }`}
                        >
                            <option value="admin">Administrador</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="operator">Operador</option>
                            <option value="client">Cliente</option>
                            <option value="maintenance">Manutenção</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-white ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </form>
            )}

            {msg && <p className="mt-4 text-sm">{msg}</p>}
        </div>
    );
}
