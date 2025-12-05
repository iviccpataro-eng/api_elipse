import React from 'react';
import { Building, Layers2 } from "lucide-react";

// Import correto dos utilitários
import { getRealFloorName } from "../utils/getRealFloorName";
import { getRealBuildingName } from '../utils/getRealBuildingName';

/**
 * Retorna o valor de ordenação (ordPav) para um determinado pavimento.
 * Isso é necessário para ordenar os andares de forma correta.
 */
const getFloorOrder = (building, floor, detalhes) => {

    // Procura o primeiro equipamento cujo tag contenha o prédio e piso corretos.
    // Formato de tag esperado: "SIS/PRÉDIO/PAVIMENTO/EQUIP"
    const firstEquipTag = Object.keys(detalhes).find(tag => {
        const parts = tag.split('/');
        return parts.length >= 4 && parts[1] === building && parts[2] === floor;
    });

    // Caso encontre, retorna ordPav; senão, retorna 0 como fallback
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

    /** SE NÃO EXISTIR ESTRUTURA → retorna mensagem amigável */
    if (!estrutura || Object.keys(estrutura).length === 0) {
        return (
            <div className="text-gray-500 text-sm p-2">
                Nenhuma estrutura de prédios encontrada.
            </div>
        );
    }

    // Lista de prédios ordenada alfabeticamente
    const buildings = Object.keys(estrutura).sort();

    return (
        <nav className="space-y-2">
            {buildings.map((building) => {

                // Determina visualmente se este prédio está selecionado
                const isBuildingSelected =
                    selectedBuilding === building && !selectedFloor;

                // Lista de pavimentos ordenados pelo ordPav
                const floors = Object.keys(estrutura[building] || {}).sort(
                    (a, b) => {
                        const ordA = getFloorOrder(building, a, detalhes);
                        const ordB = getFloorOrder(building, b, detalhes);
                        return ordB - ordA; // ordPav DESC → pavimentos de cima primeiro
                    }
                );

                return (
                    <div key={building}>
                        {/** -------- BOTÃO DO PRÉDIO -------- */}
                        <button
                            onClick={() => onSelectBuilding(building)}
                            className={`flex items-center w-full text-left p-2 rounded-lg transition-colors 
                            ${isBuildingSelected
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Building className="h-5 w-5 mr-3 flex-shrink-0" />

                            {/** Nome real do prédio com função utilitária */}
                            <span className="flex-grow font-medium">
                                {getRealBuildingName(building, detalhes)}
                            </span>
                        </button>

                        {/** -------- LISTAGEM DE ANDARES -------- */}
                        <div className="pl-4 pt-1 mt-1 border-l-2 border-gray-200 ml-4">

                            {floors.map((floor) => {
                                const isFloorSelected =
                                    selectedBuilding === building &&
                                    selectedFloor === floor;

                                return (
                                    <button
                                        key={floor}
                                        onClick={() => onSelectFloor(building, floor)}
                                        className={`flex items-center w-full text-left p-2 rounded-lg transition-colors text-sm mb-1 
                                        ${isFloorSelected
                                                ? 'bg-blue-100 text-blue-800 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <Layers2 className="h-4 w-4 mr-2 flex-shrink-0" />

                                        {/** Nome real do pavimento */}
                                        <span>
                                            {getRealFloorName(building, floor, detalhes)}
                                        </span>
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
