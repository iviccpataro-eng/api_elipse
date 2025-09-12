import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const invite = searchParams.get("invite");

    const [user, setUser] = useState("");
    const [senha, setSenha] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!invite) {
            setError("Link de convite inválido ou ausente.");
        }
    }, [invite]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!user || !senha || !confirm) {
            setError("Preencha todos os campos.");
            return;
        }
        if (senha !== confirm) {
            setError("As senhas não coincidem.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/usuarios/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${invite}`, // adminApi gerou o convite
                },
                body: JSON.stringify({ user, senha }),
            });

            const data = await res.json();
            if (!res.ok) {
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
                {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
                {success && <div className="mb-3 text-sm text-green-600">{success}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Usuário</label>
                        <input
                            type="text"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm"
                            placeholder="Digite seu usuário"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm"
                            placeholder="Digite sua senha"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-xl shadow-sm text-sm"
                            placeholder="Confirme sua senha"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!invite}
                        className="w-full px-3 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                    >
                        Criar Conta
                    </button>
                </form>
            </div>
        </div>
    );
}
