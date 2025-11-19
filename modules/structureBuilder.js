// modules/structureBuilder.js
// 🔧 Responsável por montar a hierarquia de Disciplinas > Prédios > Pavimentos > Equipamentos
// a partir das tags enviadas pelo Elipse E3 e armazenadas no backend em `dados.tagsList`.

export function generateFrontendData(tagsList = []) {
  if (!Array.isArray(tagsList) || tagsList.length === 0) {
    console.warn("[structureBuilder] Lista de tags vazia — retornando estrutura mínima.");
    return { structure: {}, details: {} };
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
    try {
      if (typeof tag !== "string" || !tag.includes("/")) continue;

      // Exemplo: EL/Principal/PAV01/MM_01_01
      const parts = tag.split("/").filter(Boolean);
      if (parts.length < 4) {
        console.warn(`[structureBuilder] Tag ignorada (formato inválido): ${tag}`);
        continue;
      }

      const [discCode, buildingCode, floorCode, equipCode] = parts;

      // Cria árvore hierárquica
      if (!structure[discCode]) structure[discCode] = {};
      if (!structure[discCode][buildingCode]) structure[discCode][buildingCode] = {};
      if (!structure[discCode][buildingCode][floorCode])
        structure[discCode][buildingCode][floorCode] = [];

      // Evita duplicidade
      if (!structure[discCode][buildingCode][floorCode].includes(equipCode)) {
        structure[discCode][buildingCode][floorCode].push(equipCode);
      }

      // Busca diretamente no global.dados sem recriar info
      const pathParts = tag.split("/");
      let ref = global.dados;
      for (const part of pathParts) {
        if (ref && typeof ref === "object" && Object.hasOwn(ref, part)) {
          ref = ref[part];
        } else {
          ref = null;
          break;
        }
      }

      if (ref && typeof ref === "object") {
        details[tag] = ref; // usa exatamente o que veio do payload
      } else {
        console.warn(`[generateFrontendData] Detalhe não encontrado para ${tag}`);
        details[tag] = {};
      }

    } catch (err) {
      console.error(`[structureBuilder] Erro ao processar tag '${tag}':`, err.message);
    }
  }

  console.log(`[structureBuilder] Estrutura gerada com ${Object.keys(details).length} equipamentos.`);
  return { structure, details };
}

// 🧩 Retorna os dados de uma disciplina específica
export function getDisciplineData(dados, disciplineCode) {
  try {
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
    const filteredTags = tagsList.filter((tag) =>
      tag.startsWith(`${disciplineCode}/`)
    );

    if (filteredTags.length === 0) {
      console.warn(`[getDisciplineData] Nenhum equipamento encontrado para ${disciplineCode}`);
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
      if (!structure[buildingCode][floorCode])
        structure[buildingCode][floorCode] = [];

      // Evita duplicidade
      if (!structure[buildingCode][floorCode].includes(equipCode)) {
        structure[buildingCode][floorCode].push(equipCode);
      }

      const equipInfo = extractEquipmentInfo(tag);
      details[tag] = equipInfo;
    }

    return {
      ok: true,
      disciplina: disciplineName,
      estrutura: structure,
      detalhes: details,
    };
  } catch (err) {
    console.error("[getDisciplineData] Erro:", err);
    return { ok: false, erro: "Erro interno ao gerar estrutura da disciplina." };
  }
}

/**
 * 🔍 Busca informações do equipamento dentro do objeto global `dados`
 * Caminho esperado: dados["EL"]["Principal"]["TER"]["MM_01_01"]["info"]
 */
function extractEquipmentInfo(tag) {
  try {
    const dados = global.dados || {};
    const pathParts = tag.split("/").filter(Boolean);
    let ref = dados;

    for (const part of pathParts) {
      if (ref && typeof ref === "object" && Object.hasOwn(ref, part)) {
        ref = ref[part];
      } else {
        ref = null;
        break;
      }
    }

    if (!ref) {
      // Apenas log de aviso, sem quebrar o fluxo
      console.warn(`[extractEquipmentInfo] Caminho não encontrado: ${tag}`);
      return {};
    }

    const infoRaw = Array.isArray(ref.info) ? ref.info[0] : ref.info || {};
    const dataRaw = ref.data || [];

    const grandezas = {};
    const unidades = {};
    const dataArray = [];

    if (Array.isArray(dataRaw)) {
      for (const item of dataRaw) {
        if (!Array.isArray(item) || item.length < 3) continue;

        const [tipo, nome, valor, unidade, mostrarGrafico, nominal] = item;
        if (!tipo || !nome) continue;

        grandezas[nome] = valor;
        unidades[nome] = unidade || "";
        dataArray.push([tipo, nome, valor, unidade, mostrarGrafico, nominal]);
      }
    } else if (typeof dataRaw === "object") {
      for (const [nome, valor] of Object.entries(dataRaw)) {
        grandezas[nome] = valor?.value ?? valor;
        unidades[nome] = valor?.unit ?? "";
        dataArray.push(["AI", nome, valor?.value ?? valor, valor?.unit ?? ""]);
      }
    }

    return {
      ...infoRaw,
      name: infoRaw.name || pathParts.at(-1),
      description: infoRaw.description || "",
      disciplina: infoRaw.discipline || pathParts[0],
      edificio: infoRaw.building || pathParts[1],
      pavimento: infoRaw.floor || pathParts[2],
      ordPav: parseInt(infoRaw.ordPav) || 0,
      fabricante:
        infoRaw.producer ||
        infoRaw.fabricante ||
        infoRaw.manufacturer ||
        "",
      modelo: infoRaw.model || infoRaw.modelo || "",
      statusComunicacao:
        infoRaw.communication ||
        infoRaw.statusComunicacao ||
        "",
      ultimaAtualizacao: infoRaw["last-send"] || infoRaw.ultimaAtualizacao || "",
      grandezas,
      unidades,
      data: dataArray,
    };
  } catch (err) {
    console.error("[extractEquipmentInfo] Erro ao processar tag:", tag, err);
    return {};
  }
}
