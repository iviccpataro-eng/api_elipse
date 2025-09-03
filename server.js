// server.js
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "1mb" })); // aceita body JSON até ~1MB

// Armazenamento em memória (reinicia a cada deploy/restart)
let dados = {};

// --------- Helpers ---------
function setByPath(root, pathStr, value) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      ref[p] = value;
    } else {
      if (!ref[p] || typeof ref[p] !== "object") ref[p] = {};
      ref = ref[p];
    }
  }
}

function getByPath(root, pathStr) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (const p of parts) {
    if (ref && Object.prototype.hasOwnProperty.call(ref, p)) {
      ref = ref[p];
    } else {
      return undefined;
    }
  }
  return ref;
}

// Converte body: aceita JSON direto OU { valor: "<base64>" }
function normalizeBody(req) {
  let payload = req.body;

  // Caso venha no padrão { valor: "<base64>" }
  if (payload && typeof payload.valor === "string") {
    const b64 = payload.valor;
    const buf = Buffer.from(b64, "base64");
    let txt = buf.toString("utf8");
    // remove BOM, se houver
    txt = txt.replace(/^\uFEFF/, "");
    try {
      payload = JSON.parse(txt);
    } catch (e) {
      // se não for JSON válido, retorna erro claro
      const err = new Error("Valor Base64 decodificado não é JSON válido.");
      err.cause = e;
      throw err;
    }
  }

  return payload;
}

// --------- Rotas ---------

// Raiz
app.get("/", (req, res) => {
  res.send("API Elipse rodando no Render!");
});

// GET all (alias: /dados e /data)
app.get(["/dados", "/data"], (req, res) => {
  res.json(dados);
});

// GET por caminho (alias)
app.get(["/dados/*", "/data/*"], (req, res) => {
  const path = req.params[0] || "";
  const ref = getByPath(dados, path);
  if (typeof ref === "undefined") {
    return res.status(404).json({ erro: "Caminho não encontrado", caminho: path });
  }
  res.json(ref);
});

// POST por caminho (alias)
app.post(["/dados/*", "/data/*"], (req, res) => {
  const path = req.params[0] || "";

  let payload;
  try {
    payload = normalizeBody(req);
  } catch (e) {
    return res.status(400).json({
      erro: e.message,
      detalhe: e.cause ? e.cause.message : undefined,
    });
  }

  if (typeof payload === "undefined") {
    return res.status(400).json({ erro: "Body vazio ou inválido." });
  }

  setByPath(dados, path, payload);

  console.log(
    `[${new Date().toISOString()}] POST /dados/${path}`,
    JSON.stringify(payload).slice(0, 400) + (JSON.stringify(payload).length > 400 ? "…(trunc)" : "")
  );

  res.json({ status: "OK", caminho: `/dados/${path}`, salvo: payload });
});

// 404 JSON amigável (pega tudo que não casou)
app.all("*", (req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada",
    method: req.method,
    url: req.originalUrl,
    dica: "Use /dados/... ou /data/... com POST para salvar e GET para ler.",
  });
});

// Porta Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
