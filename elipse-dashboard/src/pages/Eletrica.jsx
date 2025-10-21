// src/pages/Eletrica.jsx
import React, { useEffect, useState } from "react";
import { Gauge } from "lucide-react";

export default function Eletrica() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

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

    const handleBuildingClick = (building) => {
        if (selectedBuilding === building) {
            setSelectedBuilding(null);
            setSelectedFloor(null);
        } else {
            setSelectedBuilding(building);
            setSelectedFloor(null);
        }
    };

    const handleFloorClick = (floor) => {
        if (selectedFloor === floor) setSelectedFloor(null);
        else setSelectedFloor(floor);
    };

    const renderEquipamentos = () => {
        // Nenhuma seleção ainda
        if (!selectedBuilding && !selectedFloor) {
            return (
                <div className="flex items-center justify-center h-full text-gray-300 select-none">
                    <span className="text-lg italic">
                        Selecione o prédio ou pavimento ao lado
                    </span>
                </div>
            );
        }

        // Se apenas o prédio foi selecionado
        if (selectedBuilding && !selectedFloor) {
            const pavimentos = estrutura[selectedBuilding] || {};
            return (
                <div className="space-y-6">
                    {Object.entries(pavimentos)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([pav, equipamentos]) => (
                            <div key={pav} className="bg-white rounded-2xl shadow-md p-4">
                                <h2 className="text-xl font-semibold mb-4">{pav}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {equipamentos.map((eq) => {
                                        const tag = `EL/${selectedBuilding}/${pav}/${eq}`;
                                        const info = detalhes[tag] || {};
                                        return (
                                            <div
                                                key={eq}
                                                className="border rounded-xl p-4 flex items-center gap-2 bg-gray-50 hover:bg-blue-50 transition"
                                            >
                                                <Gauge className="w-5 h-5 text-blue-600" />
                                                <span className="font-medium text-gray-700">
                                                    {info.name || eq}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                </div>
            );
        }

        // Se o pavimento foi selecionado
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
                                <div
                                    key={eq}
                                    className="border rounded-xl p-4 flex items-center gap-2 bg-gray-50 hover:bg-blue-50 transition"
                                >
                                    <Gauge className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-gray-700">
                                        {info.name || eq}
                                    </span>
                                </div>
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
            <aside className="w-64 bg-white border-r p-4 shadow-md overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Elétrica</h2>
                <nav className="space-y-2">
                    {Object.keys(estrutura).map((building) => (
                        <div key={building}>
                            <button
                                className={`w-full text-left px-3 py-2 rounded-md font-medium transition ${selectedBuilding === building
                                        ? "bg-blue-600 text-white"
                                        : "hover:bg-gray-100"
                                    }`}
                                onClick={() => handleBuildingClick(building)}
                            >
                                {building}
                            </button>
                            {selectedBuilding === building && (
                                <div className="ml-4 mt-1 space-y-1">
                                    {Object.keys(estrutura[building] || {}).map((floor) => (
                                        <button
                                            key={floor}
                                            className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition ${selectedFloor === floor
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "hover:bg-gray-50"
                                                }`}
                                            onClick={() => handleFloorClick(floor)}
                                        >
                                            {floor}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Conteúdo principal */}
            <main className="flex-1 p-6 overflow-y-auto">{renderEquipamentos()}</main>
        </div>
    );
}
