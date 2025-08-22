const express = require("express");
const app = express();

app.use(express.json());

let dados = [];

// POST - recebe dados
app.post("/dados", (req, res) => {
  dados.push(req.body);
  res.json({ status: "OK", recebido: req.body });
});

// GET - retorna dados
app.get("/dados", (req, res) => {
  res.json(dados);
});

// Porta padrão Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
