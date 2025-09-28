import React, { useState } from "react";

const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

export default function UpdateProfile({ token }) {
    const [fullname, setFullname] = useState("");
    const [matricula, setMatricula] = useState("");
    const [senha, setSenha] = useState("");
    const [message, setMessage] = useState("");

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const res = await fetch(`${API_BASE}/auth/update-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ fullname, matricula, senha }),
            });

            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.erro || "Erro ao atualizar perfil.");
            }

            setMessage("Perfil atualizado com sucesso!");
            setSenha(""); // limpa senha após salvar
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">Configurações de Usuário</h2>

            {message && <div className="mb-2 text-sm">{message}</div>}

            <form onSubmit={handleUpdate} className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Nome completo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-xl text-sm"
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
                        className="mt-1 block w-full px-3 py-2 border rounded-xl text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Nova senha
                    </label>
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border rounded-xl text-sm"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full px-3 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                >
                    Salvar alterações
                </button>
            </form>
        </div>
    );
}
