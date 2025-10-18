// modules/structureBuilder.js
// -----------------------------------------
// Monta estrutura hierárquica para o frontend
// Disciplina → Prédio → Pavimento → Equipamentos
// -----------------------------------------

const disciplineMap = {
  DB: "Dashboard",
  AC: "Ar Condicionado",
  IL: "Iluminação",
  EL: "Elétrica",
  HI: "Hidráulica",
  DT: "Detecção de Incêndio",
  CM: "Comunicação",
  SC: "Segurança",
  FR: "Ferramentas",
};

/**
 * Extrai informações legíveis de um equipamento
 */
function parseEquipment(tagPath, equipmentData = {}) {
  const parts = tagPath.split("/").filter(Boolean);
  const [discCode, building, floorCode, equipmentName] = parts;

  const discipline = disciplineMap[discCode] || discCode || "Desconhecida";
  const buildingName =
    equipmentData.info?.Building || building || "Indefinido";
  const floorName =
    equipmentData.info?.Floor ||
    floorCode?.replace(/^PAV/, "Pavimento ") ||
    "Indefinido";
  const eqName =
    equipmentData.info?.Name || equipmentName || "Equipamento";

  const info = {
    Name: eqName,
    Building: buildingName,
    Floor: floorName,
    Producer: equipmentData.info?.Producer || "—",
    Model: equipmentData.info?.Model || "—",
    Communication: equipmentData.info?.Communication || "—",
    LastSend: equipmentData.info?.["Last-Send"] || null,
  };

  return { discipline, building: buildingName, floor: floorName, name: eqName, path: tagPath, info };
}

/**
 * Gera estrutura completa hierárquica
 */
export function generateFrontendData(dataFromBackend) {
  if (!dataFromBackend || typeof dataFromBackend !== "object") {
    return { structure: {}, details: [] };
  }

  const entries = Object.entries(dataFromBackend)
    .filter(([key, val]) => key.includes("/") && typeof val === "object")
    .map(([tag, data]) => parseEquipment(tag, data));

  const structure = {};

  for (const e of entries) {
    if (!structure[e.discipline]) structure[e.discipline] = {};
    const disc = structure[e.discipline];

    if (!disc[e.building]) disc[e.building] = {};
    const building = disc[e.building];

    if (!building[e.floor]) building[e.floor] = [];
    building[e.floor].push({
      name: e.name,
      path: e.path,
      info: e.info,
    });
  }

  return { structure, details: entries };
}

/**
 * Retorna estrutura apenas de uma disciplina específica
 */
export function getDisciplineData(dataFromBackend, discCode) {
  const all = generateFrontendData(dataFromBackend);
  const disciplineName = disciplineMap[discCode] || discCode;

  const discData = all.structure[disciplineName];
  if (!discData) {
    return {
      ok: false,
      discipline: disciplineName,
      buildings: [],
      msg: "Nenhum equipamento encontrado para esta disciplina.",
    };
  }

  const buildings = Object.entries(discData).map(([buildingName, floorsObj]) => ({
    name: buildingName,
    floors: Object.entries(floorsObj).map(([floorName, equipments]) => ({
      name: floorName,
      equipments,
    })),
  }));

  return {
    ok: true,
    discipline: disciplineName,
    buildings,
  };
}
