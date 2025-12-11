import express from "express";
import jwt from "jsonwebtoken";
import { normalizeBody } from "./utils.js";

export default function commsRouter(comms, alarms, SECRET, FIXED_TOKEN) {
  const router = express.Router();

  // Middleware de autenticação
  router.use((req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });

    const token = authHeader.split(" ")[1];

    if (token === FIXED_TOKEN) {
      req.user = { role: "system" };
      return next();
    }

    try {
      req.user = jwt.verify(token, SECRET);
      next();
    } catch {
      return res.status(403).json({ erro: "Token inválido" });
    }
  });

  // POST /comms/:deviceId
  router.post("/:deviceId", (req, res) => {
    try {
      const deviceId = req.params.deviceId;
      const body = normalizeBody(req);

      // O JSON vem como { "MM_01_01": { info: { ... } } }
      const receivedKey = Object.keys(body)[0];
      const info = body[receivedKey]?.info;

      if (!info) {
        return res.status(400).json({ erro: "Formato inválido. Bloco 'info' não encontrado." });
      }

      // Padronização de propriedades que não devem mudar
      info.address = Number(info.address);
      info.connection = Number(info.connection);
      info.type = Number(info.type);
      info.communication = Boolean(info.communication);

      // Atualiza metadado
      comms[deviceId] = {
        info,
        lastUpdate: new Date().toISOString()
      };

      // Lógica de alarme automático de comunicação
      if (!info.communication) {
        const alarmId = `COMM_${deviceId}`;

        // Registra alarme caso ainda não exista
        if (!alarms[alarmId]) {
          alarms[alarmId] = {
            id: alarmId,
            name: `Falha de comunicação na controladora ${deviceId}`,
            description: `A controladora ${deviceId} deixou de comunicar.`,
            timestamp: new Date().toISOString(),
            notified: false,
            acknowledged: false,
            source: deviceId,
            type: "communication"
          };
        }
      } else {
        // Se a comunicação voltou, fecha alarme se existir
        const alarmId = `COMM_${deviceId}`;
        if (alarms[alarmId]) {
          delete alarms[alarmId];
        }
      }

      return res.json({ ok: true, id: deviceId });

    } catch (err) {
      console.error("[COMMS] Erro:", err.message);
      return res.status(500).json({ erro: "Falha ao registrar metadados" });
    }
  });

  // GET /comms
  router.get("/", (req, res) => {
    res.json(comms);
  });

  // GET /comms/:deviceId
  router.get("/:deviceId", (req, res) => {
    const info = comms[req.params.deviceId];
    if (!info) return res.status(404).json({ erro: "Equipamento não encontrado" });
    return res.json(info);
  });

  return router;
}
