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
                    {/* Nome do prédio */}
                    <h3
                        className="font-semibold text-gray-800 mb-1 cursor-pointer hover:text-blue-600 transition"
                        onClick={() => onSelectBuilding(buildingName)}
                    >
                        {buildingName}
                    </h3>

                    {/* Lista de pavimentos */}
                    <ul className="ml-3 border-l border-gray-200 pl-2">
                        {Object.entries(floors)
                            // Ordena os pavimentos com base em ordPav (ordem decrescente)
                            .sort(([, pavAData], [, pavBData]) => {
                                const ordA =
                                    Object.values(pavAData || {}).find((eq) => eq.info?.[0]?.ordPav)
                                        ?.info?.[0]?.ordPav ?? 0;
                                const ordB =
                                    Object.values(pavBData || {}).find((eq) => eq.info?.[0]?.ordPav)
                                        ?.info?.[0]?.ordPav ?? 0;
                                return ordB - ordA;
                            })
                            // Renderiza cada pavimento
                            .map(([floorKey, floorData]) => {
                                const pavRealName =
                                    Object.values(floorData)?.[0]?.info?.[0]?.floor || floorKey;

                                return (
                                    <li
                                        key={floorKey}
                                        className="cursor-pointer text-sm text-gray-700 hover:text-blue-600 py-0.5"
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
