const express = require("express");
const app = express();

// Middleware para JSON
app.use(express.json());

// Armazena apenas o último dado recebido
let ultimoDado = null;

// ================= ROTAS =================

// GET simples de teste
app.get("/", (req, res) => {
  res.send("API Elipse rodando no Render!");
});

// GET - retorna o último dado armazenado
app.get("/dados", (req, res) => {
  if (ultimoDado) {
    res.json(ultimoDado);
  } else {
    res.json({ mensagem: "Nenhum dado recebido ainda." });
  }
});

// POST - recebe dados e sobrescreve
app.post("/dados", (req, res) => {
  ultimoDado = req.body;
  console.log("Recebido:", req.body);
  res.json({ status: "OK", recebido: req.body });
});

// =========================================

// Porta padrão Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
