// src/pages/Equipamento.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    RefreshCcw,
    LayoutGrid,
    List,
    FileText,
} from "lucide-react";
import VariableCard from "../components/VariableCard.jsx";

export default function Equipamento() {
    const { tag } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [layoutMode, setLayoutMode] = useState(
        localStorage.getItem("layoutMode") || "cards"
    );

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

    // 💾 Persistir layout preferido
    useEffect(() => {
        localStorage.setItem("layoutMode", layoutMode);
    }, [layoutMode]);

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
                {/* 🔙 Botão Voltar + Atualizar + Seletor de Layout */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <div className="flex items-center gap-4">
                        {/* 🔘 Seletor de layout */}
                        <div className="flex items-center gap-3">
                            <LayoutGrid
                                onClick={() => setLayoutMode("cards")}
                                className={`w-5 h-5 cursor-pointer transition ${layoutMode === "cards"
                                        ? "text-blue-600"
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                            />
                            <List
                                onClick={() => setLayoutMode("list")}
                                className={`w-5 h-5 cursor-pointer transition ${layoutMode === "list"
                                        ? "text-blue-600"
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                            />
                            <FileText
                                onClick={() => setLayoutMode("detailed")}
                                className={`w-5 h-5 cursor-pointer transition ${layoutMode === "detailed"
                                        ? "text-blue-600"
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                            />
                        </div>

                        {/* 🔁 Botão Atualizar */}
                        <button
                            onClick={carregarDados}
                            className={`flex items-center gap-1 text-sm px-3 py-1 border rounded-md transition ${isRefreshing
                                    ? "opacity-50 pointer-events-none"
                                    : "hover:bg-blue-50"
                                }`}
                        >
                            <RefreshCcw
                                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-500" : ""
                                    }`}
                            />
                            Atualizar
                        </button>
                    </div>
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
                    <>
                        {layoutMode === "cards" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {variaveis.map((variavel, i) => (
                                    <VariableCard
                                        key={i}
                                        variavel={variavel}
                                        equipamentoTag={tag}
                                    />
                                ))}
                            </div>
                        )}

                        {layoutMode === "list" && (
                            <div className="bg-white rounded-xl shadow divide-y">
                                {variaveis.map((v, i) => {
                                    const [tipo, nome, valor, unidade] = v;
                                    return (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center px-4 py-3 hover:bg-gray-50"
                                        >
                                            <span className="font-medium text-gray-700">
                                                {nome}
                                            </span>
                                            <span className="text-gray-900">
                                                {valor} {unidade}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {layoutMode === "detailed" && (
                            <div className="bg-white rounded-xl shadow divide-y">
                                {variaveis.map((v, i) => {
                                    const [tipo, nome, valor, unidade, , nominal] = v;
                                    return (
                                        <div
                                            key={i}
                                            className="grid grid-cols-4 px-4 py-3 text-sm hover:bg-gray-50"
                                        >
                                            <div className="font-semibold text-gray-700">
                                                {nome}
                                            </div>
                                            <div className="text-gray-600">{tipo}</div>
                                            <div className="text-gray-900">
                                                {valor} {unidade}
                                            </div>
                                            <div className="text-gray-500">
                                                Nominal: {nominal ?? "-"}
                                                {unidade}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-gray-400 text-center py-10">
                        Nenhuma grandeza disponível para este equipamento.
                    </div>
                )}
            </div>
        </div>
    );
}
