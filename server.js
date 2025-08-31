const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());

// ======== CONFIGURAÇÕES =========
const PORT = process.env.PORT || 3000;
const WRITE_API_KEY = process.env.WRITE_API_KEY;
const READ_API_KEY = process.env.READ_API_KEY;

// ===== Middleware para validar API Keys =====
function checkWriteKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== WRITE_API_KEY) {
    return res.status(403).json({ error: "Acesso negado: API Key inválida (POST)." });
  }
  next();
}

function checkReadKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== READ_API_KEY) {
    return res.status(403).json({ error: "Acesso negado: API Key inválida (GET)." });
  }
  next();
}

// ====== LIBERAR CORS ======
app.use(cors({
  origin: "*", // pode trocar pelo domínio do seu front
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-api-key"]
}));

// ====== ARMAZENAMENTO SIMPLES ======
let dados = {};

// ====== Endpoints ======

// Receber dados em Base64 e armazenar (aceita caminhos aninhados)
app.post("/data/*", checkWriteKey, (req, res) => {
  try {
    const pasta = req.params[0]; // pega todo o caminho após /data/
    const { valor } = req.body; // dado vem em Base64

    // Decodificar Base64
    const buffer = Buffer.from(valor, "base64");
    const textoOriginal = buffer.toString("utf-8");

    // Cria pasta se não existir
    if (!dados[pasta]) {
      dados[pasta] = [];
    }

    // Salva sobrescrevendo (poderia empilhar também)
    dados[pasta] = [textoOriginal];

    console.log(`📥 Recebido na pasta '${pasta}':`, textoOriginal);

    res.json({
      status: "OK",
      pasta,
      recebidoBase64: valor,
      recebidoTexto: textoOriginal,
    });
  } catch (err) {
    console.error("Erro ao decodificar Base64:", err.message);
    res.status(400).json({ error: "Falha ao processar os dados (Base64 inválido)." });
  }
});

// Listar tudo
app.get("/data", checkReadKey, (req, res) => {
  res.json(dados);
});

// Listar dados (com caminhos aninhados)
app.get("/data/*", checkReadKey, (req, res) => {
  const pasta = req.params[0]; // pega o caminho completo
  res.json({
    pasta,
    conteudo: dados[pasta] || [],
  });
});

// Teste rápido
app.get("/", (req, res) => {
  res.send("🚀 API com Base64 + API Keys funcionando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
