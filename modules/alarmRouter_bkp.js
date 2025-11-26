// modules/alarmRouter.js
import express from "express";
import {
  registerAlarm,
  clearAlarm,
  ackAlarm,
  getActiveAlarms,
  getAlarmHistory
} from "./alarmManager.js";
import { normalizeBody } from "./utils.js";

const router = express.Router();

/* -------------------------
   🚨 Registrar novo alarme
----------------------------*/
router.post("/", (req, res) => {
  try {
    const payload = normalizeBody(req);

    if (!payload || !payload.tag || !payload.alarm) {
      return res.status(400).json({ ok: false, erro: "Formato inválido" });
    }

    registerAlarm(payload.tag, payload.alarm);
    res.json({ ok: true });
  } catch (err) {
    console.error("[ALARMS] Erro:", err);
    res.status(500).json({ ok: false, erro: "Erro ao registrar alarme" });
  }
});

/* -------------------------
   🚨 Listar alarmes ativos
----------------------------*/
router.get("/active", (req, res) => {
  res.json(getActiveAlarms());
});

/* -------------------------
   📚 Histórico de alarmes
----------------------------*/
router.get("/history", (req, res) => {
  res.json(getAlarmHistory());
});

/* -------------------------
   🟡 Reconhecer (ACK)
----------------------------*/
router.post("/ack", (req, res) => {
  const { tag, name } = req.body;
  if (!tag || !name)
    return res.status(400).json({ ok: false, erro: "Tag e nome obrigatórios." });

  ackAlarm(tag, name);
  res.json({ ok: true });
});

/* -------------------------
   🧹 Finalizar (Clear)
----------------------------*/
router.post("/clear", (req, res) => {
  const { tag, name } = req.body;
  if (!tag || !name)
    return res.status(400).json({ ok: false, erro: "Tag e nome obrigatórios." });

  clearAlarm(tag, name);
  res.json({ ok: true });
});

/* -------------------------
   🔎 Atalho /alarms
----------------------------*/
router.get("/", (req, res) => {
  res.json({ ok: true, alarms: getActiveAlarms() });
});

export default router;
