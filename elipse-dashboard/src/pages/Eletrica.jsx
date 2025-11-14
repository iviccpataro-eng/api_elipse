// Eletrica.jsx — VERSÃO FINAL CORRIGIDA
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import DisciplineSidebar from "../components/DisciplineSideBar";
import EquipmentGrid from "../components/EquipamentGrid";
import { jwtDecode } from "jwt-decode";

export default function Eletrica() {
    const [estrutura, setEstrutura] = useState({});
    const [detalhes, setDetalhes] = useState({});
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);

    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";
    const token = localStorage.getItem("authToken");
    const user = token ? jwtDecode(token) : null;
    const refreshTime = (user?.refreshTime || 10) * 1000;

    // 🚀 Fetch Elétrica
    const fetchEletrica = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/dados/EL`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            console.log("📡 Dados recebidos da API:", data);

            // Estrutura correta é data.EL.Principal
            setEstrutura(data?.EL?.Principal || {});

            // Detalhes completos
            setDetalhes(data?.structureDetails || {});
            setErro("");
        } catch (err) {
            console.error("❌ Erro no fetch:", err);
            setErro("Falha ao comunicar com a API.");
        } finally {
            setLoading(false);
        }
    }, [API_BASE, token]);

    useEffect(() => {
        if (!token) {
            setErro("Token não encontrado.");
            setLoading(false);
            return;
        }

        fetchEletrica();
        const interval = setInterval(fetchEletrica, refreshTime);
        return () => clearInterval(interval);
    }, [fetchEletrica, refreshTime]);

    const handleEquipamentoClick = (tag) => {
        navigate(`/eletrica/equipamento/${encodeURIComponent(tag)}`);
    };

    // ------------------------------
    // RENDER DOS EQUIPAMENTOS
    // ------------------------------
    const renderEquipamentos = () => {
        if (!selectedBuilding)
            return (
                <div className="flex items-center justify-center h-full text-gray-300 italic">
                    Selecione um prédio ou pavimento ao lado.
                </div>
            );

        // Exibe pavimentos ao clicar só no prédio
        if (selectedBuilding && !selectedFloor) {
            const pavimentos = estrutura[selectedBuilding] || {};

            const pavOrdenados = Object.entries(pavimentos).sort(([keyA, pavA], [keyB, pavB]) => {
                const eqA = Object.values(pavA)[0];
                const eqB = Object.values(pavB)[0];

                return Number(eqB?.info?.[0]?.ordPav || 0) - Number(eqA?.info?.[0]?.ordPav || 0);
            });

            return (
                <div className="space-y-6">
                    {pavOrdenados.map(([pavKey, equipamentos]) => {
                        const primeiroEq = Object.values(equipamentos)[0];
                        const nomePav = primeiroEq?.info?.[0]?.floor || pavKey;

                        return (
                            <div key={pavKey} className="bg-white rounded-2xl p-4 shadow">
                                <h2 className="text-xl font-semibold mb-4">{nomePav}</h2>

                                <EquipmentGrid
                                    equipamentos={Object.keys(equipamentos)}
                                    selectedBuilding={selectedBuilding}
                                    selectedFloor={pavKey}
                                    detalhes={detalhes}
                                    onClick={handleEquipamentoClick}
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Exibe equipamentos de um pavimento específico
        const equipamentos = estrutura[selectedBuilding]?.[selectedFloor] || {};

        return (
            <div className="bg-white rounded-2xl p-4 shadow">
                <h2 className="text-xl font-semibold mb-4">
                    {selectedBuilding} —{" "}
                    {Object.values(equipamentos)[0]?.info?.[0]?.floor || selectedFloor}
                </h2>

                <EquipmentGrid
                    equipamentos={Object.keys(equipamentos)}
                    selectedBuilding={selectedBuilding}
                    selectedFloor={selectedFloor}
                    detalhes={detalhes}
                    onClick={handleEquipamentoClick}
                />
            </div>
        );
    };

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados da Elétrica...
            </div>
        );

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r pt-20 p-4 shadow overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Elétrica
                </h2>

                <DisciplineSidebar
                    estrutura={estrutura}
                    onSelectBuilding={(b) => {
                        setSelectedBuilding(b);
                        setSelectedFloor(null);
                    }}
                    onSelectFloor={(f) => setSelectedFloor(f)}
                />
            </aside>

            {/* Área Principal */}
            <main className="flex-1 pt-20 p-6 overflow-y-auto">{renderEquipamentos()}</main>
        </div>
    );
}
