// src/components/DisciplineSidebar.jsx
import React from 'react';
import { Building, Layers2 } from "lucide-react";
import { getRealFloorName } from "../utils/getRealFloorName";

/**
 * Helper: pega um ordPav representativo para um pavimento (usado para ordenação).
 * Busca o primeiro tag em `detalhes` que combine com prédio/pavimento e retorna ordPav.
 */
const getFloorOrder = (building, floor, detalhes) => {
    const firstEquipTag = Object.keys(detalhes).find(tag => {
        const parts = tag.split('/');
        return parts.length >= 4 && parts[1] === building && parts[2] === floor;
    });

    return firstEquipTag ? (detalhes[firstEquipTag]?.ordPav ?? 0) : 0;
};

/**
 * Componente: Sidebar de disciplinas (lista prédios -> pavimentos)
 *
 * Mudança principal:
 * - Para exibir o NOME REAL do prédio (não o alias), agora buscamos:
 *      detalhes[firstTag].info.building
 *   onde firstTag é o primeiro tag encontrado daquele prédio.
 *
 * Observação: você informou que passará o nome real via `info.building`.
 * Este componente respeita isso (prioridade máxima). Mantive um fallback
 * simples para o alias caso algo realmente falhe, mas a prioridade é `info.building`.
 */
export default function DisciplineSidebar({
    estrutura,
    detalhes,
    onSelectBuilding,
    onSelectFloor,
    selectedBuilding,
    selectedFloor,
}) {
    // Mensagem quando não houver estrutura
    if (!estrutura || Object.keys(estrutura).length === 0) {
        return <div className="text-gray-500 text-sm p-2">Nenhuma estrutura de prédios encontrada.</div>;
    }

    // lista de prédios (aliases) ordenada alfabeticamente
    const buildings = Object.keys(estrutura).sort();

    /**
     * Função local que tenta extrair o "nome real" do prédio a partir de detalhes.
     * - Procura o primeiro tag dentro de `detalhes` que pertença ao `building`
     * - Retorna detalhes[firstTag].info.building (conforme combinado)
     * - Se não encontrar ou se a propriedade não existir, retorna o alias (building).
     *
     * Observação: conforme sua mensagem, você enviará `info.building`, então este
     * código dará prioridade a ele.
     */
    const getBuildingRealName = (buildingAlias) => {
        // procura um tag que contenha o prédio (posições esperadas: <DISC>/<BUILDING>/<FLOOR>/<EQUIP>)
        const tag = Object.keys(detalhes).find(t => {
            const parts = t.split('/');
            return parts.length >= 2 && parts[1] === buildingAlias;
        });

        // se encontrou um tag e existir info.building -> usa ele
        if (tag && detalhes[tag] && detalhes[tag].info && detalhes[tag].info.building) {
            return detalhes[tag].info.building;
        }

        // fallback mínimo (alias) — mantive para evitar UI quebrada em casos inesperados
        return buildingAlias;
    };

    return (
        <nav className="space-y-2">
            {buildings.map((building) => {
                const isBuildingSelected = selectedBuilding === building && !selectedFloor;

                // pavimentos do prédio ordenados por ordPav (desc)
                const floors = Object.keys(estrutura[building] || {}).sort((a, b) => {
                    const ordA = getFloorOrder(building, a, detalhes);
                    const ordB = getFloorOrder(building, b, detalhes);
                    return ordB - ordA;
                });

                return (
                    <div key={building}>
                        {/* Botão do prédio — agora exibindo o nome real retirado de detalhes[tag].info.building */}
                        <button
                            onClick={() => onSelectBuilding(building)}
                            className={`flex items-center w-full text-left p-2 rounded-lg transition-colors ${isBuildingSelected
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Building className="h-5 w-5 mr-3 flex-shrink-0" />

                            {/* Aqui usamos a função que prioriza detalhes[tag].info.building */}
                            <span className="flex-grow font-medium">{getBuildingRealName(building)}</span>
                        </button>

                        {/* Listagem de pavimentos (sempre visível) */}
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
                                        <Layers2 className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span>{getRealFloorName(building, floor, detalhes)}</span>
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
