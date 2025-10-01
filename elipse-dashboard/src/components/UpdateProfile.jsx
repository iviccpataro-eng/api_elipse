import React, { useState, useEffect } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function UpdateProfile() {
    const [fullname, setFullname] = useState("");
    const [matricula, setMatricula] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");
    const [msg, setMsg] = useState("");

    useEffect(() => {
        // Carregar dados do usuário do token (JWT)
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUsername(payload.user);
            setRole(payload.role);

            // 🚧 Aqui você pode puxar mais dados do backend se quiser,
            // ex: fullname e matricula já salvos no banco.
        } catch {
            console.warn("Token inválido");
        }
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMsg("");

        if (novaSenha && novaSenha !== confirmaSenha) {
            setMsg("Nova senha e confirmação não coincidem.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/auth/update-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fullname,
                    matricula,
                    username,
                    senhaAtual,
                    novaSenha,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.erro || "Erro ao atualizar perfil.");
            }

            setMsg("Perfil atualizado com sucesso!");
        } catch (err) {
            setMsg(`Erro: ${err.message}`);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Configurações de Usuário</h1>
            <form onSubmit={handleUpdate} className="space-y-6 max-w-lg">
                {/* Dados do usuário */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nome Completo *
                        </label>
                        <input
                            type="text"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Digite seu nome completo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Matrícula
                        </label>
                        <input
                            type="text"
                            value={matricula}
                            onChange={(e) => setMatricula(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Opcional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nome de Usuário *
                        </label>
                        <input
                            type="text"
                            value={username}
                            disabled
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Tipo (Role)
                        </label>
                        <input
                            type="text"
                            value={role}
                            disabled
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Quebra de seção */}
                <hr className="my-6" />
                <h2 className="text-xl font-semibold">Mudança de Senha</h2>

                {/* Senhas */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Senha Atual
                        </label>
                        <input
                            type="password"
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Digite sua senha atual"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Digite a nova senha"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Repetir Nova Senha
                        </label>
                        <input
                            type="password"
                            value={confirmaSenha}
                            onChange={(e) => setConfirmaSenha(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Confirme a nova senha"
                        />
                    </div>
                </div>

                {/* Botão */}
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Salvar Alterações
                </button>
            </form>

            {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
        </div>
    );
}
