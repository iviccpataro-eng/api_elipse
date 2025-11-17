export function getRealFloorName(building, floorCode, detalhes) {
    if (!detalhes) return floorCode;

    // Encontra a primeira tag daquele pavimento
    const tag = Object.keys(detalhes).find(t => {
        const parts = t.split("/");
        return parts[1] === building && parts[2] === floorCode;
    });

    if (!tag) return floorCode;

    const info = detalhes[tag];

    // Ordem de prioridade do nome
    return (
        info.pavimento ||
        info.floor ||
        floorCode
    );
}
