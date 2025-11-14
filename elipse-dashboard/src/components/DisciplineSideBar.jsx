
import React from 'react';
import { BuildingOffice2Icon } from '@heroicons/react/24/solid';
import { Squares2X2Icon } from '@heroicons/react/24/outline';


// Helper to get a representative ordPav for a floor, to be used in sorting.
const getFloorOrder = (building, floor, detalhes) => {
    // Find the first equipment tag for this floor to get its ordPav
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
    if (!estrutura || Object.keys(estrutura).length === 0) {
        return <div className="text-gray-500 text-sm p-2">Nenhuma estrutura de prédios encontrada.</div>;
    }

    const buildings = Object.keys(estrutura).sort();

    return (
        <nav className="space-y-2">
            {buildings.map((building) => {
                const isBuildingSelected = selectedBuilding === building && !selectedFloor;

                const floors = Object.keys(estrutura[building] || {}).sort((a, b) => {
                    const ordA = getFloorOrder(building, a, detalhes);
                    const ordB = getFloorOrder(building, b, detalhes);
                    return ordB - ordA; // Sort floors descending by ordPav
                });

                return (
                    <div key={building}>
                        <button
                            onClick={() => onSelectBuilding(building)}
                            className={`flex items-center w-full text-left p-2 rounded-lg transition-colors ${isBuildingSelected
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <BuildingOffice2Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                            <span className="flex-grow font-medium">{building}</span>
                        </button>

                        {/* Always-visible floors */}
                        <div className="pl-4 pt-1 mt-1 border-l-2 border-gray-200 ml-4">
                            {floors.map((floor) => {
                                const isFloorSelected = selectedBuilding === building && selectedFloor === floor;
                                return (
                                    <button
                                        key={floor}
                                        onClick={() => onSelectFloor(building, floor)}
                                        className={`flex items-center w-full text-left p-2 rounded-lg transition-colors text-sm mb-1 ${isFloorSelected
                                                ? 'bg-blue-100 text-blue-800 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Squares2X2Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                        <span>{floor}</span>
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