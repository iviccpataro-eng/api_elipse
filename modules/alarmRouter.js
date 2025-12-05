// modules/alarmRouter.js
import express from "express";
import {
  registerAlarm,
  clearAlarm,
  ackAlarm,
  getActiveAlarms,
  getAlarmHistory,
  clearRecognized,
  markNotified,
} from "./alarmManager.js";
import { normalizeBody } from "./utils.js";

const router = express.Router();

/* ============================================================
   POST /alarms
   Registrar novo alarme
   ============================================================ */
router.post("/", async (req, res) => {
  try {
    const payload = normalizeBody(req);

    if (!payload || !payload.tag || !payload.alarm?.name) {
      return res.status(400).json({
        ok: false,
        erro: "Formato inválido. Esperado { tag, alarm: { name, ... } }",
      });
    }

    const result = await registerAlarm(payload.tag, payload.alarm);
    return res.json({ ok: true, alarm: result || null });
  } catch (err) {
    console.error("[ALARMS POST] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao registrar alarme." });
  }
});

/* ============================================================
   GET /alarms/actives
   ============================================================ */
router.get("/actives", async (req, res) => {
  try {
    const dados = global.dados || {};
    const sd = dados.structureDetails || {};

    const persisted = await getActiveAlarms();

    const persistedMap = new Map();
    for (const p of persisted) {
      persistedMap.set(`${p.tag}|${p.name}`, p);
    }

    const actives = [];

    for (const tag of Object.keys(sd)) {
      const node = sd[tag];
      if (!node) continue;

      const alarms = Array.isArray(node.alarm)
        ? node.alarm
        : node.alarm ? [node.alarm] : [];

      if (!alarms.length) continue;

      for (const a of alarms) {
        if (!a?.name) continue;
        if (!a.active) continue;

        const key = `${tag}|${a.name}`;
        const db = persistedMap.get(key);

        const out = {
          id: db?.id ?? null,
          tag,
          name: a.name,
          severity: typeof a.severity === "number" ? a.severity : (a.priority ?? 0),
          active: true,
          timestampIn: a.timestampIn || a.timestamp || null,
          timestampOut: a.timestampOut || null,

          ack: db?.ack ?? false,
          ackUser: db?.ackUser ?? db?.ack_user ?? null,
          ackTimestamp: db?.ackTimestamp ?? db?.ack_timestamp ?? null,

          message: a.message || db?.message || a.name || null,

          // 🔥 CORRIGIDO — usa o registro correto sem depender de "details"
          source: buildSourceFromTag(tag, node, dados.structure),

          notified: db?.notified ?? false,

          rawFromE3: a,
          rawDB: db ?? null
        };

        actives.push(out);
      }
    }

    // Adiciona alarmes ativos apenas no DB
    for (const p of persisted) {
      const key = `${p.tag}|${p.name}`;
      const exists = actives.some(x => `${x.tag}|${x.name}` === key);

      if (!exists) {
        actives.push({
          id: p.id,
          tag: p.tag,
          name: p.name,
          severity: p.severity,
          active: true,
          timestampIn: p.timestampIn,
          timestampOut: p.timestampOut,
          ack: p.ack,
          ackUser: p.ackUser || p.ack_user || null,
          ackTimestamp: p.ackTimestamp || p.ack_timestamp || null,
          message: p.message,
          source: p.source,
          notified: p.notified ?? false,
          rawFromE3: null,
          rawDB: p
        });
      }
    }

    actives.sort((a, b) => {
      const s = (b.severity ?? 0) - (a.severity ?? 0);
      if (s !== 0) return s;
      return (new Date(a.timestampIn).getTime() || 0) - (new Date(b.timestampIn).getTime() || 0);
    });

    return res.json({ ok: true, total: actives.length, alarms: actives });

  } catch (err) {
    console.error("[/alarms/actives] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao gerar /alarms/actives" });
  }
});

/* ============================================================
   Função correta de montagem da SOURCE amigável
   ============================================================ */
function buildSourceFromTag(tag, node, structure) {
  if (!node) return tag;

  const equipName = node.name || tag.split("/").pop();
  const building = node.building || node.edificio || tag.split("/")[1] || "";
  const floor = node.floor || node.pavimento || tag.split("/")[2] || "";

  return `${building} > ${floor} > ${equipName}`;
}


/* ============================================================
   GET /alarms/history
   ============================================================ */
router.get("/history", async (req, res) => {
  try {
    const limit = Math.min(1000, Number(req.query.limit || 500));
    const offset = Number(req.query.offset || 0);

    const hist = await getAlarmHistory({ limit, offset });
    return res.json(hist);
  } catch (err) {
    console.error("[ALARMS /history] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao obter histórico." });
  }
});

/* ============================================================
   POST /alarms/ack
   Body: { tag, name, user }
   ============================================================ */
router.post("/ack", async (req, res) => {
  try {
    const { tag, name, user } = normalizeBody(req);

    if (!tag || !name) {
      return res.status(400).json({ ok: false, erro: "Tag e name são obrigatórios." });
    }

    const updated = await ackAlarm(tag, name, user || null);
    return res.json({ ok: true, alarm: updated || null });
  } catch (err) {
    console.error("[ALARMS /ack] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao reconhecer alarme." });
  }
});

/* ============================================================
   POST /alarms/clear
   Body: { tag, name }
   ============================================================ */
router.post("/clear", async (req, res) => {
  try {
    const { tag, name } = normalizeBody(req);

    if (!tag || !name) {
      return res.status(400).json({ ok: false, erro: "Tag e name são obrigatórios." });
    }

    const result = await clearAlarm(tag, name);
    return res.json({ ok: true, alarm: result || null });
  } catch (err) {
    console.error("[ALARMS /clear] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao finalizar alarme." });
  }
});

/* ============================================================
   POST /alarms/notified
   Body: { id, notified }
   ============================================================ */
router.post("/notified", async (req, res) => {
  try {
    const { id, notified } = normalizeBody(req);

    if (!id) {
      return res.status(400).json({ ok: false, erro: "ID é obrigatório." });
    }

    const updated = await markNotified(id, Boolean(notified));
    return res.json({ ok: true, alarm: updated });
  } catch (err) {
    console.error("[ALARMS /notified] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao atualizar notified." });
  }
});

/* ============================================================
   POST /alarms/clear-recognized
   ============================================================ */
router.post("/clear-recognized", async (req, res) => {
  try {
    const removed = await clearRecognized();
    return res.json({ ok: true, removed });
  } catch (err) {
    console.error("[ALARMS /clear-recognized] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao limpar reconhecidos." });
  }
});

/* ============================================================
 * GET /alarms
 * Retorna um objeto com as tags que possuem alarm[] no structureDetails
 * formato:
 * {
 *   ok: true,
 *   alarms: {
 *     "AC/Principal/PAV01/FC_01_01": {
 *       tag: "...",
 *       info: { detalhes do equipamento (opcional) },
 *       alarms: [ { name, active, severity, timestampIn, timestampOut, message, ... } ]
 *     },
 *     ...
 *   }
 * }
 * ============================================================ */
router.get("/", async (req, res) => {
  try {
    const dados = global.dados || {};
    const details = dados.structureDetails || {};

    const alarms = {};

    for (const tag of Object.keys(details)) {
      const equip = details[tag];

      const info = equip || {};
      const alarmList = Array.isArray(info.alarm) ? info.alarm : [];

      alarms[tag] = {
          tag,
          info: {
              name: info.name || tag.split("/").pop(),
              disciplina: info.discipline || info.disciplina || tag.split("/")[0],
              edificio: info.building || info.edificio || tag.split("/")[1],
              pavimento: info.floor || info.pavimento || tag.split("/")[2],
          },
          alarms: alarmList
              .filter(a => a && typeof a === "object")   // <-- Protege de valores inválidos
              .map(a => ({
                  name: a.name || "",
                  active: !!a.active,
                  severity: a.severity ?? 0,
                  timestampIn: a.timestampIn || null,
                  timestampOut: a.timestampOut || null,
                  message: a.message || a.name || "",
                  raw: { ...a }
              }))
      };
    }

    return res.json({ ok: true, alarms });
  } catch (err) {
    console.error("[ALARMS GET /alarms] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao gerar /alarms" });
  }
});

export default router;
