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

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";
    const token = localStorage.getItem("authToken");
    const user = token ? jwtDecode(token) : null;
    const refreshTime = (user?.refreshTime || 10) * 1000;

    // 🔹 Constrói detalhes automaticamente com base na estrutura real
    const buildDetails = (rawStructure) => {
        const out = {};

        if (!rawStructure) return out;

        Object.entries(rawStructure).forEach(([building, floors]) => {
            Object.entries(floors).forEach(([floorKey, equips]) => {
                Object.entries(equips).forEach(([tag, info]) => {
                    out[tag] = {
                        tag,
                        name: info?.name || tag,
                        description: info?.description || "Sem descrição",
                        communication: info?.communication || "FAIL!",
                        floor: info?.floor || floorKey,
                        building
                    };
                });
            });
        });

        return out;
    };

    // 🔹 Buscar dados da disciplina Elétrica
    const fetchEletrica = useCallback(async () => {
        console.group("🔄 [Eletrica] Iniciando fetch...");
        try {
            const res = await fetch(`${API_BASE}/dados/EL`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("📡 Status:", res.status);

            const data = await res.json();
            console.log("📡 Dados recebidos:", data);

            // ✔️ Agora lendo o caminho correto SEM AMBIGUIDADES
            const estruturaPronta = data?.EL?.Principal || {};

            console.log("🏗 Estrutura final:", estruturaPronta);

            const detalhesGerados = buildDetails(estruturaPronta);

            console.log("📘 Detalhes reconstruídos:", detalhesGerados);

            if (Object.keys(estruturaPronta).length === 0) {
                setErro("Sem dados de Elétrica até o momento.");
            }

            setEstrutura(estruturaPronta);
            setDetalhes(detalhesGerados);

        } catch (err) {
            console.error("❌ Erro no fetch:", err);
            setErro("Falha na comunicação com a API.");
        } finally {
            console.groupEnd();
            setLoading(false);
        }
    }, [API_BASE, token]);

    useEffect(() => {
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        fetchEletrica();
        const interval = setInterval(fetchEletrica, refreshTime);
        return () => clearInterval(interval);
    }, [fetchEletrica, refreshTime]);

    // ==================== RENDER ==================== //

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados da Elétrica...
            </div>
        );

    const handleEquipamentoClick = (tag) => {
        console.log("🖱️ Equipamento clicado:", tag);
        navigate(`/eletrica/equipamento/${encodeURIComponent(tag)}`);
    };

    const renderEquipamentos = () => {
        if (!selectedBuilding || !selectedFloor) {
            return (
                <div className="flex items-center justify-center h-full text-gray-300 italic">
                    Selecione o pavimento ao lado
                </div>
            );
        }

        const equips = estrutura[selectedBuilding]?.[selectedFloor] || {};

        const lista = Object.keys(equips).map((tag) => detalhes[tag]);

        const nomePav =
            lista[0]?.floor ||
            selectedFloor;

        return (
            <div className="bg-white rounded-2xl shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">
                    {selectedBuilding} — {nomePav}
                </h2>

                <EquipmentGrid
                    equipamentos={lista}
                    onClick={handleEquipamentoClick}
                />
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-white border-r pt-20 p-4 shadow-md overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Elétrica
                </h2>

                {Object.keys(estrutura).length > 0 ? (
                    <DisciplineSidebar
                        estrutura={estrutura}
                        onSelectBuilding={setSelectedBuilding}
                        onSelectFloor={setSelectedFloor}
                    />
                ) : (
                    <p className="text-gray-400 italic text-sm">
                        Sem dados de Elétrica até o momento.
                    </p>
                )}
            </aside>

            <main className="flex-1 pt-20 p-6 overflow-y-auto">
                {renderEquipamentos()}
            </main>
        </div>
    );
}
