import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function EquipmentGrid({
    equipamentos = [],
    selectedBuilding,
    selectedFloor,
    detalhes = {},
    onClick,
}) {
    if (!equipamentos || equipamentos.length === 0) {
        return (
            <div className="text-gray-400 text-center py-6">
                Nenhum equipamento encontrado neste pavimento.
            </div>
        );
    }

    const renderArcGraph = (valor, nominal) => {
        const min = nominal * 0.8;
        const max = nominal * 1.2;
        const dentroDoRange = valor >= min && valor <= max;

        const data = {
            datasets: [
                {
                    data: [valor, max - valor],
                    backgroundColor: [dentroDoRange ? "#16a34a" : "#dc2626", "#e5e7eb"],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                    cutout: "75%",
                },
            ],
        };

        return (
            <div className="relative w-24 h-12 mx-auto mt-2">
                <Doughnut
                    data={data}
                    options={{
                        plugins: { tooltip: { enabled: false }, legend: { display: false } },
                    }}
                />
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipamentos.map((eq) => {
                const tag = `EL/${selectedBuilding}/${selectedFloor}/${eq}`;
                const info = detalhes[tag] || {};
                const dataVars = info.data || []; // variáveis do Elipse

                return (
                    <button
                        key={eq}
                        onClick={() => onClick(tag)}
                        className="flex flex-col border rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition text-left shadow-sm"
                    >
                        <span className="font-semibold text-gray-800">{info.name || eq}</span>

                        {info.descricao && (
                            <span className="text-xs text-gray-500">{info.descricao}</span>
                        )}

                        <span className="text-sm text-gray-500">
                            {info.modelo || info.fabricante || ""}
                        </span>

                        {info.statusComunicacao && (
                            <span
                                className={`text-xs font-medium mt-1 ${info.statusComunicacao === "OK"
                                        ? "text-green-600"
                                        : "text-red-500"
                                    }`}
                            >
                                {info.statusComunicacao}
                            </span>
                        )}

                        {/* Gráficos */}
                        {Array.isArray(dataVars) &&
                            dataVars
                                .filter((d) => d[3] === true)
                                .slice(0, 2)
                                .map(([nome, valor, unidade, , nominal], i) => (
                                    <div key={i} className="mt-3 border-t pt-2 text-center">
                                        <div className="font-medium text-sm text-gray-700">{nome}</div>
                                        <div className="text-xs text-gray-500">{valor} {unidade}</div>
                                        {renderArcGraph(valor, nominal)}
                                    </div>
                                ))}
                    </button>
                );
            })}
        </div>
    );
}
