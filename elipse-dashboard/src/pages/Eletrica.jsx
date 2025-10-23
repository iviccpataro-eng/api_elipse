// src/pages/Eletrica.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
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
                console.log("📡 Retorno da API Elétrica:", data);
                if (data.ok && data.dados?.ok) {
                    setDados(data.dados);
                } else {
                    setErro(data.erro || "Erro ao carregar dados da disciplina.");
                }
            })
            .catch(() => setErro("Falha na comunicação com a API."))
            .finally(() => setLoading(false));
    }, []);

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

    // 🔹 Clique em um equipamento → abre a tela de detalhes
    const handleEquipamentoClick = (tag) => {
        navigate(`/eletrica/equipamento/${encodeURIComponent(tag)}`);
    };

    // 🔹 Renderização principal
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

        // 🔸 Se apenas prédio foi selecionado → mostra todos os andares
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
                                equipamentos={equipamentos}
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

        // 🔸 Se prédio + pavimento foram selecionados → mostra apenas aquele
        if (selectedBuilding && selectedFloor) {
            const equipamentos = estrutura[selectedBuilding]?.[selectedFloor] || [];
            return (
                <div className="bg-white rounded-2xl shadow-md p-4">
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedBuilding} — {selectedFloor}
                    </h2>
                    <EquipmentGrid
                        equipamentos={equipamentos}
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
            {/* Sidebar fixa */}
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

            {/* Conteúdo principal */}
            <main className="flex-1 p-6 overflow-y-auto">{renderEquipamentos()}</main>
        </div>
    );
}
