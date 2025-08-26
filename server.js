const express = require("express");
const app = express();

app.use(express.json());

// Estrutura de armazenamento por "pastas"
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

// POST - cria ou sobrescreve em uma "pasta"
app.post("/dados/:pasta", (req, res) => {
  const pasta = req.params.pasta; // pega o nome da pasta pela URL
  dados[pasta] = req.body;        // sobrescreve dentro da pasta
  console.log(`Recebido em ${pasta}:`, req.body);
  res.json({ status: "OK", pasta, recebido: req.body });
});

// =========================================

// Porta padrão Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
