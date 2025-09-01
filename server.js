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
let dados = {}; // estrutura linear (chave -> valores)
let arvore = {}; // estrutura hierárquica para navegação

// ===== Função auxiliar para inserir em árvore =====
function inserirNaArvore(caminho, valor) {
  const partes = caminho.split("/"); // EL > Empreendimento > Pavimento > Equipamento
  let atual = arvore;

  partes.forEach((parte, idx) => {
    if (!atual[parte]) {
      atual[parte] = {};
    }
    // quando chegar no equipamento (último nível), guarda o valor
    if (idx === partes.length - 1) {
      atual[parte]._valores = atual[parte]._valores || [];
      atual[parte]._valores.push(valor);
    }
    atual = atual[parte];
  });
}

// ====== Endpoints ======

// Receber dados em Base64 e armazenar (aceita caminhos aninhados)
app.post("/data/*", checkWriteKey, (req, res) => {
  try {
    const pasta = req.params[0]; // pega todo o caminho após /data/
    const { valor } = req.body; // dado vem em Base64

    // Decodificar Base64
    const buffer = Buffer.from(valor, "base64");
    const textoOriginal = buffer.toString("utf-8");

    // Salva em dados (linear)
    if (!dados[pasta]) {
      dados[pasta] = [];
    }
    dados[pasta].push(textoOriginal);

    // Atualiza também na árvore
    inserirNaArvore(pasta, textoOriginal);

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

// Listar árvore inteira
app.get("/data", checkReadKey, (req, res) => {
  res.json(arvore);
});

// Listar dados (linear, pelo caminho exato)
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
