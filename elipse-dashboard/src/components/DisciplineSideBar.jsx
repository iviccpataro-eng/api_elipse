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
        <div className="space-y-3">
            {Object.entries(estrutura).map(([buildingName, floors]) => (
                <div key={buildingName}>
                    <h3
                        className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition"
                        onClick={() => onSelectBuilding(buildingName)}
                    >
                        {buildingName}
                    </h3>

                    <ul className="ml-3 border-l border-gray-200">
                        {Object.entries(floors)
                            .sort(([a], [b]) => {
                                const ordA = Object.values(floors[a] || {}).find(
                                    (eq) => eq.info?.[0]?.ordPav
                                )?.info?.[0]?.ordPav ?? 0;
                                const ordB = Object.values(floors[b] || {}).find(
                                    (eq) => eq.info?.[0]?.ordPav
                                )?.info?.[0]?.ordPav ?? 0;
                                return ordB - ordA;
                            })
                            .map(([floorKey, floorData]) => {
                                const pavRealName =
                                    Object.values(floorData)?.[0]?.info?.[0]?.floor || floorKey;
                                return (
                                    <li
                                        key={floorKey}
                                        className="text-gray-600 text-sm pl-3 py-1 cursor-pointer hover:text-blue-600 transition"
                                        onClick={() => {
                                            onSelectBuilding(buildingName);
                                            onSelectFloor(floorKey);
                                        }}
                                    >
                                        {pavRealName}
                                    </li>
                                );
                            })}
                    </ul>
                </div>
            ))}
        </div>
    );
}
