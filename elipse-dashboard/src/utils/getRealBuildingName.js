export function getRealBuildingName(building, detalhes) {

    const tag = Object.keys(detalhes).find(
        (t) =>
            detalhes[t]?.predio === building ||
            detalhes[t]?.building === building ||
            detalhes[t]?.buildingKey === building
    );

    if (!tag) return building; // fallback seguro

    return (
        detalhes[tag].building ||
        detalhes[tag].predio ||
        detalhes[tag].buildingName ||
        building
    );
}
