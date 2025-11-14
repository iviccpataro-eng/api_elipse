// DisciplineSidebar.jsx — CORRIGIDO
import React from "react";

export default function DisciplineSidebar({ estrutura, onSelectBuilding, onSelectFloor }) {
    if (!estrutura || Object.keys(estrutura).length === 0) {
        return <div className="text-gray-400 italic text-sm">Sem dados da disciplina até o momento.</div>;
    }

    return (
        <div className="space-y-4">
            {Object.entries(estrutura).map(([buildingName, floors]) => (
                <div key={buildingName}>
                    <h3
                        className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600"
                        onClick={() => {
                            onSelectBuilding(buildingName);
                            onSelectFloor(null);
                        }}
                    >
                        {buildingName}
                    </h3>

                    <ul className="ml-3 border-l border-gray-200 pl-2">
                        {Object.entries(floors)
                            .map(([floorKey, equipamentos]) => {
                                const first = Object.values(equipamentos)[0];
                                return {
                                    floorKey,
                                    name: first?.info?.[0]?.floor || floorKey,
                                    ord: Number(first?.info?.[0]?.ordPav || 0),
                                };
                            })
                            .sort((a, b) => b.ord - a.ord)
                            .map((pav) => (
                                <li
                                    key={pav.floorKey}
                                    className="cursor-pointer text-sm text-gray-700 hover:text-blue-600 py-0.5"
                                    onClick={() => onSelectFloor(pav.floorKey)}
                                >
                                    {pav.name}
                                </li>
                            ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
