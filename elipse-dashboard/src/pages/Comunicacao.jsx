import React, { useEffect, useState, useCallback } from "react";
import { RefreshCcw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import CommTree from "../components/communication/CommTree";
import { apiFetch } from "../utils/apiFetch";

export default function Comunicacao() {
    const navigate = useNavigate();

    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // ============================================================
    // Carregar dados da árvore de comunicação
    // ============================================================
    const carregarDados = useCallback(async () => {
        setIsRefreshing(true);

        const result = await apiFetch(`${API_BASE}/comms/tree/all`, {}, navigate);

        if (!result) return;

        if (result.tree) {
            setDados(result.tree);
            setErro("");
        } else {
            setErro("Erro ao carregar estrutura de comunicação.");
        }

        setLoading(false);
        setIsRefreshing(false);
    }, [API_BASE, navigate]);

    // Atualização automática
    useEffect(() => {
        carregarDados();

        const refreshTime =
            Number(localStorage.getItem("refreshTime")) || 15000;

        const interval = setInterval(carregarDados, refreshTime);

        return () => clearInterval(interval);
    }, [carregarDados]);

    // ============================================================
    // Estados de carregamento / erro
    // ============================================================
    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando comunicação...
            </div>
        );

    if (erro)
        return (
            <div className="p-6 text-center text-red-500 font-medium">
                {erro}
            </div>
        );

    // ============================================================
    // Interface final
    // ============================================================
    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-6">
            <div className="max-w-7xl mx-auto">

                {/* Topo */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    {/* Botão atualizar */}
                    <button
                        onClick={carregarDados}
                        className={`flex items-center gap-1 text-sm px-3 py-1 border rounded-md transition ${isRefreshing
                            ? "opacity-50 pointer-events-none"
                            : ""
                            }`}
                    >
                        <RefreshCcw
                            className={`w-4 h-4 ${isRefreshing
                                ? "animate-spin text-blue-500"
                                : ""
                                }`}
                        />
                        Atualizar
                    </button>
                </div>

                {/* Cabeçalho */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Comunicação de Controladoras
                    </h1>

                    <p className="text-gray-500 mb-1">
                        Estrutura hierárquica de gateways, mestres e equipamentos escravos.
                    </p>

                    <p className="text-sm text-gray-400">
                        Atualização automática ativa a cada{" "}
                        {Number(localStorage.getItem("refreshTime")) || 15000}ms.
                    </p>
                </div>

                {/* Árvore */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <CommTree />
                </div>
            </div>
        </div>
    );
}
