// src/pages/Equipamento.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import VariableCard from "../components/VariableCard.jsx";

export default function Equipamento() {
    const { tag } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // 🔹 Função principal de carregamento
    const carregarDados = useCallback(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        setIsRefreshing(true);
        fetch(`${API_BASE}/equipamento/${encodeURIComponent(tag)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("📡 Retorno da API Equipamento:", data);
                if (data.ok) {
                    setDados(data.dados);
                    setErro("");
                } else {
                    setErro(data.erro || "Erro ao carregar dados do equipamento.");
                }
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => {
                setLoading(false);
                setIsRefreshing(false);
            });
    }, [tag, API_BASE]);

    // 🔄 Atualização automática
    useEffect(() => {
        carregarDados();
        const refreshTime = localStorage.getItem("refreshTime") || 15000;
        const interval = setInterval(carregarDados, parseInt(refreshTime, 10));
        return () => clearInterval(interval);
    }, [carregarDados]);

    // 🔸 Estados de carregamento e erro
    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados do equipamento...
            </div>
        );

    if (erro)
        return <div className="p-6 text-center text-red-500 font-medium">{erro}</div>;

    // 🔹 Dados gerais do equipamento
    const info = dados?.info || {};
    const variaveis = Array.isArray(dados?.data) ? dados.data : [];

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-6">
            <div className="max-w-6xl mx-auto">
                {/* 🔙 Botão Voltar + Atualizar */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <button
                        onClick={carregarDados}
                        className={`flex items-center gap-1 text-sm px-3 py-1 border rounded-md ${isRefreshing ? "opacity-50 pointer-events-none" : "hover:bg-blue-50"
                            } transition`}
                    >
                        <RefreshCcw
                            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`}
                        />
                        Atualizar
                    </button>
                </div>

                {/* 🔹 Cabeçalho do equipamento */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {info.name || tag}
                    </h1>
                    <p className="text-gray-500 mb-1">
                        {info.descricao || info.description || "Equipamento sem descrição"}
                    </p>
                    <p className="text-sm text-gray-400">
                        {info.fabricante && `${info.fabricante}`}
                        {info.modelo && ` • ${info.modelo}`}
                        {info.statusComunicacao && ` • Comunicação: ${info.statusComunicacao}`}
                        {info.ultimaAtualizacao &&
                            ` • Último envio: ${new Date(
                                info.ultimaAtualizacao
                            ).toLocaleString("pt-BR")}`}
                    </p>
                </div>

                {/* 🔹 Renderização das variáveis */}
                {variaveis.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {variaveis.map((variavel, i) => (
                            <VariableCard key={i} variavel={variavel} equipamentoTag={tag} />
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-400 text-center py-10">
                        Nenhuma grandeza disponível para este equipamento.
                    </div>
                )}
            </div>
        </div>
    );
}
