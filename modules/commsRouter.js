import express from "express";
import jwt from "jsonwebtoken";
import { normalizeBody } from "./utils.js";

export default function commsRouter(comms, alarms, SECRET, FIXED_TOKEN) {
  const router = express.Router();

  // ============================================================
  //  Autenticação JWT / Token fixo (Elipse)
  // ============================================================
  router.use((req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });

    const token = authHeader.split(" ")[1];

    // Token fixo permite integração direta com o Elipse E3
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

  // ============================================================
  //  POST /comms/:deviceId
  //  Registro e atualização de metadados de controladoras
  // ============================================================
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

      // Garantia de tipos (backend não confia no Elipse)
      info.address = Number(info.address);
      info.connection = Number(info.connection);
      info.type = Number(info.type);
      info.communication = Boolean(info.communication);

      // Atualiza base de comunicação
      comms[deviceId] = {
        info,
        lastUpdate: new Date().toISOString()
      };

      // ======================================================
      //  Geração automática de alarme de comunicação
      // ======================================================
      if (!info.communication) {
        const alarmId = `COMM_${deviceId}`;

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

  // ============================================================
  //  GET /comms
  //  Lista completa dos metadados enviados pelas controladoras
  // ============================================================
  router.get("/", (req, res) => {
    res.json(comms);
  });

  // ============================================================
  //  GET /comms/:deviceId
  //  Metadado detalhado de uma controladora específica
  // ============================================================
  router.get("/:deviceId", (req, res) => {
    const info = comms[req.params.deviceId];
    if (!info) return res.status(404).json({ erro: "Equipamento não encontrado" });
    return res.json(info);
  });

  // ============================================================
  //  GET /comms/tree
  //  Monta a árvore hierárquica de controladoras
  // ============================================================
  router.get("/tree/all", (req, res) => {
    try {
      const devices = comms;

      // --------------------------------------------------------
      // 1. Criar mapa de nome → ID
      //    (permite usar "GW-01" como parent de "GW_01")
      // --------------------------------------------------------
      const nameToId = {};
      for (const id in devices) {
        const devName = devices[id].info.name;
        nameToId[devName] = id;
      }

      // --------------------------------------------------------
      // 2. Normalizar campo "parent"
      //    Cria novo campo parentId
      // --------------------------------------------------------
      for (const id in devices) {
        const info = devices[id].info;

        if (!info.parent || info.parent === "") {
          info.parentId = null;
          continue;
        }

        // Caso parent já seja um ID válido
        if (devices[info.parent]) {
          info.parentId = info.parent;
          continue;
        }

        // Caso parent seja o "name" do equipamento
        if (nameToId[info.parent]) {
          info.parentId = nameToId[info.parent];
          continue;
        }

        // Caso não exista ainda (pai não enviado pelo Elipse)
        info.parentId = null;
      }

      // --------------------------------------------------------
      // 3. Função recursiva para montar árvore
      // --------------------------------------------------------
      function buildNode(id) {
        const node = {
          deviceId: id,
          info: devices[id].info,
          children: []
        };

        for (const otherId in devices) {
          if (devices[otherId].info.parentId === id) {
            node.children.push(buildNode(otherId));
          }
        }

        return node;
      }

      // --------------------------------------------------------
      // 4. Encontrar raízes (type 0 ou sem parentId)
      // --------------------------------------------------------
      const roots = [];
      for (const id in devices) {
        const info = devices[id].info;
        if (info.type === 0 || info.parentId === null) {
          roots.push(buildNode(id));
        }
      }

      return res.json({ tree: roots });

    } catch (err) {
      console.error("[COMMS_TREE] Erro:", err.message);
      return res.status(500).json({ erro: "Falha ao montar árvore de controladoras" });
    }
  });

  return router;
}
