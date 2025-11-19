import express from "express";
const router = express.Router();

// Banco de dados em memória
let dados = {
    tagsList: [],
    structure: {},
    structureDetails: {}
};

// -----------------------------------------------------------
// 🔧 Função auxiliar de merge profundo
// -----------------------------------------------------------
function mergeDeep(target, source) {
    for (const key of Object.keys(source)) {
        if (
            typeof target[key] === "object" &&
            typeof source[key] === "object" &&
            !Array.isArray(target[key])
        ) {
            mergeDeep(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
}

// -----------------------------------------------------------
// 🔧 Normaliza body vindo do Elipse
// -----------------------------------------------------------
function normalizeBody(req) {
    if (!req.body) return {};
    if (typeof req.body === "object") return req.body;
    try {
        return JSON.parse(req.body);
    } catch {
        return {};
    }
}

// -----------------------------------------------------------
// 🔧 Gera a lista de TAGs automaticamente
// formata: "EL/Principal/PAV01/MM_01_01"
// -----------------------------------------------------------
function gerarTagsListAutomaticamente(dados) {
    const lista = [];

    for (const disciplina of Object.keys(dados)) {
        if (disciplina === "tagsList" || disciplina === "structureDetails" || disciplina === "structure")
            continue;

        const predios = dados[disciplina];

        for (const predio of Object.keys(predios)) {
            for (const pav of Object.keys(predios[predio])) {
                for (const equip of Object.keys(predios[predio][pav])) {
                    lista.push(`${disciplina}/${predio}/${pav}/${equip}`);
                }
            }
        }
    }

    return lista;
}

// -----------------------------------------------------------
// 🔧 Monta estrutura e detalhes para o frontend
// -----------------------------------------------------------
function generateFrontendData(tags) {
    const structure = {};
    const details = {};

    for (const tag of tags) {
        const [disc, predio, pav, equip] = tag.split("/");

        if (!structure[disc]) structure[disc] = {};
        if (!structure[disc][predio]) structure[disc][predio] = {};
        if (!structure[disc][predio][pav]) structure[disc][predio][pav] = {};

        structure[disc][predio][pav][equip] = true;

        // Carrega detalhes do equipamento
        const source = dados?.[disc]?.[predio]?.[pav]?.[equip];
        if (source) details[tag] = source;
    }

    return { structure, details };
}

// -----------------------------------------------------------
// 🔥 POST /dados  (único endpoint que o Elipse usa)
// -----------------------------------------------------------
router.post("/dados", (req, res) => {
    try {
        const payload = normalizeBody(req);

        if (!payload || typeof payload !== "object") {
            return res.status(400).json({ erro: "Body inválido." });
        }

        // payload vem no formato:
        // { EL: {...}, AC: {...}, IL: {...} }
        for (const disciplina of Object.keys(payload)) {
            if (!dados[disciplina]) dados[disciplina] = {};
            mergeDeep(dados[disciplina], payload[disciplina]);
        }

        // Atualiza tags
        dados.tagsList = gerarTagsListAutomaticamente(dados);

        // Atualiza estrutura final
        const generated = generateFrontendData(dados.tagsList);
        dados.structure = generated.structure;
        dados.structureDetails = generated.details;

        return res.json({ ok: true, disciplinas_recebidas: Object.keys(payload) });
    } catch (err) {
        console.error("[POST /dados] ERRO:", err);
        return res.status(500).json({ erro: "Falha ao processar dados." });
    }
});

// -----------------------------------------------------------
// 🔍 GET /disciplina/:disc
// -----------------------------------------------------------
router.get("/disciplina/:disc", (req, res) => {
    const disc = req.params.disc?.toUpperCase();

    if (!disc) return res.status(400).json({ erro: "Disciplina inválida." });

    if (!dados.structure[disc]) {
        return res.status(404).json({
            erro: `Nenhuma estrutura encontrada para ${disc}.`,
        });
    }

    return res.json({
        ok: true,
        disciplina: disc,
        estrutura: dados.structure[disc],
        detalhes: dados.structureDetails,
    });
});

// -----------------------------------------------------------
// 🔍 GET /estrutura (todas as disciplinas)
// -----------------------------------------------------------
router.get("/estrutura", (req, res) => {
    return res.json({
        structure: dados.structure,
        structureDetails: dados.structureDetails,
    });
});

export default router;