const express = require("express");
const app = express();

// Middleware para JSON
app.use(express.json());

// Simulação de armazenamento temporário
let dados = [];

// ================= ROTAS =================

// GET simples de teste
app.get("/", (req, res) => {
  res.send("API Elipse rodando no Render!");
});

// GET - retorna os dados armazenados
app.get("/dados", (req, res) => {
  res.json(dados);
});

// POST - recebe dados e armazena
app.post("/dados", (req, res) => {
  dados.push(req.body);
  console.log("Recebido:", req.body);
  res.json({ status: "OK", recebido: req.body });
});

// =========================================

// Porta padrão Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
