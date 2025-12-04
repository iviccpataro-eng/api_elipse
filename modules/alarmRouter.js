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
router.get("/active", async (req, res) => {
  try {
    const alarms = await getActiveAlarms();
    return res.json(alarms);
  } catch (err) {
    console.error("[ALARMS /active] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Não foi possível obter alarmes ativos." });
  }
});

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
   GET /alarms
   Alias
   ============================================================ */
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
