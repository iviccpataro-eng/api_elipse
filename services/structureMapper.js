// services/estruturaMapper.js
// 🔧 Gera estrutura moderna: Disciplina > Prédio > Pavimento > Equipamento

export async function gerarEstruturaDisciplinas() {
    const dados = global.dados || {};
    const tagsList = dados.tagsList || dados.tags || [];

    if (!Array.isArray(tagsList) || tagsList.length === 0) {
        console.warn("[estruturaMapper] Nenhuma tag encontrada.");
        return {};
    }

    const estruturaFinal = {};

    for (const rawTag of tagsList) {
        if (!rawTag.includes("/")) continue;

        // Ex.: "EL/Principal/PAV01/MM_01_01"
        const parts = rawTag.split("/").filter(Boolean);
        if (parts.length < 4) continue;

        const [disc, predio, pavimento, equipamento] = parts;

        // Garante disciplina
        if (!estruturaFinal[disc]) estruturaFinal[disc] = {};

        // Garante prédio
        if (!estruturaFinal[disc][predio]) estruturaFinal[disc][predio] = {};

        // Garante pavimento
        if (!estruturaFinal[disc][predio][pavimento])
            estruturaFinal[disc][predio][pavimento] = {};

        // Agora buscar detalhes reais do equipamento
        const detalhes = extrairDetalhesEquipamento(rawTag);

        estruturaFinal[disc][predio][pavimento][equipamento] = {
            tag: equipamento,
            disciplina: disc,
            predio,
            pavimento,
            ...detalhes,
        };
    }

    // Ordenação dos pavimentos por ordPav
    for (const disc of Object.keys(estruturaFinal)) {
        for (const pred of Object.keys(estruturaFinal[disc])) {
            const pavimentos = estruturaFinal[disc][pred];

            const ordenado = Object.entries(pavimentos).sort(([p1, eq1], [p2, eq2]) => {
                const ord1 = obterOrdPav(eq1);
                const ord2 = obterOrdPav(eq2);
                return ord2 - ord1;
            });

            estruturaFinal[disc][pred] = Object.fromEntries(ordenado);
        }
    }

    return estruturaFinal;
}

// 📌 Extrai ordPav de um pavimento
function obterOrdPav(equipamentosObj) {
    const primeiraTag = Object.values(equipamentosObj)[0];
    return primeiraTag?.ordPav ?? 0;
}


// 📌 Extrai info do equipamento do objeto global.dados seguindo o caminho da tag
function extrairDetalhesEquipamento(rawTag) {
    try {
        const dados = global.dados || {};
        const partes = rawTag.split("/").filter(Boolean);

        // Caminho esperado:
        // dados["EL"]["Principal"]["PAV01"]["MM_01_01"]
        let ref = dados;

        for (const p of partes) {
            if (ref && ref[p]) {
                ref = ref[p];
            } else {
                return {};
            }
        }

        const info = Array.isArray(ref.info) ? ref.info[0] : ref.info || {};
        const dataRaw = ref.data || [];

        const grandezas = {};
        const unidades = {};
        const dataArray = [];

        if (Array.isArray(dataRaw)) {
            for (const item of dataRaw) {
                if (!Array.isArray(item) || item.length < 3) continue;

                const [tipo, nome, valor, unidade] = item;
                grandezas[nome] = valor;
                unidades[nome] = unidade;
                dataArray.push(item);
            }
        }

        return {
            ...info,
            grandezas,
            unidades,
            data: dataArray,
            ordPav: parseInt(info.ordPav || 0),
        };
    } catch (err) {
        console.error("[extrairDetalhesEquipamento] Erro:", err);
        return {};
    }
}
