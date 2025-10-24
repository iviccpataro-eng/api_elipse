// src/pages/Eletrica.jsx
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
    const refreshTime = ((user?.refreshTime || 10) * 1000);

    // 🔹 Função isolada para buscar dados
    const fetchEletrica = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/eletrica`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log("📡 Retorno da API Elétrica:", data);

            if (data.ok && data.dados?.ok) {
                setDados({
                    estrutura: data.dados.estrutura,
                    detalhes: data.dados.detalhes,
                });
            } else {
                setErro(data.erro || "Erro ao carregar dados da disciplina.");
            }
        } catch (err) {
            console.error("Erro no fetch:", err);
            setErro("Falha na comunicação com a API.");
        } finally {
            setLoading(false);
        }
    }, [API_BASE, token]);

    // 🔹 Efeito inicial + atualização automática
    useEffect(() => {
        if (!token) {
            setErro("Token não encontrado. Faça login novamente.");
            setLoading(false);
            return;
        }

        fetchEletrica(); // primeira carga
        const interval = setInterval(fetchEletrica, refreshTime); // atualização periódica
        return () => clearInterval(interval);
    }, [fetchEletrica, refreshTime, token]);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Carregando dados da Elétrica...
            </div>
        );

    if (erro)
        return <div className="p-6 text-center text-red-500 font-medium">{erro}</div>;

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

            <main className="flex-1 pt-20 p-6 overflow-y-auto space-y-6">
                {renderEquipamentos()}

                {/* 🟢🔴 Legenda abaixo dos cards */}
                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        Dentro do range nominal
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        Fora do range nominal
                    </div>
                </div>
            </main>
        </div>
    );
}
