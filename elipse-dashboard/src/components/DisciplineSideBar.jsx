import React from "react";

export default function DisciplineSidebar({
    estrutura,
    onSelectBuilding,
    onSelectFloor,
}) {
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
                        onClick={() => {
                            onSelectBuilding(buildingName);
                            onSelectFloor(null);
                        }}
                    >
                        {buildingName}
                    </h3>

                    {/* Pavimentos */}
                    <ul className="ml-3 border-l border-gray-200 pl-2">
                        {Object.entries(floors)
                            .map(([floorKey, equipments]) => {
                                // Extrai info real do pavimento a partir do primeiro equipamento
                                const firstEquip = Object.values(equipments)[0] || {};

                                return {
                                    floorKey,
                                    floorName: firstEquip.floor || floorKey,
                                    ordPav: firstEquip.ordPav || 0,
                                };
                            })
                            // Ordenação decrescente por ordPav
                            .sort((a, b) => b.ordPav - a.ordPav)
                            .map((pav) => (
                                <li
                                    key={pav.floorKey}
                                    className="cursor-pointer text-sm text-gray-700 hover:text-blue-600 py-0.5"
                                    onClick={() => {
                                        onSelectBuilding(buildingName);
                                        onSelectFloor(pav.floorKey);
                                    }}
                                >
                                    {pav.floorName}
                                </li>
                            ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}
