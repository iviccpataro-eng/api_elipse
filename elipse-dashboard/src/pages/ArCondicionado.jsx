// src/pages/ArCondicionado.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Fan } from "lucide-react";
import DisciplineSidebar from "../components/DisciplineSideBar";
import EquipmentGrid from "../components/EquipamentGrid";
import { jwtDecode } from "jwt-decode";
import { getRealFloorName } from "../utils/getRealFloorName";

export default function ArCondicionado() {
    const [estrutura, setEstrutura] = useState({});
    const [detalhes, setDetalhes] = useState({});
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);

    const navigate = useNavigate();

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // 🔹 Função responsável por buscar toda a estrutura
    const fetchAC = useCallback(() => {
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
                setEstrutura(data.structure?.AC || {});
                setDetalhes(data.structureDetails || {});
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => setLoading(false));
    }, [API_BASE]);

    // 🔹 Configura intervalo de atualização
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const user = jwtDecode(token);
        const refreshTime = (user?.refreshtime || 10) * 1000;

        fetchAC();
        const interval = setInterval(fetchAC, Math.max(5000, refreshTime));

        return () => clearInterval(interval);
    }, [fetchAC]);

    // 🔹 Logs organizados
    useEffect(() => {
        console.group("📦 Dados Carregados");
        console.log("Estrutura AC carregada:", estrutura);
        console.log("Detalhes AC carregados:", detalhes);
        console.groupEnd();
    }, [estrutura, detalhes]);

    const handleEquipClick = (tag) => {
        navigate(`/arcondicionado/equipamento/${encodeURIComponent(tag)}`);
    };

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando Ar Condicionado...
            </div>
        );

    if (erro)
        return <div className="p-6 pt-20 text-center text-red-500 font-medium">{erro}</div>;

    let contentToRender;

    // 🔹 Tela: Pavimento selecionado
    if (selectedBuilding && selectedFloor) {
        const equipamentos = estrutura[selectedBuilding]?.[selectedFloor] ?? [];

        contentToRender = (
            <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {selectedBuilding} – {getRealFloorName(selectedBuilding, selectedFloor, detalhes)}
                </h2>

                <EquipmentGrid
                    equipamentos={equipamentos}
                    selectedBuilding={selectedBuilding}
                    selectedFloor={selectedFloor}
                    detalhes={detalhes}
                    onClick={handleEquipClick}
                    disciplineCode="AC"
                />
            </div>
        );
    }

    // 🔹 Tela: Prédio selecionado
    else if (selectedBuilding) {
        const pavimentos = estrutura[selectedBuilding] || {};

        const pavimentosOrdenados = Object.entries(pavimentos).sort(([a], [b]) => {
            const ord = (floorKey) => {
                const tag = Object.keys(detalhes).find((t) =>
                    t.includes(`/Principal/${floorKey}/`)
                );
                return tag ? detalhes[tag]?.ordPav ?? 0 : 0;
            };
            return ord(b) - ord(a);
        });

        contentToRender = (
            <div className="space-y-6">
                {pavimentosOrdenados.map(([pavKey, equipamentos]) => (
                    <div key={pavKey} className="bg-white rounded-2xl shadow p-4">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            {selectedBuilding} – {getRealFloorName(selectedBuilding, pavKey, detalhes)}
                        </h2>

                        <EquipmentGrid
                            equipamentos={equipamentos}
                            selectedBuilding={selectedBuilding}
                            selectedFloor={pavKey}
                            detalhes={detalhes}
                            onClick={handleEquipClick}
                            disciplineCode="AC"
                        />
                    </div>
                ))}
            </div>
        );
    }

    // 🔹 Tela Inicial
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
                    <Fan className="w-5 h-5 text-blue-400" />
                    Ar Condicionado
                </h2>

                <DisciplineSidebar
                    estrutura={estrutura}
                    detalhes={detalhes}
                    selectedBuilding={selectedBuilding}
                    selectedFloor={selectedFloor}
                    onSelectBuilding={(building) => {
                        setSelectedBuilding(building);
                        setSelectedFloor(null);
                    }}
                    onSelectFloor={(building, floor) => {
                        setSelectedBuilding(building);
                        setSelectedFloor(floor);
                    }}
                />
            </aside>

            <main className="flex-1 p-6 ml-64">
                {contentToRender}
            </main>
        </div>
    );
}
