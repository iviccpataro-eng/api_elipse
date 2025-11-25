import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    RefreshCcw,
    LayoutGrid,
    List,
    FileText,
} from "lucide-react";

import VariableCard from "../components/VariableCard";
import VariableRow from "../components/VariableRow";
import VariableSimpleRow from "../components/VariableSimpleRow";
//import { normalizeVariable } from "../utils/normalizeVariable";

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

    // ------------ Carregar dados ----------------
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
                if (data.ok) {
                    setDados(data.dados);
                    setErro("");
                } else {
                    setErro(data.erro || "Erro ao carregar dados.");
                }
            })
            .catch(() => setErro("Falha na comunicação com a API"))
            .finally(() => {
                setLoading(false);
                setIsRefreshing(false);
            });
    }, [tag, API_BASE]);

    useEffect(() => {
        carregarDados();
        const refreshTime = localStorage.getItem("refreshTime") || 15000;

        const interval = setInterval(carregarDados, refreshTime);

        return () => clearInterval(interval);
    }, [carregarDados]);

    useEffect(() => {
        localStorage.setItem("layoutMode", layoutMode);
    }, [layoutMode]);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados do equipamento...
            </div>
        );

    if (erro)
        return (
            <div className="p-6 text-center text-red-500 font-medium">{erro}</div>
        );

    const info = dados?.info || {};
    const variaveis = Array.isArray(dados?.data) ? dados.data : [];

    const ultimaAtualizacao = info["last-send"]
        ? new Date(info["last-send"]).toLocaleString("pt-BR")
        : null;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-6">
            <div className="max-w-6xl mx-auto">
                {/* topo */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <div className="flex items-center gap-4">
                        {/* layouts */}
                        <div className="flex items-center gap-3">
                            <LayoutGrid
                                onClick={() => setLayoutMode("cards")}
                                className={`w-5 h-5 cursor-pointer transition ${layoutMode === "cards"
                                    ? "text-blue-600 scale-110"
                                    : "text-gray-400"
                                    }`}
                            />

                            <List
                                onClick={() => setLayoutMode("list")}
                                className={`w-5 h-5 cursor-pointer transition ${layoutMode === "list"
                                    ? "text-blue-600 scale-110"
                                    : "text-gray-400"
                                    }`}
                            />

                            <FileText
                                onClick={() => setLayoutMode("detailed")}
                                className={`w-5 h-5 cursor-pointer transition ${layoutMode === "detailed"
                                    ? "text-blue-600 scale-110"
                                    : "text-gray-400"
                                    }`}
                            />
                        </div>

                        <button
                            onClick={carregarDados}
                            className={`flex items-center gap-1 text-sm px-3 py-1 border rounded-md transition ${isRefreshing ? "opacity-50 pointer-events-none" : ""
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

                {/* cabeçalho */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {info.name || tag}
                    </h1>

                    <p className="text-gray-500 mb-1">
                        {info.description || "Equipamento sem descrição"}
                    </p>

                    <p className="text-sm text-gray-400 flex flex-wrap gap-x-2">
                        {info.producer && <span>{info.producer}</span>}
                        {info.model && <span>• {info.model}</span>}
                        {info.communication && (
                            <span>• Comunicação: {info.communication}</span>
                        )}
                        {ultimaAtualizacao && <span>• Último envio: {ultimaAtualizacao}</span>}
                    </p>
                </div>

                {/* valores */}
                {variaveis.length > 0 ? (
                    <>
                        {/* modo cards */}
                        {layoutMode === "cards" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
                                {variaveis.map((v, i) => (
                                    <VariableCard
                                        key={i}
                                        variavel={v}
                                        equipamentoTag={tag}
                                    />
                                ))}
                            </div>
                        )}

                        {/* modo lista */}
                        {layoutMode === "list" && (
                            <div className="bg-white rounded-xl shadow animate-fadeIn">

                                {/* Cabeçalho da tabela */}
                                <div className="grid grid-cols-4 px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-sm border-b">
                                    <div>Nome</div>
                                    <div>Valor</div>
                                </div>

                                {variaveis.map((v, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-4 px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-none"
                                    >
                                        <VariableSimpleRow variavel={v} />
                                    </div>
                                ))}

                            </div>
                        )}

                        {/* modo detalhado */}
                        {layoutMode === "detailed" && (
                            <div className="bg-white rounded-xl shadow animate-fadeIn">
                                {/* Cabeçalho */}
                                <div className="grid grid-cols-4 px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-sm border-b">
                                    <div>Nome</div>
                                    <div className="hidden xl:flex">Tipo</div>
                                    <div>Valor</div>
                                    <div>Nominal</div>
                                </div>

                                {variaveis.map((v, i) => (
                                    <div
                                        key={i}
                                        className="grid grid-cols-4 px-4 py-3 text-sm hover:bg-gray-50 border-b last:border-none"
                                    >
                                        <VariableRow variavel={v} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-gray-400 text-center py-10 animate-fadeIn">
                        Nenhuma grandeza disponível.
                    </div>
                )}
            </div>
        </div >
    );
}
