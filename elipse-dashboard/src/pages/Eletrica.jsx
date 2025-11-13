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

            if (!res.ok) {
                setErro(`Erro ${res.status}: falha ao carregar dados.`);
                setLoading(false);
                return;
            }

            const data = await res.json();
            console.log("📡 Retorno da API /dados/EL:", data);

            const estrutura = data?.EL?.Principal || {};
            const detalhes = data?.structureDetails || {};

            setDados({ estrutura, detalhes });
            setErro("");
        } catch (err) {
            console.error("Erro no fetch:", err);
            setErro("Falha na comunicação com a API.");
        } finally {
            setLoading(false);
        }
    }, [API_BASE, token]);

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
                <div className="flex items-center justify-center h-full text-gray-400 select-none italic">
                    Selecione um pavimento ao lado.
                </div>
            );
        }

        if (selectedFloor) {
            const equipamentos = estrutura[selectedFloor] || {};
            const detalhesEquip = Object.keys(equipamentos).map((equipKey) => {
                const path = `EL/Principal/${selectedFloor}/${equipKey}`;
                const det = detalhes[path] || {};
                return {
                    tag: equipKey,
                    name: det.name || equipKey,
                    description: det.description || "Sem descrição",
                    communication: det.communication || det.statusComunicacao || "FAIL!",
                };
            });

            const pavimentoNome = Object.values(detalhes)
                .find((d) => d.floor === selectedFloor)?.floor || selectedFloor;

            return (
                <div className="bg-white rounded-2xl shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedBuilding || "Principal"} — {pavimentoNome}
                    </h2>
                    <EquipmentGrid
                        equipamentos={detalhesEquip}
                        selectedBuilding={selectedBuilding || "Principal"}
                        selectedFloor={selectedFloor}
                        detalhes={detalhes}
                        onClick={(equipTag) =>
                            handleEquipamentoClick(`EL/Principal/${selectedFloor}/${equipTag}`)
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
                        onSelectBuilding={(b) => setSelectedBuilding(b)}
                        onSelectFloor={(f) => {
                            setSelectedBuilding("Principal");
                            setSelectedFloor(f);
                        }}
                    />
                ) : (
                    <p className="text-gray-400 italic text-sm">
                        Sem dados de Elétrica até o momento.
                    </p>
                )}
            </aside>

            <main className="flex-1 pt-20 p-6 overflow-y-auto">{renderEquipamentos()}</main>
        </div>
    );
}
