import React, { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export default function Eletrica() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState(null);

    const API_BASE =
        import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

    /* --- Funções auxiliares --- */
    const toNumberMaybe = (v) => {
        if (typeof v === "number") return v;
        if (typeof v === "string") {
            const n = parseFloat(v.replace(",", "."));
            return isNaN(n) ? undefined : n;
        }
        return undefined;
    };

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

    /* --- Renderização de Cards das grandezas --- */
    const renderDataCard = (dataArr = []) => {
        return dataArr.map((d, idx) => {
            const [name, value, unit, hasGraph, nominal] = d;
            const valNum = toNumberMaybe(value);
            const nomNum = toNumberMaybe(nominal);

            if (hasGraph && valNum !== undefined && nomNum) {
                const min = nomNum * 0.9;
                const max = nomNum * 1.1;
                const clamped = Math.max(min, Math.min(valNum, max));
                const percent = ((clamped - min) / (max - min)) * 100;

                let fill = "#22c55e";
                if (valNum < nomNum * 0.95 || valNum > nomNum * 1.05) fill = "#f97316";
                if (valNum < min || valNum > max) fill = "#ef4444";

                const chartData = [{ name, value: percent, fill }];

                return (
                    <div
                        key={idx}
                        className="rounded-xl border bg-white shadow p-4 flex flex-col items-center"
                    >
                        <div className="font-medium mb-2 text-center">{name}</div>
                        <RadialBarChart
                            width={160}
                            height={120}
                            innerRadius="70%"
                            outerRadius="100%"
                            startAngle={180}
                            endAngle={0}
                            data={chartData}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar dataKey="value" cornerRadius={10} background clockWise />
                        </RadialBarChart>
                        <div className="text-center mt-2">
                            <div className="text-lg font-semibold">
                                {value}
                                {unit ? ` ${unit}` : ""}
                            </div>
                            <div className="text-sm text-gray-500">
                                Nominal: {nomNum}
                                {unit}
                            </div>
                        </div>
                    </div>
                );
            }

            return (
                <div
                    key={idx}
                    className="rounded-xl border bg-white shadow p-4 flex flex-col items-center"
                >
                    <div className="font-medium mb-2">{name}</div>
                    <div className="text-2xl font-semibold">
                        {value}
                        {unit ? ` ${unit}` : ""}
                    </div>
                    {nomNum && (
                        <div className="mt-2 text-sm text-gray-600">
                            Nominal: {nomNum}
                            {unit}
                        </div>
                    )}
                </div>
            );
        });
    };

    /* --- Renderização dos equipamentos --- */
    const renderEquipamentos = () => {
        if (!selectedBuilding)
            return <p>Selecione um prédio no menu lateral.</p>;
        const pavimentos = estrutura[selectedBuilding] || {};

        // Se um pavimento específico está selecionado
        if (selectedFloor) {
            const equipamentos = pavimentos[selectedFloor] || [];
            return (
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        {selectedBuilding} — {selectedFloor}
                    </h2>
                    {equipamentos.length === 0 ? (
                        <p className="text-gray-500">Nenhum equipamento encontrado.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {equipamentos.map((eq) => {
                                const tag = `EL/${selectedBuilding}/${selectedFloor}/${eq}`;
                                const info = detalhes[tag]?.info?.[0] || {};
                                const data = detalhes[tag]?.data || [];
                                return (
                                    <div
                                        key={eq}
                                        className="border rounded-xl bg-white shadow p-4 hover:shadow-md transition"
                                    >
                                        <div className="font-medium text-blue-700">
                                            {info.Name || eq}
                                        </div>
                                        <div className="text-sm text-gray-500 mb-2">
                                            {info.Model || "Sem modelo informado"}
                                        </div>
                                        {data.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                {renderDataCard(data)}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 text-sm mt-2">
                                                Nenhuma grandeza disponível
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        // Se apenas o prédio foi selecionado
        return (
            <div>
                <h2 className="text-xl font-semibold mb-4">{selectedBuilding}</h2>
                {Object.entries(pavimentos)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([pav, equipamentos]) => (
                        <div key={pav} className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-2">{pav}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {equipamentos.map((eq) => {
                                    const tag = `EL/${selectedBuilding}/${pav}/${eq}`;
                                    const info = detalhes[tag]?.info?.[0] || {};
                                    const data = detalhes[tag]?.data || [];
                                    return (
                                        <div
                                            key={eq}
                                            className="border rounded-xl bg-white shadow p-4 hover:shadow-md transition"
                                        >
                                            <div className="font-medium text-blue-700">
                                                {info.Name || eq}
                                            </div>
                                            <div className="text-sm text-gray-500 mb-2">
                                                {info.Model || "Sem modelo informado"}
                                            </div>
                                            {data.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                    {renderDataCard(data)}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 text-sm mt-2">
                                                    Nenhuma grandeza disponível
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar fixa */}
            <aside className="w-64 bg-white border-r p-4 shadow-md overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Elétrica</h2>
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
