// routes/data.js
import express from "express";
import { autenticar } from "../middleware/auth.js";
import { getByPath, setByPath, normalizeBody } from "../utils/helpers.js";

const router = express.Router();

// Armazena temporariamente os dados vindos do Elipse
let dados = {};

// GET /dados → retorna tudo
router.get("/", autenticar, (req, res) => {
  res.json(dados);
});

// GET /dados/* → retorna um caminho específico
router.get("/*", autenticar, (req, res) => {
  const path = req.params[0] || "";
  const ref = getByPath(dados, path);
  if (typeof ref === "undefined") {
    return res.status(404).json({ erro: "Caminho não encontrado" });
  }
  res.json(ref);
});

// POST /dados/* → recebe dados do Elipse e armazena em memória
router.post("/*", autenticar, (req, res) => {
  try {
    const payload = normalizeBody(req);
    if (typeof payload === "undefined")
      return res.status(400).json({ erro: "Body inválido" });

    const path = req.params[0] || "";
    setByPath(dados, path, payload);

    res.json({ status: "OK", caminho: `/dados/${path}`, salvo: payload });
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

export default router;
