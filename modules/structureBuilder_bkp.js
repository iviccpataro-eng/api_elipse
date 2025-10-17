// modules/structureBuilder.js
// ==================================================
// 🔧 Geração automática de hierarquia e tradução
// ==================================================

/**
 * Dicionário de conversão de disciplinas
 */
const DISCIPLINE_MAP = {
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
 * Função auxiliar: traduz siglas e formata os nomes
 */
function parseTagPath(tagPath) {
  if (!tagPath || typeof tagPath !== "string") return null;

  const [disc, building, floor, equipment] = tagPath.split(">").map((s) => s.trim());

  const discipline = DISCIPLINE_MAP[disc] || disc;

  const floorFormatted =
    floor?.toUpperCase().startsWith("PAV") && /\d/.test(floor)
      ? `${parseInt(floor.replace(/\D/g, ""), 10)}º Pavimento`
      : floor || "Pavimento Desconhecido";

  const equipmentFormatted = equipment ? equipment.replace(/_/g, "-") : "Equipamento";

  return {
    discipline,
    building: building || "Prédio Desconhecido",
    floor: floorFormatted,
    equipment: equipmentFormatted,
    info: {
      Name: equipmentFormatted,
      Floor: floorFormatted,
      Building: building || "Prédio Desconhecido",
    },
  };
}

/**
 * Função principal: monta a estrutura hierárquica completa
 */
function buildStructure(tags) {
  const structure = {};

  tags.forEach((tag) => {
    const [disc, building, floor, equipment] = tag.split(">").map((s) => s.trim());
    const floorFormatted =
      floor?.toUpperCase().startsWith("PAV") && /\d/.test(floor)
        ? `${parseInt(floor.replace(/\D/g, ""), 10)}º Pavimento`
        : floor;
    const eq = equipment?.replace(/_/g, "-");

    if (!structure[disc]) structure[disc] = {};
    if (!structure[disc][building]) structure[disc][building] = {};
    if (!structure[disc][building][floorFormatted])
      structure[disc][building][floorFormatted] = [];
    structure[disc][building][floorFormatted].push(eq);
  });

  return structure;
}

/**
 * Gera a resposta estruturada para o frontend
 */
function generateFrontendData(tags) {
  const structure = buildStructure(tags);
  const details = tags.map((t) => parseTagPath(t));
  return { structure, details };
}

export { parseTagPath, buildStructure, generateFrontendData, DISCIPLINE_MAP };
