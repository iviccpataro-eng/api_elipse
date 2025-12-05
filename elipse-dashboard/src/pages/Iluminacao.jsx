// src/pages/Iluminacao.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import DisciplineSidebar from "../components/DisciplineSideBar";
import EquipmentGrid from "../components/EquipamentGrid";
import { jwtDecode } from "jwt-decode";
import { getRealFloorName } from "../utils/getRealFloorName";
import { getRealBuildingName } from "../utils/getRealBuildingName";
import { apiFetch } from "../utils/apiFetch"; // 🔥 novo

export default function Iluminacao() {
    const [estrutura, setEstrutura] = useState({});
    const [detalhes, setDetalhes] = useState({});
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const navigate = useNavigate();

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // ============================================================
    // 🔹 Buscar dados da estrutura (com logout automático)
    // ============================================================
    const fetchIL = useCallback(async () => {
        const data = await apiFetch(`${API_BASE}/estrutura`, {}, navigate);

        if (!data) return; // token expirou → login automático

        setEstrutura(data.structure?.IL || {});
        setDetalhes(data.structureDetails || {});
        setErro("");
        setLoading(false);
    }, [API_BASE, navigate]);

    // ============================================================
    // 🔹 Intervalo de atualização baseado no token
    // ============================================================
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const user = jwtDecode(token);
        const refreshTime = (user?.refreshtime || 10) * 1000;

        fetchIL();
        const interval = setInterval(fetchIL, Math.max(5000, refreshTime));
        return () => clearInterval(interval);
    }, [fetchIL]);

    // Debug útil
    useEffect(() => {
        console.group("📦 Dados Carregados - IL");
        console.log("Estrutura:", estrutura);
        console.log("Detalhes:", detalhes);
        console.groupEnd();
    }, [estrutura, detalhes]);

    const handleEquipClick = (tag) => {
        navigate(`/iluminacao/equipamento/${encodeURIComponent(tag)}`);
    };

    // ============================================================
    // 🔹 Estados de carregamento / erro
    // ============================================================
    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados de Iluminação ...
            </div>
        );

    if (erro)
        return (
            <div className="p-6 pt-20 text-center text-red-500 font-medium">
                {erro}
            </div>
        );

    // ============================================================
    // 🔹 Conteúdo principal renderizado
    // ============================================================
    let contentToRender;

    // Pavimento selecionado
    if (selectedBuilding && selectedFloor) {
        const equipamentos =
            estrutura[selectedBuilding]?.[selectedFloor] || [];

        contentToRender = (
            <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {getRealBuildingName(
                        selectedBuilding,
                        detalhes
                    )} –{" "}
                    {getRealFloorName(
                        selectedBuilding,
                        selectedFloor,
                        detalhes
                    )}
                </h2>

                <EquipmentGrid
                    equipamentos={equipamentos}
                    selectedBuilding={selectedBuilding}
                    selectedFloor={selectedFloor}
                    detalhes={detalhes}
                    onClick={handleEquipClick}
                    disciplineCode="IL"
                />
            </div>
        );
    }

    // Prédio selecionado
    else if (selectedBuilding) {
        const pavimentos = estrutura[selectedBuilding] || {};

        // Ordenação correta dos pavimentos via detalhes
        const pavimentosOrdenados = Object.entries(pavimentos).sort(
            ([a], [b]) => {
                const ord = (pav) => {
                    const tag = Object.keys(detalhes).find((t) =>
                        t.includes(`/IL/${selectedBuilding}/${pav}/`)
                    );
                    return tag ? detalhes[tag]?.ordPav ?? 0 : 0;
                };
                return ord(b) - ord(a);
            }
        );

        contentToRender = (
            <div className="space-y-6">
                {pavimentosOrdenados.map(([pavKey, eqList]) => (
                    <div key={pavKey} className="bg-white rounded-2xl shadow p-4">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            {getRealBuildingName(selectedBuilding, detalhes)} –{" "}
                            {getRealFloorName(selectedBuilding, selectedFloor, detalhes)}
                        </h2>

                        <EquipmentGrid
                            equipamentos={equipamentos}
                            selectedBuilding={selectedBuilding}
                            selectedFloor={pavKey}
                            detalhes={detalhes}
                            onClick={handleEquipClick}
                            disciplineCode="IL"
                        />
                    </div>
                ))}
            </div>
        );
    }

    // Tela inicial
    else {
        contentToRender = (
            <div className="flex items-center justify-center h-full text-gray-400 select-none">
                <span className="text-lg italic">
                    Selecione um prédio ou pavimento ao lado
                </span>
            </div>
        );
    }

    // ============================================================
    // 🔹 Layout com sidebar
    // ============================================================
    return (
        <div className="flex min-h-screen bg-gray-50 pt-16">
            <aside className="w-64 bg-white border-r p-4 shadow-sm fixed top-16 left-0 h-[calc(100vh-4rem)] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2 sticky top-0 bg-white py-2 z-10 border-b">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Iluminação
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

            <main className="flex-1 p-6 ml-64">{contentToRender}</main>
        </div>
    );
}
