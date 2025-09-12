// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

const bcrypt = require("bcrypt");
const { Pool } = require("pg");

// --------- Conexão com o Banco de Dados ---------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // já vem do Render
  ssl: { rejectUnauthorized: false }
});

// --------- Rotas de Autenticação ---------
app.post("/auth/login", async (req, res) => {
  const { user, senha } = req.body;
  if (!user || !senha) return res.status(400).json({ erro: "Dados usuário/senha são obrigatórios" });

  try {
    // buscar usuário no banco
    const result = await pool.query(
      'SELECT * FROM users WHERE "userName" = $1',
      [user]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = result.rows[0];

    // comparar senha com hash
    const match = await bcrypt.compare(senha, usuario.passhash);
    if (!match) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    // gerar token JWT
    const token = jwt.sign(
      {
        id: usuario.username, 
        user: usuario.username, 
        role: usuario.rolename
      },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// --------- Registro via convite seguro ---------
app.post("/usuarios/register", autenticar, somenteAdmin, async (req, res) => {
  const { user, senha } = req.body;

  if (!user || !senha) {
    return res.status(400).json({ erro: "Usuário e senha são obrigatórios" });
  }

  try {
    // Hash da senha com bcrypt
    const saltRounds = 10;
    const hash = await bcrypt.hash(senha, saltRounds);

    // Insere no banco
    const query = `INSERT INTO users (userName, passHash, roleName) VALUES ($1, $2, $3) RETURNING userName, roleName`;
    const values = [user, hash, "user"];

    const result = await pool.query(query, values);

    res.json({ msg: "Usuário criado com sucesso", usuario: result.rows[0] });
  } catch (err) {
    console.error("Erro ao registrar usuário:", err);
    res.status(500).json({ erro: "Falha ao registrar usuário" });
  }
});

// Middleware
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "1mb" })); // aceita body JSON até ~1MB

// --------- Config ---------
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad";

// Armazenamento em memória (reinicia a cada deploy/restart)
let dados = {};

// Usuários em memória (exemplo)
let usuarios = [
  { id: 1, user: process.env.ADMIN_USER, senha: process.env.ADMIN_PASS, role: "admin" }
];

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
      const err = new Error("Valor Base64 decodificado não é JSON válido.");
      err.cause = e;
      throw err;
    }
  }

  return payload;
}
// --------- Middlewares de Autenticação ---------
function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });

  const token = authHeader.split(" ")[1];

  // ✅ Aceita o token fixo do React
  if (token === FIXED_TOKEN) {
    req.user = { id: "react-dashboard", user: "react", role: "reader" };
    return next();
  }

  // ✅ Caso contrário, valida como JWT normal
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(403).json({ erro: "Token inválido" });
  }
}

function somenteAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ erro: "Apenas administradores têm acesso." });
  }
  next();
}

// --------- Token fixo para o React (somente leitura) ---------
const FIXED_TOKEN = jwt.sign(
  { id: "react-dashboard", user: "react", role: "reader" },
  SECRET
  // sem expiresIn -> não expira
);
console.log("Token fixo para o React:", FIXED_TOKEN);

// CRUD de usuários (apenas admin)
app.get("/usuarios", autenticar, somenteAdmin, (req, res) => {
  res.json(usuarios);
});

app.post("/usuarios", autenticar, somenteAdmin, (req, res) => {
  const { user, senha, role } = req.body;
  const novo = { id: Date.now(), user, senha, role: role || "user" };
  usuarios.push(novo);
  res.json({ msg: "Usuário criado", usuario: novo });
});

// --------- Rotas já existentes ---------

// Raiz
app.get("/", (req, res) => {
  res.send("API Elipse rodando no Render!");
});

// GET all (alias: /dados e /data) → protegido
app.get(["/dados", "/data"], autenticar, (req, res) => {
  res.json(dados);
});

// GET por caminho (alias) → protegido
app.get(["/dados/*", "/data/*"], autenticar, (req, res) => {
  const path = req.params[0] || "";
  const ref = getByPath(dados, path);
  if (typeof ref === "undefined") {
    return res
      .status(404)
      .json({ erro: "Caminho não encontrado", caminho: path });
  }
  res.json(ref);
});

// POST por caminho (alias) → protegido
app.post(["/dados/*", "/data/*"], autenticar, (req, res) => {
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
    JSON.stringify(payload).slice(0, 400) +
      (JSON.stringify(payload).length > 400 ? "…(trunc)" : "")
  );

  res.json({ status: "OK", caminho: `/dados/${path}`, salvo: payload });
});

// 404 JSON amigável
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

// --------- Rota para gerar convite (apenas admin) ---------
app.post("/auth/invite", autenticar, somenteAdmin, (req, res) => {
  const inviteToken = jwt.sign(
    { type: "invite" },
    SECRET,
    { expiresIn: "24h" } // expira em 24 horas
  );
  res.json({
    link: `https://api-elipse.vercel.app/register?invite=${inviteToken}`
  });
});

// --------- Verificar token de convite ---------
app.post("/auth/verify-invite", (req, res) => {
  const { invite } = req.body;
  try {
    const payload = jwt.verify(invite, SECRET);
    if (payload.type !== "invite") throw new Error();
    res.json({ valid: true });
  } catch {
    res.status(400).json({ valid: false, erro: "Convite inválido ou expirado" });
  }
});

// --------- Registrar usuário ---------
app.post("/auth/register", async (req, res) => {
  const { invite, user, senha, role } = req.body;

  try {
    const payload = jwt.verify(invite, SECRET);
    if (payload.type !== "invite") throw new Error();

    // Criptografar senha
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash(senha, salt);

    // Salvar no PostgreSQL
    await pool.query(
      "INSERT INTO users (userName, passHash, roleName) VALUES ($1,$2,$3)",
      [user, passHash, role || "user"]
    );

    res.json({ msg: "Usuário registrado com sucesso!" });
  } catch (err) {
    res.status(400).json({ erro: "Convite inválido ou expirado" });
  }
});

// --------- Gera link de convite ---------
app.post("/auth/invite", autenticar, somenteAdmin, (req, res) => {
  const { expiresIn } = req.body || {};

  // Tempo padrão: 1h (pode customizar no body: { expiresIn: "15m" } )
  const token = jwt.sign(
    { id: "invite", user: "adminApi", role: "admin" },
    SECRET,
    { expiresIn: expiresIn || "1h" }
  );

  const link = `${process.env.FRONTEND_URL || "https://api-elipse.vercel.app"}/register?invite=${token}`;

  res.json({ msg: "Convite gerado", link, token });
});
