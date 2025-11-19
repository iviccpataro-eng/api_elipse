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
                        <h3 className="font-semibold">
                            {info.name || equip}
                        </h3>

                        <p className="text-sm text-gray-500">
                            {info.description || "Sem descrição"}
                        </p>

                        <div className="text-gray-400 text-xs mt-1">
                            {info.producer || ""}
                        </div>

                        <p className={info.communication === "OK"
                            ? "text-green-600"
                            : "text-red-600"}>
                            {info.communication || "Sem comunicação"}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}
