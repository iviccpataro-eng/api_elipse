// modules/dataRouter.js
import express from "express";
import { Buffer } from "buffer";
import { generateFrontendData } from "./structureBuilder.js";
import { registerAlarm, clearAlarm } from "./alarmManager.js";
import { extractAlarmsFromDados } from "../services/alarmExtractor.js";

const router = express.Router();

/* -----------------------------------------------------------
   Utilidades internas
----------------------------------------------------------- */

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

function decodePossiblyBase64Payload(body) {
  if (!body) return body;

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

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return body;
}

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

function rebuildFrontendStructures() {
  try {
    const tagsList = gerarTagsListFromStore(global.dados);
    global.dados.tagsList = tagsList;
    const generated = generateFrontendData(tagsList || []);
    global.dados.structure = generated.structure || {};
    global.dados.structureDetails = generated.details || {};
  } catch (err) {
    console.error("[dataRouter] Erro ao reconstruir estruturas:", err);
  }
}

function montarTag(disciplina, predio, pavimento, equipamento) {
  return `${disciplina}/${predio}/${pavimento}/${equipamento}`;
}

/* -----------------------------------------------------------
   Normalizadores de alarme
----------------------------------------------------------- */
function normalizeAlarmArrayRaw(raw) {
  if (!Array.isArray(raw)) return null;
  const [name, active, severity, dt_in, dt_out] = raw;
  if (!name) return null;
  return {
    name,
    active: Boolean(active),
    severity: typeof severity === "number" ? severity : (severity ? Number(severity) : 0),
    timestampIn: dt_in || null,
    timestampOut: dt_out || null,
    message: name,
  };
}

async function processIncomingAlarms(tag, alarms) {
  if (!Array.isArray(alarms)) return;

  // alarms can be: array-of-arrays OR array-of-objects
  for (const al of alarms) {
    let alarmObj = null;

    if (Array.isArray(al)) {
      alarmObj = normalizeAlarmArrayRaw(al);
    } else if (al && typeof al === "object" && al.name) {
      alarmObj = {
        name: al.name,
        active: Boolean(al.active),
        severity: typeof al.severity === "number" ? al.severity : (al.severity ? Number(al.severity) : 0),
        timestampIn: al.timestamp || al.timestampIn || null,
        timestampOut: al.timestampOut || null,
        message: al.message || al.name,
        source: al.source || tag,
      };
    }

    if (!alarmObj || !alarmObj.name) continue;

    if (alarmObj.active) {
      // Persistir novo evento (ou reativar se não duplicado)
      await registerAlarm(tag, {
        name: alarmObj.name,
        severity: alarmObj.severity,
        timestamp: alarmObj.timestampIn || new Date().toISOString(),
        message: alarmObj.message,
        source: alarmObj.source || tag,
      });
    } else {
      // marca como finalizado (fecha timestamp_out)
      await clearAlarm(tag, alarmObj.name);
    }
  }
}

/* -----------------------------------------------------------
   POST /dados  (AGORA async -> aguardamos persistência)
----------------------------------------------------------- */
router.post("/dados", async (req, res) => {
  try {
    let payload = decodePossiblyBase64Payload(req.body);

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ ok: false, erro: "Body inválido ou vazio." });
    }

    /* -----------------------------------------------------------
       CASE A — Full payload (disciplinas inteiras)
    ----------------------------------------------------------- */
    const topKeys = Object.keys(payload);
    const seemsFull = topKeys.some((k) => /^[A-Z]{2}$/.test(k) && typeof payload[k] === "object");

    if (seemsFull) {
      for (const discKey of topKeys) {
        if (["tagsList", "structure", "structureDetails"].includes(discKey)) continue;

        const discPayload = payload[discKey];
        if (!discPayload || typeof discPayload !== "object") continue;

        if (!global.dados[discKey]) global.dados[discKey] = {};
        mergeDeep(global.dados[discKey], discPayload);
      }

      // Se houver alarmes no topo (sem tag) apenas logamos
      if (Array.isArray(payload.alarms)) {
        console.log("⚠️ Full payload trouxe alarmes sem tag — ignorando.");
      }

      rebuildFrontendStructures();
      return res.json({
        ok: true,
        modo: "bulk",
        disciplinas_recebidas: Object.keys(payload).filter(k => /^[A-Z]{2}$/.test(k))
      });
    }

    /* -----------------------------------------------------------
       CASE B — Single equipment payload
    ----------------------------------------------------------- */
    const disciplina = payload.disciplina || payload.disci || payload.discipline;
    const predio = payload.predio || payload.building || payload.edificio;
    const pavimento = payload.pavimento || payload.floor;
    const equipamento = payload.equipamento || payload.equip || payload.tag || payload.Name;

    if (disciplina && predio && pavimento && equipamento) {
      const disc = String(disciplina).toUpperCase();

      if (!global.dados[disc]) global.dados[disc] = {};
      if (!global.dados[disc][predio]) global.dados[disc][predio] = {};
      if (!global.dados[disc][predio][pavimento]) global.dados[disc][predio][pavimento] = {};

      const canonicalTag = montarTag(disc, predio, pavimento, equipamento);

      const detail = {
        ...(payload.info && typeof payload.info === "object"
          ? (Array.isArray(payload.info) ? payload.info[0] : payload.info)
          : {}),
        disciplina: disc,
        edificio: predio,
        pavimento,
        equipamento,
        data: payload.data || payload.dados || payload.values || [],
        grandezas: payload.grandezas || {},
        unidades: payload.unidades || {},
      };

      // persist raw detail for compatibility
      global.dados[disc][predio][pavimento][equipamento] = detail;

      /* -----------------------------------------------------------
         Suporte a payload.alarm (array-of-arrays) enviado pelo Elipse
      ----------------------------------------------------------- */
      if (Array.isArray(payload.alarm)) {
        await processIncomingAlarms(canonicalTag, payload.alarm);
        // store normalized alarms in details for frontend visibility
        detail.alarm = (payload.alarm || []).map(normalizeAlarmArrayRaw).filter(Boolean);
      }

      /* -----------------------------------------------------------
         Suporte a payload.alarms (another possible key)
      ----------------------------------------------------------- */
      if (Array.isArray(payload.alarms)) {
        await processIncomingAlarms(canonicalTag, payload.alarms);
        detail.alarms = (payload.alarms || []).map(normalizeAlarmArrayRaw).filter(Boolean);
      }

      /* -----------------------------------------------------------
         Compatibilidade com payload.alarm como OBJETO único
      ----------------------------------------------------------- */
      if (payload.alarm && !Array.isArray(payload.alarm) && payload.alarm.name) {
        if (payload.alarm.active) {
          await registerAlarm(canonicalTag, {
            name: payload.alarm.name,
            message: payload.alarm.message || "",
            severity: payload.alarm.severity ?? 0,
            timestamp: payload.alarm.timestamp || new Date().toISOString(),
            source: payload.alarm.source || canonicalTag,
          });
        } else {
          await clearAlarm(canonicalTag, payload.alarm.name);
        }
        detail.alarm = payload.alarm;
      }

      rebuildFrontendStructures();
      return res.json({
        ok: true,
        modo: "single",
        recebido: canonicalTag,
        total_tags: global.dados.tagsList.length
      });
    }

    return res.status(400).json({
      ok: false,
      erro: "Formato do body não reconhecido."
    });

  } catch (err) {
    console.error("[POST /dados] ERRO:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno ao processar dados." });
  }
});



/* -----------------------------------------------------------
   GETs originais (preservados)
----------------------------------------------------------- */

router.get("/disciplina/:disc", (req, res) => {
  try {
    const disc = (req.params.disc || "").toUpperCase();
    if (!disc) return res.status(400).json({ ok: false, erro: "Disciplina inválida." });

    const estruturaGlobal = global.dados.structure || {};
    const detalhesGlobal = global.dados.structureDetails || {};

    if (!estruturaGlobal[disc]) {
      return res.status(404).json({ ok: false, erro: `Nenhuma estrutura encontrada para ${disc}` });
    }

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
    return res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

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

router.get("/equipamento/:tag", (req, res) => {
  try {
    const tag = decodeURIComponent(req.params.tag);
    const detalhes = global.dados.structureDetails || {};

    if (!detalhes[tag]) {
      return res.status(404).json({
        ok: false,
        erro: `Equipamento não encontrado: ${tag}`
      });
    }

    const info = detalhes[tag];
    const data = info.data || [];

    return res.json({
      ok: true,
      dados: { info, data }
    });
  } catch (err) {
    console.error("[GET /equipamento/:tag] ERRO:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

export default router;
