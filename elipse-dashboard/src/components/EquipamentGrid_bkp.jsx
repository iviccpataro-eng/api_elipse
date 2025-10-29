// src/components/EquipmentGrid.jsx
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
                        className="flex flex-col border rounded-xl p-4 bg-gray-50 hover:bg-blue-50 transition text-left shadow-sm"
                    >
                        {/* Nome do equipamento */}
                        <span className="font-semibold text-gray-800">{info.name || eq}</span>

                        {/* Descrição opcional */}
                        {info.description && (
                            <span className="text-xs text-gray-500">{info.description}</span>
                        )}

                        {/* Modelo ou fabricante */}
                        <span className="text-sm text-gray-500">
                            {info.modelo || info.fabricante || ""}
                        </span>

                        {/* Status de comunicação */}
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
                    </button>
                );
            })}
        </div>
    );
}
