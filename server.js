const express = require("express");
const bodyParser = require("body-parser");

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

// ====== ARMAZENAMENTO SIMPLES ======
let dados = {};

// ====== Endpoints ======

// Receber dados em Base64 e armazenar
app.post("/data/:pasta", checkWriteKey, (req, res) => {
  try {
    const { pasta } = req.params;
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

// Listar dados (somente quem tem API Key de leitura)
app.get("/data/:pasta", checkReadKey, (req, res) => {
  const { pasta } = req.params;
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
