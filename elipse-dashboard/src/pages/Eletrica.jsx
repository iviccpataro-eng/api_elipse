

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

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        const user = jwtDecode(token);
        const refreshTime = (user?.refreshtime || 15) * 1000;


        const fetchData = () => {
            setErro("");
            fetch(`${API_BASE}/discipline/EL`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data.ok && data.dados?.ok) {
                        setDados({
                            estrutura: data.dados.estrutura || {},
                            detalhes: data.dados.detalhes || {},
                        });
                    } else {
                        setErro(data.erro || data.dados.erro || "Erro ao carregar dados da disciplina.");
                    }
                })
                .catch((e) => {
                    console.error("Fetch error:", e);
                    setErro("Falha na comunicação com a API.");
                })
                .finally(() => setLoading(false));
        };

        fetchData();
        const refreshInterval = setInterval(fetchData, Math.max(5000, refreshTime));

        return () => clearInterval(refreshInterval);
    }, [API_BASE]);

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

    const { estrutura, detalhes } = dados;

    let contentToRender;

    if (selectedBuilding && selectedFloor) {
        // Case 1: Specific floor is selected
        const equipamentos = estrutura[selectedBuilding]?.[selectedFloor] || [];
        contentToRender = (
            <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    {selectedBuilding} - {selectedFloor}
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
    } else if (selectedBuilding) {
        // Case 2: Only a building is selected
        const pavimentos = estrutura[selectedBuilding] || {};
        const pavimentosOrdenados = Object.entries(pavimentos).sort(([a], [b]) => {
            const getOrder = (floor) => {
                const firstEquipTag = Object.keys(detalhes).find(tag => tag.includes(`/${selectedBuilding}/${floor}/`));
                return firstEquipTag ? (detalhes[firstEquipTag]?.ordPav ?? 0) : 0;
            }
            return getOrder(b) - getOrder(a);
        });

        contentToRender = (
            <div className="space-y-6">
                {pavimentosOrdenados.length > 0 ? (
                    pavimentosOrdenados.map(([pav, equipamentos]) => (
                        <div key={pav} className="bg-white rounded-2xl shadow p-4">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">{selectedBuilding} - {pav}</h2>
                            <EquipmentGrid
                                equipamentos={equipamentos}
                                selectedBuilding={selectedBuilding}
                                selectedFloor={pav}
                                detalhes={detalhes}
                                onClick={handleEquipamentoClick}
                                disciplineCode="EL"
                            />
                        </div>
                    ))
                ) : (
                    <div className="text-gray-400 text-center py-6">
                        Nenhum pavimento encontrado para este prédio.
                    </div>
                )}
            </div>
        );
    } else {
        // Case 3: Nothing is selected (default view)
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
