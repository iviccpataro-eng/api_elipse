// utils/getRealBuildingName.js

/**
 * Retorna o nome REAL do pavimento, vindo exclusivamente de:
 *    detalhes[tag].info.building
 *
 * - Procura um tag cujo prédio (segunda parte do tag) seja igual ao alias `building`
 * - Se achar e existir info.building → retorna o nome real
 * - Caso não encontre, retorna o alias `building` (fallback básico)
 */
export function getRealFloorName(building, floorKey, detalhes) {

    const tag = Object.keys(detalhes).find(
        (t) => detalhes[t]?.pavimento === floorKey || detalhes[t]?.floorKey === floorKey
    );

    if (!tag) return floorKey; // fallback seguro

    return detalhes[tag].floor || detalhes[tag].pavimento || floorKey;
}
