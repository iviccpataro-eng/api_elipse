// Eletrica.jsx — CORRIGIDO
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

    // 🚀 Fetch Eletricidade
    const fetchEletrica = useCallback(async () => {
        console.group("🔄 [Eletrica] Fetch...");
        try {
            const res = await fetch(`${API_BASE}/dados/EL`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            console.log("📡 Dados recebidos:", data);

            // --- Correção principal ---
            const estruturaCorrigida = data?.EL?.Principal || {};
            const detalhesCorrigidos = data?.structureDetails || {};

            setEstrutura(estruturaCorrigida);
            setDetalhes(detalhesCorrigidos);
            setErro("");
        } catch (err) {
            console.error("❌ Erro:", err);
            setErro("Falha na comunicação com a API.");
        } finally {
            setLoading(false);
            console.groupEnd();
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
                    Selecione o prédio ou pavimento ao lado.
                </div>
            );

        // Usuário clicou só no prédio → mostrar pavimentos
        if (selectedBuilding && !selectedFloor) {
            const pavimentos = estrutura[selectedBuilding] || {};

            const pavOrdenados = Object.entries(pavimentos).sort((a, b) => {
                const eqA = Object.values(pavimentos[a[0]])[0];
                const eqB = Object.values(pavimentos[b[0]])[0];
                return Number(eqB.info?.[0]?.ordPav || 0) - Number(eqA.info?.[0]?.ordPav || 0);
            });

            return (
                <div className="space-y-6">
                    {pavOrdenados.map(([pavKey, equipamentos]) => {
                        const primeiro = Object.values(equipamentos)[0];
                        const pavName = primeiro?.info?.[0]?.floor || pavKey;

                        return (
                            <div key={pavKey} className="bg-white rounded-2xl p-4 shadow">
                                <h2 className="text-xl font-semibold mb-4">{pavName}</h2>

                                <EquipmentGrid
                                    equipamentos={Object.keys(equipamentos)}
                                    detalhes={detalhes}
                                    onClick={(tag) =>
                                        handleEquipamentoClick(`EL/${selectedBuilding}/${pavKey}/${tag}`)
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Usuário clicou prédio + pavimento
        const equipamentos = estrutura[selectedBuilding]?.[selectedFloor] || {};

        return (
            <div className="bg-white rounded-2xl p-4 shadow">
                <h2 className="text-xl font-semibold mb-4">
                    {selectedBuilding} —{" "}
                    {
                        Object.values(equipamentos)[0]?.info?.[0]?.floor ||
                        selectedFloor
                    }
                </h2>

                <EquipmentGrid
                    equipamentos={Object.keys(equipamentos)}
                    detalhes={detalhes}
                    onClick={(tag) =>
                        handleEquipamentoClick(
                            `EL/${selectedBuilding}/${selectedFloor}/${tag}`
                        )
                    }
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
            <main className="flex-1 pt-20 p-6 overflow-y-auto">
                {renderEquipamentos()}
            </main>
        </div>
    );
}
