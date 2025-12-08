// src/components/UpdateProfile.jsx
import React, { useState, useEffect } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function UpdateProfile() {
    const [fullname, setFullname] = useState("");
    const [registernumb, setRegisterNumb] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");
    const [avatarFile, setAvatarFile] = useState(null); // 🔥 novo campo
    const [previewAvatar, setPreviewAvatar] = useState(null); // preview da imagem
    const [msg, setMsg] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // Carrega user e role do token
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUsername(payload.user);
            setRole(payload.role);
        } catch {
            console.warn("Token inválido");
        }

        // Buscar dados do perfil
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();

                if (data.ok && data.usuario) {
                    setFullname(data.usuario.fullname || "");
                    setRegisterNumb(data.usuario.registernumb || "");

                    if (data.usuario.avatarUrl) {
                        setPreviewAvatar(data.usuario.avatarUrl); // Mostrar avatar atual
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar perfil:", err);
            }
        };

        fetchProfile();
    }, []);

    // ============================================================
    // 🔹 Submissão do formulário
    // ============================================================
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMsg("");

        if (novaSenha && novaSenha !== confirmaSenha) {
            setMsg("Nova senha e confirmação não coincidem.");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");

            // 🔥 Agora usando FormData para aceitar arquivo
            const formData = new FormData();
            formData.append("fullname", fullname);
            formData.append("registernumb", registernumb);
            formData.append("username", username);
            formData.append("senhaAtual", senhaAtual);
            formData.append("novaSenha", novaSenha);

            if (avatarFile) {
                formData.append("avatar", avatarFile); // 🔥 arquivo enviado
            }

            const res = await fetch(`${API_BASE}/auth/update-profile`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // NÃO incluir Content-Type
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.erro || "Erro ao atualizar perfil.");
            }

            // Atualizar estados retornados pelo backend
            if (data.usuario) {
                setFullname(data.usuario.fullname || "");
                setRegisterNumb(data.usuario.registernumb || "");
                if (data.usuario.avatarUrl) {
                    setPreviewAvatar(data.usuario.avatarUrl);
                }
            }

            setSenhaAtual("");
            setNovaSenha("");
            setConfirmaSenha("");

            setMsg("Perfil atualizado com sucesso!");
        } catch (err) {
            setMsg(`Erro: ${err.message}`);
        }
    };

    // ============================================================
    // 🔹 Preview da imagem selecionada
    // ============================================================
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewAvatar(URL.createObjectURL(file)); // preview local
        }
    };

    return (
        <div>
            <form onSubmit={handleUpdate} className="space-y-6">
                {/* Dados do usuário */}
                <div>
                    {/* Nome */}
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

                    {/* Matrícula */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Matrícula
                        </label>
                        <input
                            type="text"
                            value={registernumb}
                            onChange={(e) => setRegisterNumb(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                            placeholder="Opcional"
                        />
                    </div>

                    {/* 🔥 NOVO CAMPO: Avatar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Foto do Perfil
                        </label>

                        {/* Preview */}
                        {previewAvatar && (
                            <img
                                src={previewAvatar}
                                alt="Avatar preview"
                                className="w-20 h-20 rounded-full object-cover border my-2"
                            />
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="mt-1 block w-full text-sm text-gray-700"
                        />
                    </div>

                    {/* Username */}
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

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Grupo de Usuário *
                        </label>
                        <input
                            type="text"
                            value={role}
                            disabled
                            className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm bg-gray-100 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Linha divisória */}
                <hr className="my-6" />

                <h2 className="text-md font-semibold mb-2">Mudança de Senha</h2>

                {/* Senhas */}
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

                    <label className="block text-sm font-medium text-gray-700 mt-4">
                        Nova Senha
                    </label>
                    <input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Digite a nova senha"
                    />

                    <label className="block text-sm font-medium text-gray-700 mt-4">
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

                <div className="text-right">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </form>

            {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
        </div>
    );
}
