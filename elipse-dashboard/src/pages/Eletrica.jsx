import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import DisciplineSidebar from "../components/DisciplineSideBar";
import EquipmentGrid from "../components/EquipamentGrid";
import { jwtDecode } from "jwt-decode";
import { getRealFloorName } from "../utils/getRealFloorName";

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

    const fetchEletrica = useCallback(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        fetch(`${API_BASE}/estrutura`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setEstrutura(data.EL || {});
                setDetalhes(data.structureDetails || {});
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => setLoading(false));
    }, [API_BASE]);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const user = jwtDecode(token);
        const refreshTime = (user?.refreshtime || 15) * 1000;

        fetchEletrica();
        const interval = setInterval(fetchEletrica, Math.max(5000, refreshTime));

        return () => clearInterval(interval);
    }, [fetchEletrica]);

    const handleEquipamentoClick = (tag) => {
        navigate(`/eletrica/equipamento/${encodeURIComponent(tag)}`);
    };

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados da Elétrica...
            </div>
        );

    if (erro)
        return <div className="p-6 pt-20 text-center text-red-500 font-medium">{erro}</div>;

    let contentToRender;

    // 🔹 Tela quando usuário clicou em Pavimento
    if (selectedBuilding && selectedFloor) {
        const equipamentos = Object.keys(
            estrutura[selectedBuilding]?.[selectedFloor] || {}
        );

        contentToRender = (
            <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {selectedBuilding} - {getRealFloorName(selectedBuilding, selectedFloor, detalhes)}
                </h2>

                <EquipmentGrid
                    equipamentos={equipamentos}
                    selectedBuilding={selectedBuilding}
                    selectedFloor={selectedFloor}
                    detalhes={detalhes}
                    onClick={handleEquipamentoClick}
                    disciplineCode="EL"
                />
            </div>
        );
    }

    // 🔹 Tela quando usuário clicou apenas no prédio
    else if (selectedBuilding) {
        const pavimentos = estrutura[selectedBuilding] || {};

        const pavimentosOrdenados = Object.entries(pavimentos).sort(([a], [b]) => {
            const ord = (floorKey) => {
                const tag = Object.keys(detalhes).find((t) =>
                    t.includes(`/${selectedBuilding}/${floorKey}/`)
                );
                return tag ? detalhes[tag]?.ordPav ?? 0 : 0;
            };
            return ord(b) - ord(a);
        });

        contentToRender = (
            <div className="space-y-6">
                {pavimentosOrdenados.map(([pavKey, equipamentosObj]) => (
                    <div key={pavKey} className="bg-white rounded-2xl shadow p-4">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            {selectedBuilding} - {getRealFloorName(selectedBuilding, pavKey, detalhes)}
                        </h2>

                        <EquipmentGrid
                            equipamentos={Object.keys(equipamentosObj)}
                            selectedBuilding={selectedBuilding}
                            selectedFloor={pavKey}
                            detalhes={detalhes}
                            onClick={handleEquipamentoClick}
                            disciplineCode="EL"
                        />
                    </div>
                ))}
            </div>
        );
    }

    // 🔹 Nenhuma seleção ainda
    else {
        contentToRender = (
            <div className="flex items-center justify-center h-full text-gray-400 select-none">
                <span className="text-lg italic">
                    Selecione um prédio ou pavimento ao lado
                </span>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 pt-16">
            <aside className="w-64 bg-white border-r p-4 shadow-sm overflow-y-auto fixed top-16 left-0 h-[calc(100vh-4rem)]">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2 sticky top-0 bg-white py-2 -mt-4 z-10 border-b">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Elétrica
                </h2>

                <DisciplineSidebar
                    estrutura={estrutura}
                    detalhes={detalhes}
                    selectedBuilding={selectedBuilding}
                    selectedFloor={selectedFloor}
                    onSelectBuilding={(b) => {
                        setSelectedBuilding(b);
                        setSelectedFloor(null);
                    }}
                    onSelectFloor={(b, f) => {
                        setSelectedBuilding(b);
                        setSelectedFloor(f);
                    }}
                />
            </aside>

            <main className="flex-1 p-6 ml-64">
                {contentToRender}
            </main>
        </div>
    );
}
