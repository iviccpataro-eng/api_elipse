// modules/structureBuilder.js
// 🔧 Monta hierarquia genérica (Disciplinas > Prédios > Pavimentos > Equipamentos)
// Compatível com qualquer disciplina enviada pelo Elipse E3.

export function generateFrontendData(tagsList = []) {
    if (!Array.isArray(tagsList) || tagsList.length === 0) {
        return { structure: {}, details: {} };
    }

    const structure = {};
    const details = {};

    for (const tag of tagsList) {
        // Exemplo: EL/Principal/PAV01/MM_01_01
        const parts = tag.split("/").filter(Boolean);
        if (parts.length < 4) continue;

        const [discCode, buildingCode, floorCode, equipCode] = parts;

        // Cria hierarquia
        if (!structure[discCode]) structure[discCode] = {};
        if (!structure[discCode][buildingCode]) structure[discCode][buildingCode] = {};
        if (!structure[discCode][buildingCode][floorCode])
            structure[discCode][buildingCode][floorCode] = [];

        // Evita duplicidade
        if (!structure[discCode][buildingCode][floorCode].includes(equipCode)) {
            structure[discCode][buildingCode][floorCode].push(equipCode);
        }

        // Monta informações individuais
        const equipInfo = extractEquipmentInfo(tag);
        details[tag] = {
            disciplina: discCode,
            edificio: buildingCode,
            pavimento: floorCode,
            equipamento: equipCode,
            ...equipInfo,
        };
    }

    return { structure, details };
}

// 🧩 Filtra dados por disciplina (dinâmico, sem mapa fixo)
export function getDisciplineData(dados, disciplineCode) {
    const tagsList = Array.isArray(dados?.tagsList)
        ? dados.tagsList
        : dados?.tags || dados?.Tags || [];

    if (!Array.isArray(tagsList) || tagsList.length === 0) {
        return { ok: false, erro: "Nenhuma lista de tags disponível." };
    }

    const filteredTags = tagsList.filter((tag) =>
        tag.startsWith(`${disciplineCode}/`)
    );

    if (filteredTags.length === 0) {
        return {
            ok: false,
            erro: `Nenhum equipamento encontrado para a disciplina ${disciplineCode}.`,
            disciplina: disciplineCode,
            estrutura: {},
        };
    }

    const structure = {};
    const details = {};

    for (const tag of filteredTags) {
        const parts = tag.split("/").filter(Boolean);
        if (parts.length < 4) continue;

        const [, buildingCode, floorCode, equipCode] = parts;

        if (!structure[buildingCode]) structure[buildingCode] = {};
        if (!structure[buildingCode][floorCode])
            structure[buildingCode][floorCode] = [];

        if (!structure[buildingCode][floorCode].includes(equipCode)) {
            structure[buildingCode][floorCode].push(equipCode);
        }

        const equipInfo = extractEquipmentInfo(tag);
        details[tag] = equipInfo;
    }

    return {
        ok: true,
        disciplina: disciplineCode,
        estrutura: structure,
        detalhes: details,
    };
}

/**
 * 🔍 Busca informações do equipamento dentro do objeto global `dados`
 * Caminho esperado: dados["EL"]["Principal"]["PAV01"]["MM_01_01"]
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
            console.warn(`[extractEquipmentInfo] Caminho não encontrado para: ${tag}`);
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
            description: infoRaw.description ?? "", // agora tudo vem padronizado
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
            ultimaAtualizacao:
                infoRaw["last-send"] || infoRaw.ultimaAtualizacao || "",
            grandezas,
            unidades,
            data: dataArray,
        };
    } catch (err) {
        console.error("[extractEquipmentInfo] Erro ao processar tag:", tag, err);
        return {};
    }
}
