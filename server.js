const express = require("express");
const app = express();

app.use(express.json());

// Estrutura de armazenamento em árvore
let dados = {};

// ================= ROTAS =================

// GET simples
app.get("/", (req, res) => {
  res.send("API Elipse rodando no Render!");
});

// GET - retorna tudo
app.get("/dados", (req, res) => {
  res.json(dados);
});

// GET dinâmico - retorna apenas uma subpasta
app.get("/dados/*", (req, res) => {
  const path = req.params[0].split("/");
  let ref = dados;

  for (let p of path) {
    if (ref[p]) {
      ref = ref[p];
    } else {
      return res.status(404).json({ erro: "Caminho não encontrado" });
    }
  }

  res.json(ref);
});

// POST dinâmico - cria/atualiza em qualquer nível
app.post("/dados/*", (req, res) => {
  const path = req.params[0].split("/");
  let ref = dados;

  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    if (!ref[p]) ref[p] = {}; // cria pasta se não existir
    if (i === path.length - 1) {
      // último nível recebe o body
      ref[p] = req.body;
    } else {
      ref = ref[p];
    }
  }

  console.log(`Recebido em /dados/${req.params[0]}:`, req.body);
  res.json({ status: "OK", caminho: `/dados/${req.params[0]}`, recebido: req.body });
});

// =========================================

// Porta padrão Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
