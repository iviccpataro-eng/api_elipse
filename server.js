<<<<<<< HEAD
onst express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(bodyParser.json());

// Rota GET
app.get('/api/data', (req, res) => {
  res.json({ message: 'GET funcionando no Render!' });
});

// Rota POST
app.post('/api/data', (req, res) => {
  const body = req.body;
  console.log('Recebido:', body);
  res.json({ message: 'POST funcionando no Render!', data: body });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
=======
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
>>>>>>> 0e83e8e (primeiro commit)
