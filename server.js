const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ======== CONFIGURAÇÕES =========
const PORT = process.env.PORT || 3000;
const WRITE_API_KEY = process.env.WRITE_API_KEY;
const READ_API_KEY = process.env.READ_API_KEY;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

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

// ====== Endpoints ======

// Entregar chave pública (para o VB usar na criptografia)
app.get("/public-key", checkReadKey, (req, res) => {
  res.send(PUBLIC_KEY);
});

// Receber dados criptografados (VB → Render)
app.post("/data", checkWriteKey, (req, res) => {
  try {
    const { encryptedData } = req.body;

    // Descriptografar com a chave privada do Render
    const decrypted = crypto.privateDecrypt(
      {
        key: PRIVATE_KEY,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encryptedData, "base64")
    );

    const originalText = decrypted.toString("utf-8");

    console.log("📥 Recebido e descriptografado:", originalText);

    res.json({
      status: "OK",
      decrypted: originalText,
    });
  } catch (err) {
    console.error("Erro ao descriptografar:", err.message);
    res.status(400).json({ error: "Falha ao descriptografar os dados." });
  }
});

// GET protegido (exemplo: listar últimos dados recebidos)
app.get("/data", checkReadKey, (req, res) => {
  res.json({ message: "Aqui viriam os dados descriptografados e salvos" });
});

// Teste rápido
app.get("/", (req, res) => {
  res.send("🚀 API com RSA + API Keys funcionando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
