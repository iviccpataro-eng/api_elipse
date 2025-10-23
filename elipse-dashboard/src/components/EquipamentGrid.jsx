// src/components/EquipamentGrid.jsx
import React from "react";

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

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipamentos.map((eq) => {
                const tag = `EL/${selectedBuilding}/${selectedFloor}/${eq}`;
                const info = detalhes[tag] || {};

                return (
                    <button
                        key={eq}
                        onClick={() => onClick(tag)}
                        className="flex flex-col items-start gap-2 border rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition text-left"
                    >
                        <span className="font-semibold text-gray-800">
                            {info.name || eq}
                        </span>
                        <span className="text-sm text-gray-500">
                            {info.modelo || info.fabricante || ""}
                        </span>

                        {info.statusComunicacao && (
                            <span
                                className={`text-xs font-medium ${info.statusComunicacao === "OK"
                                        ? "text-green-600"
                                        : "text-red-500"
                                    }`}
                            >
                                {info.statusComunicacao}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
