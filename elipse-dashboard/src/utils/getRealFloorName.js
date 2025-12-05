export function getRealFloorName(building, floorKey, detalhes) {

    const tag = Object.keys(detalhes).find(
        (t) => detalhes[t]?.pavimento === floorKey || detalhes[t]?.floorKey === floorKey
    );

    if (!tag) return floorKey; // fallback seguro

    return detalhes[tag].floor || detalhes[tag].pavimento || floorKey;
}
