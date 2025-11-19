// modules/dataRouter.js
import express from "express";
import { Buffer } from "buffer";
import { generateFrontendData } from "./structureBuilder.js";
import { registerAlarm, clearAlarm } from "./alarmManager.js";

const router = express.Router();

// -----------------------------------------------------------
// Utilidades internas
// -----------------------------------------------------------

// Deep merge (mutating target) — arrays and non-objects overwritten
function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];

    if (
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv) &&
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv)
    ) {
      mergeDeep(tv, sv);
    } else {
      target[key] = sv;
    }
  }
}

// Tenta decodificar corpo "valor" (Base64) vindo do Elipse
function decodePossiblyBase64Payload(body) {
  if (!body) return body;
  // If body like { valor: "<base64>" }
  if (typeof body === "object" && body.valor && typeof body.valor === "string") {
    try {
      const decoded = Buffer.from(body.valor, "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      return parsed;
    } catch (err) {
      console.warn("[dataRouter] Falha ao decodificar 'valor' base64:", err.message);
      return body;
    }
  }

  // If body is a string (rare), try parse
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return body;
}

// Gera a lista de tags (EL/Principal/PAV01/MM_01_01) a partir de global.dados
function gerarTagsListFromStore(store) {
  const lista = [];
  if (!store) return lista;

  for (const disc of Object.keys(store)) {
    if (["tagsList", "structure", "structureDetails"].includes(disc)) continue;
    const predios = store[disc] || {};
    for (const pred of Object.keys(predios)) {
      const pavs = predios[pred] || {};
      for (const pav of Object.keys(pavs)) {
        const equips = pavs[pav] || {};
        for (const equip of Object.keys(equips)) {
          lista.push(`${disc}/${pred}/${pav}/${equip}`);
        }
      }
    }
  }

  return lista;
}

// Reconstrói structure e structureDetails usando generateFrontendData (usa global.dados)
function rebuildFrontendStructures() {
  try {
    const tagsList = gerarTagsListFromStore(global.dados);
    global.dados.tagsList = tagsList;
    const generated = generateFrontendData(tagsList || []);
    // generateFrontendData returns { structure, details } (structure = tree; details = flat)
    global.dados.structure = generated.structure || {};
    global.dados.structureDetails = generated.details || {};
  } catch (err) {
    console.error("[dataRouter] Erro ao reconstruir estruturas:", err);
  }
}

// Monta uma tag "DISC/BUILD/FLOOR/EQUIP" de forma segura
function montarTag(disciplina, predio, pavimento, equipamento) {
  return `${disciplina}/${predio}/${pavimento}/${equipamento}`;
}

// -----------------------------------------------------------
// POST /dados
// - aceita payloads no formato:
//   a) full payload com EL/AC/IL/... (merge em global.dados)
//   b) single equipment payload com { disciplina, predio, pavimento, equipamento, info, data }
//   c) payload envelopado: { valor: "<base64>" } onde o decoded JSON é (a) ou (b)
// -----------------------------------------------------------
router.post("/dados", (req, res) => {
  try {
    // Normaliza e decodifica possível base64
    let payload = decodePossiblyBase64Payload(req.body);

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ ok: false, erro: "Body inválido ou vazio." });
    }

    // --------- CASE A: Full payload with top-level disciplines (EL, AC, etc.)
    // Detecta se payload tem qualquer disciplina-like key (2 letras uppercase)
    const topKeys = Object.keys(payload);
    const seemsFull = topKeys.some((k) => /^[A-Z]{2}$/.test(k) && typeof payload[k] === "object");

    if (seemsFull) {
      // Merge each discipline into global.dados
      for (const discKey of topKeys) {
        // Ignore metadata keys
        if (["tagsList", "structure", "structureDetails"].includes(discKey)) continue;

        const discPayload = payload[discKey];
        if (!discPayload || typeof discPayload !== "object") continue;

        if (!global.dados[discKey]) global.dados[discKey] = {};
        mergeDeep(global.dados[discKey], discPayload);
      }

      // If there is an 'alarm' block at top-level (rare), attempt to register
      if (payload.alarm) {
        // can't derive tag from here; log
        console.log("[dataRouter] Alarme recebido no payload top-level (ignorado por falta de tag).");
      }

      // Rebuild structures
      rebuildFrontendStructures();

      return res.json({ ok: true, modo: "bulk", disciplinas_recebidas: Object.keys(payload).filter(k => /^[A-Z]{2}$/.test(k)) });
    }

    // --------- CASE B: Single-equipment-like payload
    // expected: { disciplina, predio, pavimento, equipamento, info, data, alarm? }
    const disciplina = payload.disciplina || payload.disci || payload.discipline;
    const predio = payload.predio || payload.building || payload.edificio;
    const pavimento = payload.pavimento || payload.floor;
    const equipamento = payload.equipamento || payload.equip || payload.tag || payload.Name;

    if (disciplina && predio && pavimento && equipamento) {
      const disc = String(disciplina).toUpperCase();

      // Ensure structures exist
      if (!global.dados[disc]) global.dados[disc] = {};
      if (!global.dados[disc][predio]) global.dados[disc][predio] = {};
      if (!global.dados[disc][predio][pavimento]) global.dados[disc][predio][pavimento] = {};

      // Save presence marker (we will keep the full info in structureDetails)
      global.dados[disc][predio][pavimento][equipamento] = global.dados[disc][predio][pavimento][equipamento] || {};

      // Build canonical tag and detail object
      const canonicalTag = montarTag(disc, predio, pavimento, equipamento);

      const detail = {
        // copy info block if present (allow both info as object or array[0])
        ...(payload.info && typeof payload.info === "object"
          ? (Array.isArray(payload.info) ? payload.info[0] : payload.info)
          : {}),
        // fallback fields
        disciplina: disc,
        edificio: predio,
        pavimento: pavimento,
        equipamento: equipamento,
        // copy other possibly present blocks
        data: payload.data || payload.dados || payload.values || [],
        grandezas: payload.grandezas || payload.grandezas || {},
        unidades: payload.unidades || payload.unidades || {},
      };

      // persist into global.dados structureDetails helper area (we'll rebuild canonical details next)
      // but also store raw object into the tree for compatibility (so both places have the info)
      global.dados[disc][predio][pavimento][equipamento] = detail;

      // If alarm block present for this equipment, register or clear
      if (payload.alarm) {
        const alarmData = payload.alarm;
        if (alarmData.active) {
          registerAlarm(canonicalTag, {
            message: alarmData.message || "Alarme ativo",
            priority: alarmData.priority || "normal",
            timestamp: alarmData.timestamp || new Date().toISOString(),
          });
        } else {
          clearAlarm(canonicalTag);
        }
        // Attach alarm to details store (so frontend can read)
        detail.alarm = alarmData;
        global.dados[disc][predio][pavimento][equipamento] = detail;
      }

      // Rebuild frontend structures
      rebuildFrontendStructures();

      return res.json({ ok: true, modo: "single", recebido: canonicalTag, total_tags: global.dados.tagsList.length });
    }

    // If nothing matched
    return res.status(400).json({ ok: false, erro: "Formato do body não reconhecido. Envie top-level disciplines ou disciplina/predio/pavimento/equipamento." });

  } catch (err) {
    console.error("[POST /dados] ERRO:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno ao processar dados." });
  }
});

// -----------------------------------------------------------
// GET /disciplina/:disc
// Retorna estrutura e detalhes para a disciplina (compatível com frontend)
// -----------------------------------------------------------
router.get("/disciplina/:disc", (req, res) => {
  try {
    const disc = (req.params.disc || "").toUpperCase();
    if (!disc) return res.status(400).json({ ok: false, erro: "Disciplina inválida." });

    const estruturaGlobal = global.dados.structure || {};
    const detalhesGlobal = global.dados.structureDetails || {};

    if (!estruturaGlobal[disc]) {
      return res.status(404).json({ ok: false, erro: `Nenhuma estrutura encontrada para ${disc}` });
    }

    // ---- FILTRO CORRETO: somente detalhes da disciplina ----
    const detalhesFiltrados = {};
    for (const key of Object.keys(detalhesGlobal)) {
      if (key.startsWith(disc + "/")) {
        detalhesFiltrados[key] = detalhesGlobal[key];
      }
    }

    return res.json({
      ok: true,
      disciplina: disc,
      estrutura: estruturaGlobal[disc],
      detalhes: detalhesFiltrados
    });

  } catch (err) {
    console.error("[GET /disciplina/:disc] ERRO:", err);
    res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

// -----------------------------------------------------------
// GET /estrutura — retorna todas as disciplinas (estrutura + detalhes)
// -----------------------------------------------------------
router.get("/estrutura", (req, res) => {
  try {
    return res.json({
      ok: true,
      structure: global.dados.structure || {},
      structureDetails: global.dados.structureDetails || {}
    });
  } catch (err) {
    console.error("[GET /estrutura] ERRO:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

export default router;
