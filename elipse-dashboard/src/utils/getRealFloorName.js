// utils/getRealFloorName.js

/**
 * Retorna o nome REAL do pavimento, vindo exclusivamente de:
 *    detalhes[tag].info.floor
 *
 * - Procura um tag cujo pavimento (segunda parte do tag) seja igual ao alias `floor`
 * - Se achar e existir info.floor → retorna o nome real
 * - Caso não encontre, retorna o alias `floor` (fallback básico)
 */
export function getRealFloorName(building, floorKey, detalhes) {

    const tag = Object.keys(detalhes).find(
        (t) => detalhes[t]?.pavimento === floorKey || detalhes[t]?.floorKey === floorKey
    );

    if (!tag) return floorKey; // fallback seguro

    return detalhes[tag].floor || detalhes[tag].pavimento || floorKey;
}
