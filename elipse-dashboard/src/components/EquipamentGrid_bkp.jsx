// src/components/EquipamentGrid.jsx
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

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

    // 🔹 Função auxiliar para montar o gráfico de arco
    const renderArcGraph = (nome, valor, nominal) => {
        if (typeof valor !== "number" || typeof nominal !== "number") return null;

        const min = nominal * 0.8;
        const max = nominal * 1.2;
        const dentroDoRange = valor >= min && valor <= max;

        const data = {
            datasets: [
                {
                    data: [valor, max - valor],
                    backgroundColor: [
                        dentroDoRange ? "#16a34a" : "#dc2626", // verde ou vermelho
                        "#e5e7eb", // cinza claro para completar o círculo
                    ],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                    cutout: "75%",
                },
            ],
        };

        const options = {
            plugins: { tooltip: { enabled: false } },
            responsive: true,
            maintainAspectRatio: false,
        };

        return (
            <div className="w-24 h-12 mx-auto mt-2">
                <Doughnut data={data} options={options} />
                <div className="text-center text-xs mt-1 text-gray-600">
                    {valor.toFixed(1)} / {nominal}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipamentos.map((eq) => {
                const tag = `EL/${selectedBuilding}/${selectedFloor}/${eq}`;
                const info = detalhes[tag] || {};
                const grandezas = info.grandezas || {};

                // Se não há grandezas, só mostra o card básico
                const grandezasKeys = Object.keys(grandezas);

                return (
                    <button
                        key={eq}
                        onClick={() => onClick(tag)}
                        className="flex flex-col border rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition text-left shadow-sm"
                    >
                        <span className="font-semibold text-gray-800">
                            {info.name || eq}
                        </span>
                        <span className="text-sm text-gray-500">
                            {info.fabricante || info.modelo || ""}
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

                        {/* 🔹 Renderiza apenas as grandezas marcadas como “true” no backend */}
                        {info.data &&
                            Array.isArray(info.data) &&
                            info.data
                                .filter((d) => d[3] === true) // 3º índice = flag showArc
                                .slice(0, 2) // limita a 2 gráficos por card
                                .map(([nome, valor, unidade, showArc, nominal], i) => (
                                    <div
                                        key={i}
                                        className="w-full mt-3 border-t pt-2 text-center text-sm text-gray-700"
                                    >
                                        <div className="font-medium">{nome}</div>
                                        <div className="text-xs text-gray-500">{unidade}</div>
                                        {renderArcGraph(nome, valor, nominal)}
                                    </div>
                                ))}
                    </button>
                );
            })}
        </div>
    );
}
