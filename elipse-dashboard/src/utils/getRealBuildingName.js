// utils/getRealBuildingName.js

/**
 * Retorna o nome REAL do prédio, vindo exclusivamente de:
 *    detalhes[tag].info.building
 *
 * - Procura um tag cujo prédio (segunda parte do tag) seja igual ao alias `building`
 * - Se achar e existir info.building → retorna o nome real
 * - Caso não encontre, retorna o alias `building` (fallback básico)
 */
export function getRealBuildingName(building, detalhes) {

    // encontra qualquer tag do prédio (estrutura TAG: disciplina / building / floor / equipamento)
    const tag = Object.keys(detalhes).find((t) => {
        const parts = t.split("/");
        return parts.length >= 2 && parts[1] === building;
    });

    // se não achou nenhum tag, retorna o alias
    if (!tag) return building;

    // se achou → retorna exclusivamente info.building
    return detalhes[tag]?.info?.building || building;
}
