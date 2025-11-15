// modules/dataRouter.js
import express from "express";
import jwt from "jsonwebtoken";
import { getDisciplineData, generateFrontendData } from "./structureBuilder.js";
import { setByPath, getByPath, normalizeBody } from "./utils.js";
import { regenerateStructure } from "./updater.js";
import { registerAlarm, clearAlarm } from "./alarmManager.js";
import { gerarEstruturaDisciplinas } from "../services/structureMapper.js";

console.log("[IMPORT] Todos os módulos carregados com sucesso.");

// -------------------------
// 🧩 Função principal
// -------------------------
const dataRouter = (dados, pool, SECRET, ELIPSE_FIXED_TOKEN) => {
  const router = express.Router();
  console.log("[DEBUG dataRouter] Criando rotas Express...");

  // -------------------------
  // 🧩 Middleware de autenticação
  // -------------------------
  router.use((req, res, next) => {
    // Permitir acesso público à raiz da API (mensagem Render)
    if (req.method === "GET" && req.path === "/") {
      return res.json({ ok: true, msg: "API Elipse rodando no Render!" });
    }

    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });
    const token = authHeader.split(" ")[1];

    if (
      token === ELIPSE_FIXED_TOKEN &&
      req.method === "POST" &&
      req.path.startsWith("/dados")
    ) {
      req.user = { id: "elipse-system", role: "system" };
      return next();
    }

    try {
      req.user = jwt.verify(token, SECRET);
      next();
    } catch {
      return res.status(403).json({ erro: "Token inválido" });
    }
  });

  // -------------------------
  // 🌿 GET /dados
  // -------------------------
  router.get(["/dados", "/data"], (req, res) => res.json(dados));

  router.get(["/dados/*", "/data/*"], (req, res) => {
    const path = req.params[0] || "";
    const ref = getByPath(dados, path);
    if (typeof ref === "undefined")
      return res.status(404).json({ erro: "Caminho não encontrado" });
    res.json(ref);
  });

  // -------------------------
  // 💾 POST /dados/*
  // -------------------------
  router.post(["/dados/*", "/data/*"], async (req, res) => {
    try {
      const payload = normalizeBody(req);
      if (!payload) return res.status(400).json({ erro: "Body inválido" });

      const path = req.params[0] || "";
      setByPath(dados, path, payload);

      // 🧠 Detecta se veio estrutura completa do Elipse (tagsList, structure ou structureDetails)
      if (payload.tagsList || payload.structure || payload.structureDetails) {
        dados.tagsList = payload.tagsList || dados.tagsList || [];
        dados.structure = payload.structure || dados.structure || {};
        dados.structureDetails = payload.structureDetails || dados.structureDetails || {};

        // 🔧 Regerar estrutura para o front-end
        const generated = generateFrontendData(dados.tagsList || []);
        dados.structure = generated.structure || {};
        dados.structureDetails = generated.details || {};
        console.log(`✅ Estrutura reconstruída automaticamente (${dados.tagsList?.length || 0} tags)`);
      }

      // 🧩 Atualização automática por disciplina (Elétrica, Climatização etc.)
      const disciplina = path.split("/")[0]?.toUpperCase();
      if (["EL", "IL", "AC", "HI", "DT", "CM"].includes(disciplina)) {
        const tagsList = gerarTagsListAutomaticamente(dados);
        dados.tagsList = tagsList;
        const generated = generateFrontendData(tagsList);
        dados.structure = generated.structure;
        dados.structureDetails = generated.details;
        console.log(`✅ Estrutura atualizada (${tagsList.length} tags)`);
      }

      // -------------------------
      // 🚨 Tratamento do bloco alarm
      // -------------------------
      if (payload.alarm) {
        const alarmData = payload.alarm;
        const tagPath = path.split("/").slice(0, 4).join("/");

        if (alarmData.active) {
          registerAlarm(tagPath, {
            message: alarmData.message || "Alarme ativo",
            priority: alarmData.priority || "normal",
            timestamp: alarmData.timestamp || new Date().toISOString(),
          });
          console.log(`🚨 Alarme registrado para ${tagPath}`);
        } else {
          clearAlarm(tagPath);
          console.log(`✅ Alarme limpo para ${tagPath}`);
        }

        setByPath(dados, `${path}/alarm`, alarmData);
      }

      res.json({ status: "OK", caminho: `/dados/${path}` });
    } catch (err) {
      console.error("[POST /dados/*] Erro:", err);
      res.status(400).json({ erro: err.message });
    }
  });

  // -------------------------
  // 🔍 GET /discipline/:code
  // -------------------------
  router.get("/discipline/:code", (req, res) => {
    const code = req.params.code?.toUpperCase();
    if (!code)
      return res.status(400).json({ ok: false, erro: "Disciplina inválida." });
    const result = getDisciplineData(dados, code);
    if (!result.ok) return res.status(404).json(result);
    res.json({ ok: true, dados: result });
  });

  // -------------------------
  // ⚙️ GET /equipamento/:tag
  // -------------------------
  router.get("/equipamento/:tag", (req, res) => {
    try {
      const tagDecoded = decodeURIComponent(req.params.tag);
      const equipamento = dados.structureDetails?.[tagDecoded];
      if (!equipamento)
        return res
          .status(404)
          .json({ ok: false, erro: "Equipamento não encontrado." });

      const info = {
        tag: tagDecoded,
        name: equipamento.name || tagDecoded.split("/").pop(),
        description: equipamento.description || "",
        pavimento: equipamento.pavimento,
        fabricante: equipamento.fabricante,
        modelo: equipamento.modelo,
        statusComunicacao: equipamento.statusComunicacao || "OK",
        ultimaAtualizacao:
          equipamento.ultimaAtualizacao || new Date().toISOString(),
      };

      const data = equipamento.data || [];
      const alarm = equipamento.alarm || null;

      res.json({ ok: true, dados: { info, data, alarm } });
    } catch (err) {
      console.error("[EQUIPAMENTO] Erro:", err);
      res.status(500).json({ ok: false, erro: "Erro ao obter equipamento." });
    }
  });

  console.log("[DEBUG dataRouter] Retornando router Express!");
  return router;
};

// -------------------------
// 🔧 Função auxiliar
// -------------------------
function gerarTagsListAutomaticamente(base) {
  const lista = [];
  const percorrer = (obj, caminho = "") => {
    for (const chave in obj) {
      if (!Object.hasOwn(obj, chave)) continue;
      const valor = obj[chave];
      const novoCaminho = caminho ? `${caminho}/${chave}` : chave;
      if (
        valor &&
        typeof valor === "object" &&
        !Array.isArray(valor) &&
        !valor.info &&
        !valor.data
      )
        percorrer(valor, novoCaminho);
      else if (valor?.info) lista.push(novoCaminho);
    }
  };
  percorrer(base);
  return lista;
}

// 🚀 Export isolado (garante que o ESM exporte a função corretamente)
export default dataRouter;

router.get("/estrutura", async (req, res) => {
    try {
        const estrutura = await gerarEstruturaDisciplinas();
        res.json(estrutura);
    } catch (err) {
        console.error("Erro ao gerar estrutura:", err);
        res.status(500).json({ erro: "Falha ao gerar estrutura" });
    }
});