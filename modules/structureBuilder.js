// modules/structureBuilder.js
// 🔧 Responsável por montar a hierarquia de Disciplinas > Prédios > Pavimentos > Equipamentos
// a partir das tags enviadas pelo Elipse E3 e armazenadas no backend em `dados.tagsList`.

export function generateFrontendData(tagsList = []) {
  if (!Array.isArray(tagsList) || tagsList.length === 0) {
    return {
      structure: {},
      details: {},
    };
  }

  // Dicionário de disciplinas
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

  const structure = {};
  const details = {};

  for (const tag of tagsList) {
    // Exemplo: EL/Principal/TER/MM_01_01
    const parts = tag.split("/").filter(Boolean);
    if (parts.length < 4) continue;

    const [discCode, buildingCode, floorCode, equipCode] = parts;

    // Cria árvore hierárquica
    if (!structure[discCode]) structure[discCode] = {};
    if (!structure[discCode][buildingCode]) structure[discCode][buildingCode] = {};
    if (!structure[discCode][buildingCode][floorCode]) structure[discCode][buildingCode][floorCode] = [];
    structure[discCode][buildingCode][floorCode].push(equipCode);

    // Adiciona info individual do equipamento
    const equipInfo = extractEquipmentInfo(tag);
    details[tag] = {
      disciplina: disciplineMap[discCode] || discCode,
      edificio: buildingCode,
      pavimento: floorCode,
      equipamento: equipCode,
      ...equipInfo,
    };
  }

  return { structure, details };
}

// 🧩 Retorna os dados de uma disciplina específica
export function getDisciplineData(dados, disciplineCode) {
  const tagsList =
    dados?.tagsList ||
    dados?.tags ||
    dados?.Tags ||
    [];

  if (!Array.isArray(tagsList) || tagsList.length === 0) {
    return { ok: false, erro: "Nenhuma lista de tags disponível." };
  }

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

  const disciplineName = disciplineMap[disciplineCode] || disciplineCode;
  const filteredTags = tagsList.filter((tag) => tag.startsWith(`${disciplineCode}/`));

  if (filteredTags.length === 0) {
    return {
      ok: false,
      erro: `Nenhum equipamento encontrado para a disciplina ${disciplineName}.`,
      disciplina: disciplineName,
      estrutura: {},
    };
  }

  const structure = {};
  const details = {};

  for (const tag of filteredTags) {
    const parts = tag.split("/").filter(Boolean);
    if (parts.length < 4) continue;

    const [discCode, buildingCode, floorCode, equipCode] = parts;

    if (!structure[buildingCode]) structure[buildingCode] = {};
    if (!structure[buildingCode][floorCode]) structure[buildingCode][floorCode] = [];
    structure[buildingCode][floorCode].push(equipCode);

    const equipInfo = extractEquipmentInfo(tag);
    details[tag] = equipInfo;
  }

  return {
    ok: true,
    disciplina: disciplineName,
    estrutura: structure,
    detalhes: details,
  };
}

/**
 * 🔍 Busca informações do equipamento dentro do objeto global `dados`
 * Caminho esperado: dados["EL"]["Principal"]["TER"]["MM_01_01"]["info"]
 */
function extractEquipmentInfo(tag) {
  try {
    // Importa dinamicamente o objeto `dados` do escopo global do servidor
    const serverModule = require.main;
    if (!serverModule || !serverModule.exports) return {};

    const dados = serverModule.exports?.dados || globalThis?.dados || {};
    const pathParts = tag.split("/").filter(Boolean);

    let ref = dados;
    for (const part of pathParts) {
      if (ref && typeof ref === "object" && ref.hasOwnProperty(part)) {
        ref = ref[part];
      } else {
        ref = null;
        break;
      }
    }

    const info = ref?.info || {};

    const [disc, building, floor, equip] = pathParts;

    return {
      edificio: info.building || building,
      pavimento: info.floor || floor,
      equipamento: info.name || equip,
      descricao: info.description || "",
      tipo: info.type || "",
      fabricante: info.manufacturer || "",
      modelo: info.model || "",
      status: info.status || "",
    };
  } catch (err) {
    console.error("[extractEquipmentInfo] Erro ao buscar info do equipamento:", err);
    return {};
  }
}
