// utils/getRealBuildingName.js

/**
 * Retorna o nome REAL do prédio, vindo exclusivamente de:
 *    detalhes[tag].info.building
 *
 * - Procura um tag cujo prédio (segunda parte do tag) seja igual ao alias `building`
 * - Se achar e existir info.building → retorna o nome real
 * - Caso não encontre, retorna o alias `building` (fallback básico)
 */
export function getRealBuildingName(buildingKey, detalhes) {

    const tag = Object.keys(detalhes).find(
        (t) => detalhes[t]?.edificio === buildingKey || detalhes[t]?.buildingKey === buildingKey
    );

    if (!tag) return buildingKey; // fallback seguro

    return detalhes[tag].building || detalhes[tag].edificio || buildingKey;
}
