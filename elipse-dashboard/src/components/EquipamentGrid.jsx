// src/components/EquipmentGrid.jsx
import React from "react";
import { Doughnut } from "react-chartjs-2";

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
        if (valor == null || nominal == null || isNaN(valor)) return null;

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
                    redraw
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
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
                const dataVars = info.data || [];

                return (
                    <button
                        key={eq}
                        onClick={() => onClick(tag)}
                        className="flex flex-col border rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition text-left shadow-sm"
                    >
                        <span className="font-semibold text-gray-800">{info.name || eq}</span>

                        {info.description && (
                            <span className="text-xs text-gray-500">{info.description}</span>
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

                        {/* 🔹 Renderiza até 2 grandezas com gráfico */}
                        {Array.isArray(dataVars) &&
                            dataVars
                                .filter((d) => d[3] === true)
                                .slice(0, 2)
                                .map(([nome, valor, unidade, , nominal], i) => (
                                    <div key={i} className="mt-3 border-t pt-2 text-center">
                                        <div className="font-medium text-sm text-gray-700">{nome}</div>
                                        <div className="text-xs text-gray-500">
                                            {valor} {unidade}
                                        </div>
                                        {renderArcGraph(valor, nominal)}
                                    </div>
                                ))}
                    </button>
                );
            })}
        </div>
    );
}
