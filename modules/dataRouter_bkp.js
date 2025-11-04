// modules/dataRouter.js
import express from "express";
import jwt from "jsonwebtoken";
import { getDisciplineData, generateFrontendData } from "./structureBuilder.js";
import { setByPath, getByPath, normalizeBody } from "./utils.js";
import { regenerateStructure } from "./updater.js";

export default function dataRouter(dados, pool, SECRET, ELIPSE_FIXED_TOKEN) {
  const router = express.Router();

  // -------------------------
  // 🧩 Middleware de autenticação
  // -------------------------
  router.use((req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });
    const token = authHeader.split(" ")[1];

    if (token === ELIPSE_FIXED_TOKEN && req.method === "POST" && req.path.startsWith("/dados")) {
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
    if (typeof ref === "undefined") return res.status(404).json({ erro: "Caminho não encontrado" });
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

      const disciplina = path.split("/")[0]?.toUpperCase();
      if (["EL", "IL", "AC", "HI", "DT", "CM"].includes(disciplina)) {
        const tagsList = gerarTagsListAutomaticamente(dados);
        dados.tagsList = tagsList;
        const generated = generateFrontendData(tagsList);
        dados.structure = generated.structure;
        dados.structureDetails = generated.details;
        console.log(`✅ Estrutura atualizada (${tagsList.length} tags)`);
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
    if (!code) return res.status(400).json({ ok: false, erro: "Disciplina inválida." });
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
      if (!equipamento) {
        return res.status(404).json({ ok: false, erro: "Equipamento não encontrado." });
      }

      const info = {
        tag: tagDecoded,
        name: equipamento.name || tagDecoded.split("/").pop(),
        description: equipamento.description || "",
        pavimento: equipamento.pavimento,
        fabricante: equipamento.fabricante,
        modelo: equipamento.modelo,
        statusComunicacao: equipamento.statusComunicacao || "OK",
        ultimaAtualizacao: equipamento.ultimaAtualizacao || new Date().toISOString(),
      };

      const data = equipamento.data || [];
      res.json({ ok: true, dados: { info, data } });
    } catch (err) {
      console.error("[EQUIPAMENTO] Erro:", err);
      res.status(500).json({ ok: false, erro: "Erro ao obter equipamento." });
    }
  });

  return router;
}

function gerarTagsListAutomaticamente(base) {
  const lista = [];
  const percorrer = (obj, caminho = "") => {
    for (const chave in obj) {
      if (!Object.hasOwn(obj, chave)) continue;
      const valor = obj[chave];
      const novoCaminho = caminho ? `${caminho}/${chave}` : chave;

      if (valor && typeof valor === "object" && !Array.isArray(valor) && !valor.info && !valor.data)
        percorrer(valor, novoCaminho);
      else if (valor?.info) lista.push(novoCaminho);
    }
  };
  percorrer(base);
  return lista;
}
