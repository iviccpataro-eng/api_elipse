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
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-api-key"]
}));

// ====== ARMAZENAMENTO SIMPLES ======
let dados = {}; // estrutura linear (caminho -> objetos JSON)
let arvore = {}; // estrutura hierárquica para navegação

// ===== Função auxiliar para inserir na árvore =====
function inserirNaArvore(caminho, objetoJSON) {
  const partes = caminho.split("/"); 
  let atual = arvore;

  partes.forEach((parte, idx) => {
    if (!atual[parte]) {
      atual[parte] = {};
    }
    // no último nível, salva o objeto diretamente
    if (idx === partes.length - 1) {
      atual[parte] = objetoJSON; 
    }
    atual = atual[parte];
  });
}

// ====== Endpoints ======

// Receber dados em Base64 e armazenar
app.post("/data/*", checkWriteKey, (req, res) => {
  try {
    const pasta = req.params[0]; 
    const { valor } = req.body; 

    // Decodificar Base64
    const buffer = Buffer.from(valor, "base64");
    const textoOriginal = buffer.toString("utf-8");

    // Converter para JSON válido
    let objetoJSON;
    try {
      objetoJSON = JSON.parse(textoOriginal);
    } catch (err) {
      return res.status(400).json({ error: "Payload não é JSON válido." });
    }

    // Salva em dados (linear)
    dados[pasta] = objetoJSON;

    // Atualiza também na árvore
    inserirNaArvore(pasta, objetoJSON);

    console.log(`📥 Recebido em '${pasta}':`, JSON.stringify(objetoJSON, null, 2));

    res.json({
      status: "OK",
      pasta,
      recebidoTexto: objetoJSON,
    });
  } catch (err) {
    console.error("Erro ao processar dados:", err.message);
    res.status(400).json({ error: "Falha ao processar os dados." });
  }
});

// Listar árvore inteira
app.get("/data", checkReadKey, (req, res) => {
  res.json(arvore);
});

// Listar dados de um caminho específico
app.get("/data/*", checkReadKey, (req, res) => {
  const pasta = req.params[0]; 
  res.json({
    pasta,
    conteudo: dados[pasta] || {},
  });
});

// Teste rápido
app.get("/", (req, res) => {
  res.send("🚀 API com JSON estruturado funcionando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
