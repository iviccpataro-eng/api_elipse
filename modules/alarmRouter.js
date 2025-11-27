// modules/alarmRouter.js
import express from "express";
import {
  registerAlarm,
  clearAlarm,
  ackAlarm,
  getActiveAlarms,
  getAlarmHistory,
  clearRecognized,
} from "./alarmManager.js";
import { normalizeBody } from "./utils.js";

const router = express.Router();

// POST /alarms - registrar novo alarme manualmente (útil para testes)
router.post("/", async (req, res) => {
  try {
    const payload = normalizeBody(req);
    if (!payload || !payload.tag || !payload.alarm || !payload.alarm.name) {
      return res.status(400).json({ ok: false, erro: "Formato inválido. Esperado { tag, alarm: { name, ... } }" });
    }
    await registerAlarm(payload.tag, payload.alarm);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[ALARMS POST] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao registrar alarme." });
  }
});

// GET /alarms/active - lista alarmes ativos
router.get("/active", async (req, res) => {
  try {
    const alarms = await getActiveAlarms();
    return res.json(alarms);
  } catch (err) {
    console.error("[ALARMS /active] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Não foi possível obter alarmes ativos." });
  }
});

// GET /alarms/history?limit=100&offset=0
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

// POST /alarms/ack { tag, name, user }
router.post("/ack", async (req, res) => {
  try {
    const { tag, name, user } = normalizeBody(req);
    if (!tag || !name) return res.status(400).json({ ok: false, erro: "Tag e name são obrigatórios." });
    await ackAlarm(tag, name, user || null);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[ALARMS /ack] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao reconhecer alarme." });
  }
});

// POST /alarms/clear { tag, name } - finalizar um alarme específico
router.post("/clear", async (req, res) => {
  try {
    const { tag, name } = normalizeBody(req);
    if (!tag || !name) return res.status(400).json({ ok: false, erro: "Tag e name são obrigatórios." });
    await clearAlarm(tag, name);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[ALARMS /clear] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao finalizar alarme." });
  }
});

// POST /alarms/clear-recognized -> remove todos os alarmes reconhecidos e finalizados (DELETE)
router.post("/clear-recognized", async (req, res) => {
  try {
    const removed = await clearRecognized();
    return res.json({ ok: true, removed });
  } catch (err) {
    console.error("[ALARMS /clear-recognized] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao limpar reconhecidos." });
  }
});

// GET /alarms -> alias
router.get("/", async (req, res) => {
  try {
    const alarms = await getActiveAlarms();
    return res.json({ ok: true, alarms });
  } catch (err) {
    console.error("[ALARMS /] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao obter alarmes." });
  }
});

export default router;
