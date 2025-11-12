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

    const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";
    const token = localStorage.getItem("authToken");
    const user = token ? jwtDecode(token) : null;
    const refreshTime = ((user?.refreshtime || 10) * 1000);

    // 🔹 Buscar dados da disciplina Elétrica
    const fetchEletrica = useCallback(async () => {
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/dados/EL`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401 || res.status === 403) {
                setErro("Acesso negado. Faça login novamente.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log("📡 Retorno da API /dados/EL:", data);

            // 🧩 Ajuste automático da estrutura
            let estrutura = {};
            let detalhes = {};

            if (data.estrutura) {
                // Caso venha encapsulado (ex: { estrutura: {...}, detalhes: {...} })
                estrutura = data.estrutura;
                detalhes = data.detalhes || {};
            } else if (data.structure) {
                // Caso venha no formato generateFrontendData()
                estrutura = data.structure;
                detalhes = data.structureDetails || {};
            } else {
                // Caso venha direto (ex: { "Principal": {...} })
                estrutura = data;
                detalhes = data.structureDetails || {};
            }

            // Define no estado
            setDados({ estrutura, detalhes });
            setErro("");
        } catch (err) {
            console.error("Erro no fetch:", err);
            setErro("Falha na comunicação com a API.");
        } finally {
            setLoading(false);
        }
    }, [API_BASE, token]);

    // 🔁 Atualização automática
    useEffect(() => {
        fetchEletrica();
        const interval = setInterval(fetchEletrica, refreshTime);
        return () => clearInterval(interval);
    }, [fetchEletrica, refreshTime]);

    // ---------------- Renderização ----------------

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados da Elétrica...
            </div>
        );

    if (erro)
        return (
            <div className="p-6 text-center text-red-500 font-medium">
                {erro}
            </div>
        );

    const { estrutura, detalhes } = dados;

    const handleEquipamentoClick = (tag) => {
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
            const pavimentos = estrutura[selectedBuilding] || {};
            const pavimentosOrdenados = Object.entries(pavimentos).sort(([a], [b]) => {
                const ordA =
                    Object.values(detalhes).find((d) => d?.pavimento === a)?.ordPav ?? 0;
                const ordB =
                    Object.values(detalhes).find((d) => d?.pavimento === b)?.ordPav ?? 0;
                return ordB - ordA;
            });

            return (
                <div className="space-y-6">
                    {pavimentosOrdenados.map(([pav, equipamentos]) => (
                        <div key={pav} className="bg-white rounded-2xl shadow-md p-4">
                            <h2 className="text-xl font-semibold mb-4">{pav}</h2>
                            <EquipmentGrid
                                equipamentos={Object.keys(equipamentos)}
                                selectedBuilding={selectedBuilding}
                                selectedFloor={pav}
                                detalhes={detalhes}
                                onClick={handleEquipamentoClick}
                            />
                        </div>
                    ))}
                </div>
            );
        }

        if (selectedBuilding && selectedFloor) {
            const equipamentos = estrutura[selectedBuilding]?.[selectedFloor] || {};
            return (
                <div className="bg-white rounded-2xl shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedBuilding} — {selectedFloor}
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
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r pt-20 p-4 shadow-md overflow-y-auto">
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

            <main className="flex-1 pt-20 p-6 overflow-y-auto">
                {renderEquipamentos()}
            </main>
        </div>
    );
}
