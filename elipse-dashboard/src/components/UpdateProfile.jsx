// src/components/UpdateProfile.jsx
import React, { useState, useEffect } from "react";
import AvatarCropper from "./AvatarCropper";

/**
 * UpdateProfile.jsx
 * ---------------------------------------------------------
 * Responsável por:
 * - Carregar dados reais do usuário via /auth/me
 * - Exibir e editar nome completo, matrícula
 * - Alterar senha (com confirmação)
 * - Atualizar avatar com cropper + preview
 * - Enviar multipart/form-data para /auth/update-profile
 * - Aceitar newToken retornado pelo backend e substituir
 *   corretamente o token no localStorage
 * ---------------------------------------------------------
 */

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function UpdateProfile() {
    // Campos de perfil
    const [fullname, setFullname] = useState("");
    const [registernumb, setRegisterNumb] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");

    // Campos de senha
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");

    // Feedback/mensagens
    const [msg, setMsg] = useState("");

    // Estados do avatar
    const [avatarPreview, setAvatarPreview] = useState(null); // URL ou blob URL
    const [cropping, setCropping] = useState(false);
    const [croppedBlob, setCroppedBlob] = useState(null);

    // Restrições locais
    const MAX_FILE_SIZE = 4 * 1024 * 1024;
    const MIN_DIM = 400;

    // ---------------------------------------------------------
    // Carrega informações do usuário ao abrir o componente
    // ---------------------------------------------------------
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // Decodifica payload do token para exibir username e role
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUsername(payload.user || payload.username || "");
            setRole(payload.role || "");
        } catch {
            console.warn("Token inválido.");
        }

        // Busca dados completos via /auth/me
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();

                if (data.ok && data.usuario) {
                    setFullname(data.usuario.fullname || "");
                    setRegisterNumb(data.usuario.registernumb || "");
                    if (data.usuario.avatarurl) {
                        setAvatarPreview(data.usuario.avatarurl);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar perfil:", err);
            }
        })();
    }, []);

    // ---------------------------------------------------------
    // Validação inicial e abertura do cropper
    // ---------------------------------------------------------
    const handleAvatarChange = (e) => {
        setMsg("");
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            return setMsg("Selecione uma imagem válida.");
        }
        if (file.size > MAX_FILE_SIZE) {
            return setMsg("Arquivo muito grande. Máximo 4MB.");
        }

        // Lê imagem para validar dimensões
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                if (img.width < MIN_DIM || img.height < MIN_DIM) {
                    return setMsg(`A imagem deve ter pelo menos ${MIN_DIM}×${MIN_DIM} pixels.`);
                }
                setAvatarPreview(reader.result);
                setCropping(true);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

    // ---------------------------------------------------------
    // Envio do formulário
    // ---------------------------------------------------------
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMsg("");

        if (novaSenha && novaSenha !== confirmaSenha) {
            return setMsg("Nova senha e confirmação não coincidem.");
        }

        try {
            const token = localStorage.getItem("authToken");
            if (!token) return setMsg("Faça login novamente.");

            const formData = new FormData();
            formData.append("fullname", fullname || "");
            formData.append("registernumb", registernumb || "");
            formData.append("senhaAtual", senhaAtual || "");
            formData.append("novaSenha", novaSenha || "");

            if (croppedBlob) {
                formData.append("avatar", croppedBlob, "avatar.png");
            }

            const res = await fetch(`${API_BASE}/auth/update-profile`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();
            if (!data.ok) {
                return setMsg(data.erro || "Erro ao atualizar perfil.");
            }

            // Mensagem OK
            setMsg("Perfil atualizado com sucesso!");

            // Atualiza preview de avatar, se veio nova imagem do backend
            if (data.usuario?.avatarurl) {
                setAvatarPreview(data.usuario.avatarurl);
            }

            // 👉 ATUALIZA TOKEN SE O BACKEND RETORNAR NEWTOKEN
            if (data.newToken) {
                localStorage.setItem("authToken", data.newToken);
            }

            // Limpa senhas
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmaSenha("");
            setCroppedBlob(null);
        } catch (err) {
            setMsg("Erro interno: " + err.message);
        }
    };

    return (
        <div>
            <form onSubmit={handleUpdate} className="space-y-6">
                {/* Campos de Perfil */}
                <div>
                    <label className="block text-sm font-medium">Nome Completo *</label>
                    <input
                        type="text"
                        value={fullname}
                        required
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                        onChange={(e) => setFullname(e.target.value)}
                    />

                    <label className="block mt-4 text-sm font-medium">Nome de Usuário *</label>
                    <input
                        type="text"
                        value={username}
                        disabled
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-100"
                    />

                    <label className="block mt-4 text-sm font-medium">Grupo *</label>
                    <input
                        type="text"
                        value={role}
                        disabled
                        className="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-100"
                    />

                    <label className="block mt-4 text-sm font-medium">Matrícula</label>
                    <input
                        type="text"
                        value={registernumb}
                        className="mt-1 w-full px-3 py-2 border rounded-lg"
                        onChange={(e) => setRegisterNumb(e.target.value)}
                    />

                    {/* Avatar */}
                    <label className="block mt-4 text-sm font-medium">Foto de Perfil</label>

                    <div className="flex gap-4 mt-2 items-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                            {avatarPreview ? (
                                <img src={avatarPreview} className="object-cover w-full h-full" />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                    —
                                </div>
                            )}
                        </div>

                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                className="text-sm"
                                onChange={handleAvatarChange}
                            />
                            <div className="text-xs text-gray-600">
                                Min. {MIN_DIM}px, máx. 4MB.
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="my-6" />

                {/* SENHAS */}
                <h2 className="font-semibold">Mudança de Senha</h2>

                <label className="block text-sm">Senha Atual</label>
                <input
                    type="password"
                    value={senhaAtual}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    onChange={(e) => setSenhaAtual(e.target.value)}
                />

                <label className="block text-sm mt-3">Nova Senha</label>
                <input
                    type="password"
                    value={novaSenha}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    onChange={(e) => setNovaSenha(e.target.value)}
                />

                <label className="block text-sm mt-3">Confirmar Nova Senha</label>
                <input
                    type="password"
                    value={confirmaSenha}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    onChange={(e) => setConfirmaSenha(e.target.value)}
                />

                <div className="text-right">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Salvar Alterações
                    </button>
                </div>
            </form>

            {msg && <p className="mt-4 text-sm">{msg}</p>}

            {cropping && avatarPreview && (
                <AvatarCropper
                    imageSrc={avatarPreview}
                    onCancel={() => setCropping(false)}
                    onCrop={(blob) => {
                        setCroppedBlob(blob);
                        setCropping(false);
                        setAvatarPreview(URL.createObjectURL(blob));
                    }}
                />
            )}
        </div>
    );
}
