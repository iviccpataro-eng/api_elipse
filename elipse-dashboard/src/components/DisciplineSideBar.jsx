// DisciplineSidebar.jsx — VERSÃO FINAL
import React from "react";

export default function DisciplineSidebar({ estrutura, onSelectBuilding, onSelectFloor }) {
    if (!estrutura || Object.keys(estrutura).length === 0) {
        return (
            <div className="text-gray-400 italic text-sm">
                Sem dados da disciplina até o momento.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(estrutura).map(([buildingName, floors]) => (
                <div key={buildingName}>
                    <h3
                        className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition"
                        onClick={() => onSelectBuilding(buildingName)}
                    >
                        {buildingName}
                    </h3>

                    {/* Pavimentos */}
                    <ul className="ml-3 border-l border-gray-200 pl-2">
                        {Object.entries(floors)
                            .sort(([, pavA], [, pavB]) => {
                                const eqA = Object.values(pavA)[0];
                                const eqB = Object.values(pavB)[0];

                                const ordA = Number(eqA?.info?.[0]?.ordPav || 0);
                                const ordB = Number(eqB?.info?.[0]?.ordPav || 0);

                                return ordB - ordA; // ordem decrescente
                            })
                            .map(([floorKey, floorData]) => {
                                const pavNome =
                                    Object.values(floorData)[0]?.info?.[0]?.floor || floorKey;

                                return (
                                    <li
                                        key={floorKey}
                                        className="cursor-pointer text-sm text-gray-700 hover:text-blue-600 py-0.5"
                                        onClick={() => {
                                            onSelectBuilding(buildingName);
                                            onSelectFloor(floorKey);
                                        }}
                                    >
                                        {pavNome}
                                    </li>
                                );
                            })}
                    </ul>
                </div>
            ))}
        </div>
    );
}
