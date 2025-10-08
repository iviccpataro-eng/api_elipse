// components/RegisterPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const invite = searchParams.get("invite");

    const [username, setUsername] = useState("");
    const [fullname, setFullname] = useState("");
    const [matricula, setMatricula] = useState("");
    const [role, setRole] = useState("");
    const [senha, setSenha] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [userError, setUserError] = useState(""); // ⚠️ erro específico do campo usuário
    const [success, setSuccess] = useState("");
    const [validating, setValidating] = useState(true);
    const typingTimeoutRef = useRef(null);

    // 🔍 Valida o convite no backend
    useEffect(() => {
        if (!invite) {
            setError("Link de convite inválido ou ausente.");
            setValidating(false);
            return;
        }

        const validar = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/validate-invite?token=${invite}`);
                const data = await res.json();
                if (!data.ok) {
                    setError(data.erro || "Convite inválido ou expirado.");
                } else {
                    setRole(data.role || "user");
                }
            } catch (err) {
                setError("Erro ao validar convite.");
            } finally {
                setValidating(false);
            }
        };

        validar();
    }, [invite]);

    // 🔎 Verifica se o nome de usuário já existe (em tempo real)
    const checkUsername = async (nome) => {
        if (!nome) return;
        try {
            const res = await fetch(`${API_BASE}/auth/check-username?u=${encodeURIComponent(nome)}`);
            const data = await res.json();
            if (data.exists) {
                setUserError("Nome de usuário já cadastrado");
            } else {
                setUserError("");
            }
        } catch {
            // ignora erros de rede silenciosamente
        }
    };

    const handleUsernameChange = (e) => {
        const nome = e.target.value.trim();
        setUsername(nome);
        setUserError("");
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        // aguarda o usuário parar de digitar por 600ms
        typingTimeoutRef.current = setTimeout(() => {
            if (nome.length >= 3) checkUsername(nome);
        }, 600);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setUserError("");
        setSuccess("");

        if (!username || !fullname || !senha || !confirm) {
            setError("Preencha todos os campos obrigatórios.");
            return;
        }
        if (senha !== confirm) {
            setError("As senhas não coincidem.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: invite,
                    username,
                    senha,
                    fullname,
                    matricula,
                }),
            });

            const data = await res.json();

            if (data.erro_code === "USERNAME_TAKEN") {
                setUserError("Nome de usuário já cadastrado");
                return;
            }

            if (!res.ok || !data.ok) {
                throw new Error(data.erro || "Erro ao registrar.");
            }

            setSuccess("Usuário criado com sucesso! Redirecionando...");
            setTimeout(() => navigate("/"), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">Registrar Usuário</h1>

                {validating ? (
                    <p className="text-center text-gray-500">Validando convite...</p>
                ) : error ? (
                    <div className="text-sm text-red-600 text-center">{error}</div>
                ) : (
                    <>
                        {success && (
                            <div className="mb-3 text-sm text-green-600 text-center">{success}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Usuário */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Usuário <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    onBlur={() => checkUsername(username)}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm ${userError ? "border-red-400" : "border-gray-300"
                                        }`}
                                    placeholder="Digite o nome de usuário"
                                />
                                {userError && (
                                    <p className="text-xs text-red-500 mt-1">{userError}</p>
                                )}
                            </div>

                            {/* Nome completo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nome completo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm"
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
                                    value={matricula}
                                    onChange={(e) => setMatricula(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm"
                                    placeholder="Digite sua matrícula (opcional)"
                                />
                            </div>

                            {/* Perfil */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Perfil
                                </label>
                                <input
                                    type="text"
                                    value={role}
                                    disabled
                                    className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            {/* Senha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Senha <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm"
                                    placeholder="Digite sua senha"
                                />
                            </div>

                            {/* Confirmar Senha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Confirmar Senha <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm"
                                    placeholder="Confirme sua senha"
                                />
                            </div>

                            {/* Botão */}
                            <button
                                type="submit"
                                disabled={!invite}
                                className="w-full px-3 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                            >
                                Criar Conta
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
