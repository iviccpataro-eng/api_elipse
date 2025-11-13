import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import DisciplineSidebar from "../components/DisciplineSideBar";
import EquipmentGrid from "../components/EquipamentGrid";
import { jwtDecode } from "jwt-decode";

export default function Eletrica() {
    const [dados, setDados] = useState({ estrutura: {}, detalhes: {} });
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const navigate = useNavigate();

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    const token = localStorage.getItem("authToken");
    const user = token ? jwtDecode(token) : null;
    const refreshTime = (user?.refreshTime || 10) * 1000;

    // 🔹 Buscar dados da disciplina Elétrica
    const fetchEletrica = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/dados/EL`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log("📡 Retorno da API /dados/EL:", data);

            // --- Ajuste para o formato atual da API ---
            const estrutura = data?.EL?.Principal || {}; // raiz dos pavimentos e equipamentos
            const detalhes = data?.structureDetails || {}; // detalhes com nomes, descrições etc.

            if (estrutura && Object.keys(estrutura).length > 0) {
                setDados({ estrutura, detalhes });
                setErro("");
            } else {
                setErro("Sem dados de Elétrica até o momento.");
            }
        } catch (err) {
            console.error("Erro no fetch:", err);
            setErro("Falha na comunicação com a API.");
        } finally {
            setLoading(false);
        }
    }, [API_BASE, token]);

    // 🔁 Atualização automática
    useEffect(() => {
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        fetchEletrica();
        const refreshInterval = setInterval(fetchEletrica, refreshTime);
        return () => clearInterval(refreshInterval);
    }, [fetchEletrica, refreshTime]);

    // ---------------- Renderização ----------------
    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados da Elétrica...
            </div>
        );

    const { estrutura, detalhes } = dados;

    const handleEquipamentoClick = (tag) => {
        // exemplo: EL/Principal/PAV01/MM_01_01
        navigate(`/eletrica/equipamento/${encodeURIComponent(tag)}`);
    };

    const renderEquipamentos = () => {
        if (!selectedBuilding && !selectedFloor) {
            return (
                <div className="flex items-center justify-center h-full text-gray-300 select-none">
                    <span className="text-lg italic">
                        Selecione o prédio ou pavimento ao lado
                    </span>
                </div>
            );
        }

        if (selectedBuilding && !selectedFloor) {
            const pavimentos = estrutura[selectedBuilding] || estrutura;
            const pavimentosOrdenados = Object.entries(pavimentos).sort(([a], [b]) => {
                const ordA =
                    Object.values(detalhes).find(
                        (d) => d?.pavimento === a || d?.floor === a
                    )?.ordPav ?? 0;
                const ordB =
                    Object.values(detalhes).find(
                        (d) => d?.pavimento === b || d?.floor === b
                    )?.ordPav ?? 0;
                return ordB - ordA;
            });

            return (
                <div className="space-y-6">
                    {pavimentosOrdenados.map(([pav, equipamentos]) => (
                        <div key={pav} className="bg-white rounded-2xl shadow-md p-4">
                            <h2 className="text-xl font-semibold mb-4">
                                {
                                    Object.values(detalhes).find(
                                        (d) => d?.pavimento === pav || d?.floor === pav
                                    )?.floor || pav
                                }
                            </h2>
                            <EquipmentGrid
                                equipamentos={Object.keys(equipamentos)}
                                selectedBuilding={selectedBuilding}
                                selectedFloor={pav}
                                detalhes={detalhes}
                                onClick={(equipTag) =>
                                    handleEquipamentoClick(
                                        `EL/${selectedBuilding}/${pav}/${equipTag}`
                                    )
                                }
                            />
                        </div>
                    ))}
                </div>
            );
        }

        if (selectedBuilding && selectedFloor) {
            const equipamentos =
                estrutura[selectedBuilding]?.[selectedFloor] ||
                estrutura[selectedFloor] ||
                [];

            return (
                <div className="bg-white rounded-2xl shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedBuilding} —{" "}
                        {
                            Object.values(detalhes).find(
                                (d) =>
                                    d?.pavimento === selectedFloor ||
                                    d?.floor === selectedFloor
                            )?.floor || selectedFloor
                        }
                    </h2>
                    <EquipmentGrid
                        equipamentos={Object.keys(equipamentos)}
                        selectedBuilding={selectedBuilding}
                        selectedFloor={selectedFloor}
                        detalhes={detalhes}
                        onClick={(equipTag) =>
                            handleEquipamentoClick(
                                `EL/${selectedBuilding}/${selectedFloor}/${equipTag}`
                            )
                        }
                    />
                </div>
            );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r pt-20 p-4 shadow-md overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Elétrica
                </h2>

                {estrutura && Object.keys(estrutura).length > 0 ? (
                    <DisciplineSidebar
                        estrutura={estrutura}
                        onSelectBuilding={(b) => {
                            setSelectedBuilding(b);
                            setSelectedFloor(null);
                        }}
                        onSelectFloor={(f) => setSelectedFloor(f)}
                    />
                ) : (
                    <p className="text-gray-400 italic text-sm">
                        Sem dados de Elétrica até o momento.
                    </p>
                )}
            </aside>

            <main className="flex-1 pt-20 p-6 overflow-y-auto">
                {erro && Object.keys(estrutura).length === 0 ? (
                    <div className="text-center text-gray-400 italic">{erro}</div>
                ) : (
                    renderEquipamentos()
                )}
            </main>
        </div>
    );
}
