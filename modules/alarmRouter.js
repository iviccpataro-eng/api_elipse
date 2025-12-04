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
   GET /alarms/active
   ============================================================ */
router.get("/actives", async (req, res) => {
  try {
    // 1) Dados do E3 (crus) via global.dados.structureDetails
    const dados = global.dados || {};
    const sd = dados.structureDetails || {};

    // 2) Dados ativos do banco (registros que já foram persistidos)
    const persisted = await getActiveAlarms(); // [{ id, tag, name, severity, ... }, ...]

    // montar um map para acesso rápido por tag|name
    const persistedMap = new Map();
    for (const p of persisted) {
      const key = `${p.tag}|${p.name}`;
      persistedMap.set(key, p);
    }

    // 3) varrer structureDetails para achar alarmes ativos
    const actives = [];

    for (const tag of Object.keys(sd)) {
      const node = sd[tag];
      if (!node) continue;
      const alarms = Array.isArray(node.alarm) ? node.alarm : (node.alarm ? [node.alarm] : []);
      if (!alarms || alarms.length === 0) continue;

      for (const a of alarms) {
        if (!a?.name) continue;
        if (!a.active) continue; // só queremos ativos aqui

        const key = `${tag}|${a.name}`;
        const db = persistedMap.get(key);

        // construir o objeto final para frontend
        const out = {
          id: db?.id ?? null,
          tag,
          name: a.name,
          severity: typeof a.severity === "number" ? a.severity : (a.priority ?? 0),
          active: true,
          timestampIn: a.timestampIn || a.timestamp || null,
          timestampOut: a.timestampOut || null,
          // ack / notified — preferir dados do DB quando existir, caso contrário defaults
          ack: db?.ack ?? false,
          ackUser: db?.ackUser ?? db?.ack_user ?? null,
          ackTimestamp: db?.ackTimestamp ?? db?.ack_timestamp ?? null,
          message: a.message || db?.message || null,
          source: a.source || db?.source || buildSourceFromTag(tag),
          notified: db?.notified ?? false,
          // opcional: payload cru para debug
          rawFromE3: a,
          rawDB: db ?? null
        };

        actives.push(out);
      }
    }

    // 4) também incluir alarmes que existem no DB mas não aparecem em structureDetails (opcional)
    //    — ex: registro ativo no banco mas E3 momentaneamente não enviou (evita sumiço)
    for (const p of persisted) {
      const key = `${p.tag}|${p.name}`;
      const existsInActives = actives.find(x => `${x.tag}|${x.name}` === key);
      if (!existsInActives) {
        // adicionar vindo do DB (sem dados E3)
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

    // 5) ordenação: severity desc, timestampIn asc (mesma lógica do alarmManager.getActiveAlarms)
    actives.sort((a, b) => {
      const s = (b.severity ?? 0) - (a.severity ?? 0);
      if (s !== 0) return s;
      const ta = a.timestampIn ? new Date(a.timestampIn).getTime() : 0;
      const tb = b.timestampIn ? new Date(b.timestampIn).getTime() : 0;
      return ta - tb;
    });

    return res.json({ ok: true, total: actives.length, alarms: actives });
  } catch (err) {
    console.error("[/alarms/actives] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao gerar /alarms/actives" });
  }
});

function buildSourceFromTag(tag) {
  const parts = tag.split("/").filter(Boolean);
  // formato esperado: DISC/BUILD/FLOOR/EQUIP
  const building = parts[1] || "";
  const floor = parts[2] || "";
  const equip = parts[3] || parts[parts.length - 1] || "";
  return `${building} > ${floor} > ${equip}`;
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
    const alarms = {};

    // Percorre TODA a estrutura de equipamentos do E3
    for (const disc of Object.keys(dados)) {
      const discObj = dados[disc];
      if (!discObj || typeof discObj !== "object") continue;

      for (const predio of Object.keys(discObj)) {
        const predObj = discObj[predio];
        if (!predObj || typeof predObj !== "object") continue;

        for (const pav of Object.keys(predObj)) {
          const pavObj = predObj[pav];
          if (!pavObj || typeof pavObj !== "object") continue;

          for (const equip of Object.keys(pavObj)) {
            const eqObj = pavObj[equip];
            if (!eqObj || typeof eqObj !== "object") continue;

            // TAG completa = DISC / PRÉDIO / PAVIMENTO / EQUIPAMENTO
            const tag = `${disc}/${predio}/${pav}/${equip}`;

            const info = Array.isArray(eqObj.info)
              ? eqObj.info[0]
              : eqObj.info || {};

            const alarmList = eqObj.alarm || [];

            // ---- IMPORTANTE ----
            // Puxando nomes REAIS do Elipse
            const edificioNome = info.building || predio;
            const pavimentoNome = info.floor || pav;
            const disciplinaNome = info.discipline || disc;

            alarms[tag] = {
              tag,
              info: {
                name: info.name || equip,
                disciplina: disciplinaNome,   // nome real ou código
                edificio: edificioNome,        // nome real do prédio
                pavimento: pavimentoNome       // nome real do pavimento
              },
              alarms: alarmList.map(a => ({
                name: a.name,
                active: a.active,
                severity: a.severity,
                timestampIn: a.timestampIn || null,
                timestampOut: a.timestampOut || null,
                message: a.message || a.name,
                raw: { ...a }
              }))
            };
          }
        }
      }
    }

    return res.json({ ok: true, alarms });
  } catch (err) {
    console.error("[ALARMS GET /alarms] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao gerar /alarms" });
  }
});

export default router;
