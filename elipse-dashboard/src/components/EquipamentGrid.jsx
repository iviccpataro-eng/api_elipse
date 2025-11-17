import React from "react";

export default function EquipmentGrid({
    equipamentos = [],
    selectedBuilding,
    selectedFloor,
    detalhes = {},
    onClick,
    disciplineCode,
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {equipamentos.map((equip) => {
                const tag = `${disciplineCode}/${selectedBuilding}/${selectedFloor}/${equip}`;
                const info = detalhes[tag] || {};

                return (
                    <button
                        key={tag}
                        onClick={() => onClick(tag)}
                        className="p-4 bg-white rounded-xl shadow hover:shadow-md transition text-left"
                    >
                        <div className="font-semibold text-gray-800">
                            {info.name || equip}
                        </div>

                        <div className="text-gray-500 text-sm mt-1">
                            {info.modelo || "Modelo não informado"}
                        </div>

                        <div className="text-gray-400 text-xs mt-1">
                            {info.fabricante || ""}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
