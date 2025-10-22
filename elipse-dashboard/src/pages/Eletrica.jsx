// src/pages/Eletrica.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge } from "lucide-react";
import DisciplineSidebar from "../components/DisciplineSideBar";
import EquipmentGrid from "../components/EquipamentGrid";

export default function Eletrica() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const navigate = useNavigate();

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    // 🔹 Buscar dados da disciplina "Elétrica"
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        fetch(`${API_BASE}/eletrica`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.ok) {
                    setDados(data.dados);
                } else {
                    setErro(data.erro || "Erro ao carregar dados.");
                }
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => setLoading(false));
    }, []);

    // 🔹 Tratamento de estados
    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados da Elétrica...
            </div>
        );

    if (erro)
        return (
            <div className="p-6 text-center text-red-500 font-medium">{erro}</div>
        );

    const estrutura = dados?.estrutura || {};
    const detalhes = dados?.detalhes || {};

    // 🔹 Clique nos equipamentos → redirecionar para rota específica
    const handleEquipamentoClick = (tag) => {
        navigate(`/eletrica/equipamento/${encodeURIComponent(tag)}`);
    };

    // 🔹 Renderizar equipamentos no painel principal
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

        // 🔸 Apenas prédio selecionado → mostra todos os andares
        if (selectedBuilding && !selectedFloor) {
            const pavimentos = estrutura[selectedBuilding] || {};
            const pavimentosOrdenados = Object.entries(pavimentos).sort(([a], [b]) => {
                // Buscar ordPav em detalhes
                const ordA =
                    Object.values(detalhes).find((d) => d?.pavimento === a)?.ordPav ?? 0;
                const ordB =
                    Object.values(detalhes).find((d) => d?.pavimento === b)?.ordPav ?? 0;
                return ordB - ordA; // decrescente → cobertura em cima, subsolo embaixo
            });

            return (
                <div className="space-y-6">
                    {pavimentosOrdenados.map(([pav, equipamentos]) => (
                        <div key={pav} className="bg-white rounded-2xl shadow-md p-4">
                            <h2 className="text-xl font-semibold mb-4">{pav}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {equipamentos.map((eq) => {
                                    const tag = `EL/${selectedBuilding}/${pav}/${eq}`;
                                    const info = detalhes[tag] || {};
                                    return (
                                        <button
                                            key={eq}
                                            onClick={() => handleEquipamentoClick(tag)}
                                            className="w-full flex items-center gap-3 border rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition text-left"
                                        >
                                            <Gauge className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            <span className="font-medium text-gray-700">
                                                {info.name || eq}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // 🔸 Pavimento selecionado → mostra apenas os equipamentos dele
        if (selectedBuilding && selectedFloor) {
            const equipamentos =
                estrutura[selectedBuilding]?.[selectedFloor] || [];
            return (
                <div className="bg-white rounded-2xl shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedBuilding} — {selectedFloor}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {equipamentos.map((eq) => {
                            const tag = `EL/${selectedBuilding}/${selectedFloor}/${eq}`;
                            const info = detalhes[tag] || {};
                            return (
                                <button
                                    key={eq}
                                    onClick={() => handleEquipamentoClick(tag)}
                                    className="w-full flex items-center gap-3 border rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition text-left"
                                >
                                    <Gauge className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <span className="font-medium text-gray-700">
                                        {info.name || eq}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar fixa */}
            <aside className="w-64 bg-white border-r pt-20 p-4 shadow-md overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Elétrica</h2>
                <DisciplineSidebar
                    estrutura={estrutura}
                    onSelectBuilding={(b) => {
                        setSelectedBuilding(b);
                        setSelectedFloor(null);
                    }}
                    onSelectFloor={(f) => setSelectedFloor(f)}
                />
            </aside>

            {/* Conteúdo principal */}
            <main className="flex-1 p-6 overflow-y-auto">{renderEquipamentos()}</main>
        </div>
    );
}
