// src/components/UpdateProfile.jsx
import React, { useState, useEffect } from "react";
import AvatarCropper from "./AvatarCropper";

/**
 * UpdateProfile
 *
 * - Carrega perfil via /auth/me
 * - Mostra campos: Nome completo, Matrícula, Nome de usuário (disabled), Grupo (disabled)
 * - Permite alterar senha (atual, nova, confirmar)
 * - Permite upload de avatar (validações: tipo imagem, <= 4MB, >= 400x400)
 * - Abre cropper (AvatarCropper) para recorte quadrado (400x400)
 * - Envia formulário via multipart/form-data para /auth/update-profile
 * - Ao resposta bem-sucedida atualiza preview e atualiza token no localStorage para refletir avatar sem reload
 *
 * Observações:
 *  - API_BASE deve apontar para seu backend
 *  - backend: rota POST /auth/update-profile aceita multipart/form-data e retorna usuario.avatarurl
 */

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function UpdateProfile() {
    // campos
    const [fullname, setFullname] = useState("");
    const [registernumb, setRegisterNumb] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");

    // senhas
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmaSenha, setConfirmaSenha] = useState("");

    // mensagens / feedback
    const [msg, setMsg] = useState("");

    // avatar states
    const [avatarPreview, setAvatarPreview] = useState(null); // dataURL ou remote URL
    const [avatarFile, setAvatarFile] = useState(null); // arquivo original (unused after crop, but kept)
    const [cropping, setCropping] = useState(false);
    const [croppedBlob, setCroppedBlob] = useState(null);

    // Limites (mesmo que backend)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    const MIN_DIM = 400; // px

    // Carrega perfil e token (inicial)
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // tenta decodificar payload do token (para preencher username/role)
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setUsername(payload.user || payload.username || payload.name || "");
            setRole(payload.role || "");
        } catch (e) {
            console.warn("Token inválido ou não padrão:", e);
        }

        // busca /auth/me para fullname, registernumb e avatar
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return; // silencioso
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

    // Quando o usuário seleciona um arquivo (antes do crop)
    const handleAvatarChange = (e) => {
        setMsg("");
        const file = e.target.files?.[0];
        if (!file) return;

        // valida tipo
        if (!file.type.startsWith("image/")) {
            setMsg("Formato inválido. Selecione um arquivo de imagem.");
            return;
        }

        // valida tamanho
        if (file.size > MAX_FILE_SIZE) {
            setMsg("Arquivo muito grande. Máx 4MB.");
            return;
        }

        // cria preview temporário e valida dimensões
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const img = new Image();
            img.onload = () => {
                if (img.width < MIN_DIM || img.height < MIN_DIM) {
                    setMsg(`A imagem deve ter pelo menos ${MIN_DIM}×${MIN_DIM} pixels.`);
                    return;
                }
                // abre cropper
                setAvatarFile(file);
                setAvatarPreview(dataUrl);
                setCropping(true);
            };
            img.onerror = () => setMsg("Não foi possível ler a imagem.");
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    // Submissão do formulário
    const handleUpdate = async (e) => {
        e.preventDefault();
        setMsg("");

        if (novaSenha && novaSenha !== confirmaSenha) {
            setMsg("Nova senha e confirmação não coincidem.");
            return;
        }

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setMsg("Faça login novamente.");
                return;
            }

            const formData = new FormData();
            formData.append("fullname", fullname || "");
            formData.append("registernumb", registernumb || "");
            formData.append("senhaAtual", senhaAtual || "");
            formData.append("novaSenha", novaSenha || "");

            // Se houver avatar recortado, envia como 'avatar'
            if (croppedBlob) {
                formData.append("avatar", croppedBlob, "avatar.png");
            }

            const res = await fetch(`${API_BASE}/auth/update-profile`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    // NOTE: não definir Content-Type — browser define multipart boundary
                },
                body: formData,
            });

            const data = await res.json();
            if (!data.ok) {
                setMsg(data.erro || "Erro ao atualizar perfil.");
                return;
            }

            setMsg("Perfil atualizado com sucesso!");

            // Atualiza preview se backend retornou avatarurl
            if (data.usuario?.avatarurl) {
                setAvatarPreview(data.usuario.avatarurl);

                // Atualiza token no localStorage para que Navbar leia o novo avatar (sem reload)
                try {
                    const originalToken = localStorage.getItem("authToken");
                    if (originalToken) {
                        const parts = originalToken.split(".");
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]));
                            payload.image = data.usuario.avatarurl;
                            const newPayloadB64 = btoa(JSON.stringify(payload));
                            const newToken = `${parts[0]}.${newPayloadB64}.${parts[2]}`;
                            localStorage.setItem("authToken", newToken);
                        }
                    }
                } catch (err) {
                    console.warn("Não foi possível atualizar token localmente:", err);
                }
            }

            // limpa senha e blob
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmaSenha("");
            setCroppedBlob(null);
        } catch (err) {
            setMsg(`Erro: ${err.message}`);
        }
    };

    return (
        <div>
            <form onSubmit={handleUpdate} className="space-y-6">
                {/* Dados pessoais */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                    <input
                        type="text"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Digite seu nome completo"
                        required
                    />

                    <label className="block mt-4 text-sm font-medium text-gray-700">Nome de Usuário *</label>
                    <input
                        type="text"
                        value={username}
                        disabled
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm bg-gray-100 cursor-not-allowed"
                    />

                    <label className="block mt-4 text-sm font-medium text-gray-700">Grupo de Usuário *</label>
                    <input
                        type="text"
                        value={role}
                        disabled
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm bg-gray-100 cursor-not-allowed"
                    />

                    <label className="block mt-4 text-sm font-medium text-gray-700">Matrícula</label>
                    <input
                        type="text"
                        value={registernumb}
                        onChange={(e) => setRegisterNumb(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Opcional"
                    />

                    {/* Avatar upload */}
                    <label className="block mt-4 text-sm font-medium text-gray-700">Foto de Perfil</label>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                            {avatarPreview ? (
                                // se avatarPreview for blob/url, mostramos
                                // useImageElement com object URL já é suportado
                                <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-600">—</div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="text-sm"
                            />
                            <div className="text-xs text-gray-500">
                                JPG / PNG / WEBP. Mínimo {MIN_DIM}×{MIN_DIM}px. Máx 4MB.
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="my-6" />

                {/* Mudança de senha */}
                <h2 className="text-md font-semibold mb-2">Mudança de Senha</h2>
                <div>
                    <label className="block text-sm text-gray-700">Senha Atual</label>
                    <input
                        type="password"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Digite sua senha atual"
                    />

                    <label className="block text-sm mt-3 text-gray-700">Nova Senha</label>
                    <input
                        type="password"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm text-sm"
                        placeholder="Digite a nova senha"
                    />

                    <label className="block text-sm mt-3 text-gray-700">Confirmar Nova Senha</label>
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

            {/* Modal cropper */}
            {cropping && avatarPreview && (
                <AvatarCropper
                    imageSrc={avatarPreview}
                    onCancel={() => {
                        setCropping(false);
                        // Mantemos avatarPreview para preview anterior; não limpar automaticamente
                    }}
                    onCrop={(blob) => {
                        // blob -> salvar localmente e preparar para envio
                        setCroppedBlob(blob);
                        setCropping(false);
                        // preview instantâneo (uso URL para mostrar antes do upload)
                        setAvatarPreview(URL.createObjectURL(blob));
                    }}
                />
            )}
        </div>
    );
}
