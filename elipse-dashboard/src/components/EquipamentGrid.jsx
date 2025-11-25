import React from "react";
import { Network, NetworkOff } from "lucide-react";

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
                const hasComm = info.communication === "OK";

                return (
                    <button
                        key={tag}
                        onClick={() => onClick(tag)}
                        className="p-4 bg-white rounded-xl shadow hover:shadow-md transition text-left"
                    >
                        {/* Linha superior: Nome + Ícone */}
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold">
                                {info.name || equip}
                            </h3>

                            {hasComm ? (
                                <Network className="w-5 h-5 text-green-600" />
                            ) : (
                                <NetworkOff className="w-5 h-5 text-red-600" />
                            )}
                        </div>

                        {/* Descrição */}
                        <p className="text-sm text-gray-500">
                            {info.description || "Sem descrição"}
                        </p>

                        {/* Fabricante / Modelo */}
                        <div className="text-gray-400 text-xs mt-1">
                            {info.producer || ""} • {info.model || ""}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
