// src/components/DisciplineSidebar.jsx
import React from 'react';
import { Building, Layers2 } from "lucide-react";
import { getRealFloorName } from "../utils/getRealFloorName";
import { getRealBuildingName } from '../utils/getRealBuildingName';

/**
 * Obtém o ordPav (ordem do pavimento) para ordenar os pavimentos.
 * Agora totalmente compatível com a nova lógica de nomes.
 */
const getFloorOrder = (building, floor, detalhes) => {
    const firstEquipTag = Object.keys(detalhes).find(tag => {
        const parts = tag.split('/');
        return parts.length >= 4 && parts[1] === building && parts[2] === floor;
    });

    return firstEquipTag ? (detalhes[firstEquipTag]?.ordPav ?? 0) : 0;
};

export default function DisciplineSidebar({
    estrutura,
    detalhes,
    onSelectBuilding,
    onSelectFloor,
    selectedBuilding,
    selectedFloor,
}) {
    // Caso estrutura esteja vazia
    if (!estrutura || Object.keys(estrutura).length === 0) {
        return (
            <div className="text-gray-500 text-sm p-2">
                Nenhuma estrutura de prédios encontrada.
            </div>
        );
    }

    // Lista de nomes "alias" (chaves) dos prédios
    const buildings = Object.keys(estrutura).sort();

    return (
        <nav className="space-y-2">

            {buildings.map((buildingAlias) => {
                // Nome real do prédio (novo util)
                const realBuildingName = getRealBuildingName(buildingAlias, detalhes);

                const isBuildingSelected =
                    selectedBuilding === buildingAlias && !selectedFloor;

                // Pavimentos ordenados usando ordPav
                const floors = Object.keys(estrutura[buildingAlias] || {}).sort((a, b) => {
                    const ordA = getFloorOrder(buildingAlias, a, detalhes);
                    const ordB = getFloorOrder(buildingAlias, b, detalhes);
                    return ordB - ordA;
                });

                return (
                    <div key={buildingAlias}>

                        {/* BOTÃO DO PRÉDIO */}
                        <button
                            onClick={() => onSelectBuilding(buildingAlias)}
                            className={`flex items-center w-full text-left p-2 rounded-lg transition-colors ${isBuildingSelected
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Building className="h-5 w-5 mr-3 flex-shrink-0" />
                            {/* Agora exibindo o nome REAL e não o alias */}
                            <span className="flex-grow font-medium">{realBuildingName}</span>
                        </button>

                        {/* LISTA DE PAVIMENTOS */}
                        <div className="pl-4 pt-1 mt-1 border-l-2 border-gray-200 ml-4">
                            {floors.map((floor) => {
                                const isFloorSelected =
                                    selectedBuilding === buildingAlias && selectedFloor === floor;

                                return (
                                    <button
                                        key={floor}
                                        onClick={() => onSelectFloor(buildingAlias, floor)}
                                        className={`flex items-center w-full text-left p-2 rounded-lg transition-colors text-sm mb-1 ${isFloorSelected
                                                ? 'bg-blue-100 text-blue-800 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Layers2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>{getRealFloorName(buildingAlias, floor, detalhes)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

        </nav>
    );
}
