// src/pages/Eletrica.jsx
import React, { useEffect, useState } from "react";

export default function Eletrica() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        fetch(`${API_BASE}/eletrica`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) setDados(data.dados);
                else setErro(data.erro || "Erro ao carregar dados.");
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-6">Carregando dados da Elétrica...</div>;
    if (erro) return <div className="p-6 text-red-500">{erro}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">📊 Elétrica</h1>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(dados, null, 2)}
            </pre>
        </div>
    );
}
