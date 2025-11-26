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

/* -----------------------------------------
   🚨 Registrar novo alarme (API opcional)
   Útil para testes manuais ou integração externa
------------------------------------------ */
router.post("/", (req, res) => {
  try {
    const payload = normalizeBody(req);

    if (!payload || !payload.tag || !payload.alarm) {
      return res.status(400).json({ ok: false, erro: "Formato inválido." });
    }

    // Exige um nome de alarme válido
    if (!payload.alarm.name) {
      return res.status(400).json({ ok: false, erro: "Campo 'alarm.name' é obrigatório." });
    }

    registerAlarm(payload.tag, payload.alarm);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[ALARMS POST] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao registrar alarme." });
  }
});

/* -----------------------------------------
   🚨 Obter alarmes ativos
------------------------------------------ */
router.get("/active", (req, res) => {
  try {
    return res.json(getActiveAlarms());
  } catch (err) {
    console.error("[ALARMS /active] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Não foi possível obter alarmes ativos." });
  }
});

/* -----------------------------------------
   📚 Obter histórico de alarmes
------------------------------------------ */
router.get("/history", (req, res) => {
  try {
    return res.json(getAlarmHistory());
  } catch (err) {
    console.error("[ALARMS /history] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao obter histórico." });
  }
});

/* -----------------------------------------
   🟡 ACK — Reconhecer alarme
------------------------------------------ */
router.post("/ack", (req, res) => {
  try {
    const { tag, name } = req.body;

    if (!tag || !name) {
      return res.status(400).json({
        ok: false,
        erro: "Tag e nome são obrigatórios para ACK."
      });
    }

    ackAlarm(tag, name);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[ALARMS ACK] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao reconhecer alarme." });
  }
});

/* -----------------------------------------
   🧹 CLEAR — Finalizar alarme
------------------------------------------ */
router.post("/clear", (req, res) => {
  try {
    const { tag, name } = req.body;

    if (!tag || !name) {
      return res.status(400).json({
        ok: false,
        erro: "Tag e nome são obrigatórios para limpar alarme."
      });
    }

    clearAlarm(tag, name);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[ALARMS CLEAR] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao limpar alarme." });
  }
});

/* -----------------------------------------
   🔎 GET /alarms — alias
------------------------------------------ */
router.get("/", (req, res) => {
  try {
    return res.json({
      ok: true,
      alarms: getActiveAlarms()
    });
  } catch (err) {
    console.error("[ALARMS /] Erro:", err);
    return res.status(500).json({ ok: false, erro: "Erro ao obter alarmes." });
  }
});

export default router;
