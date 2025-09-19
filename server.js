// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();

// --------- Middlewares globais ---------
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));
app.use(express.json({ limit: "1mb" })); // parse JSON antes das rotas

// --------- Config ---------
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";

// Conexão com PostgreSQL (Render já injeta DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Armazenamento em memória (para dados do Elipse)
let dados = {};

// Usuário admin inicial em memória (fallback)
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

  if (payload && typeof payload.valor === "string") {
    const b64 = payload.valor;
    const buf = Buffer.from(b64, "base64");
    let txt = buf.toString("utf8");
    txt = txt.replace(/^\uFEFF/, ""); // remove BOM se houver
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
const FIXED_TOKEN = jwt.sign(
  { id: "react-dashboard", user: "react", role: "reader" },
  SECRET
  // sem expiresIn -> não expira
);
console.log("Token fixo para o React:", FIXED_TOKEN);

function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });

  const token = authHeader.split(" ")[1];

  // Aceita o token fixo do React
  if (token === FIXED_TOKEN) {
    req.user = { id: "react-dashboard", user: "react", role: "reader" };
    return next();
  }

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

// --------- Rotas de Autenticação ---------
app.post("/auth/login", async (req, res) => {
  const { user, senha } = req.body || {};
  if (!user || !senha) return res.status(400).json({ erro: "Usuário e senha são obrigatórios" });

  try {
    const result = await pool.query(
      'SELECT username, passhash, rolename FROM users WHERE username = $1',
      [user]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = result.rows[0];
    const match = await bcrypt.compare(senha, usuario.passhash);
    if (!match) return res.status(401).json({ erro: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: usuario.username, user: usuario.username, role: usuario.rolename },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// --------- Rotas de Convite e Registro ---------
app.post("/auth/invite", autenticar, somenteAdmin, (req, res) => {
  const { username, role, expiresIn } = req.body || {};

  // monta payload do convite
  const payload = {
    type: "invite",
    createdBy: req.user.user,  // quem gerou
    role: role || "user",
  };

  if (username) payload.username = username; // sugestão de login

  const token = jwt.sign(payload, SECRET, { expiresIn: expiresIn || "1h" });

  const link = `${process.env.FRONTEND_URL || "https://api-elipse.vercel.app"}/register?invite=${token}`;

  res.json({ msg: "Convite gerado", link, token, payload });
});

app.post("/auth/register", async (req, res) => {
  const { invite, user, senha } = req.body;

  try {
    const payload = jwt.verify(invite, SECRET);
    if (payload.type !== "invite") throw new Error("Token inválido");

    const saltRounds = 10;
    const hash = await bcrypt.hash(senha, saltRounds);

    const role = payload.role || "user";
    const username = user || payload.username;

    if (!username) {
      return res.status(400).json({ erro: "Usuário não informado" });
    }

    await pool.query(
      "INSERT INTO users (username, passhash, rolename) VALUES ($1,$2,$3)",
      [username, hash, role]
    );

    res.json({ msg: "Usuário registrado com sucesso!", username, role });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(400).json({ erro: "Convite inválido ou expirado" });
  }
});

// Validar convite (usado pelo front para exibir e-mail pré-preenchido)
app.get("/auth/validate-invite", (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ ok: false, erro: "Token ausente" });

    const payload = jwt.verify(token, SECRET);
    if (payload.type !== "invite") throw new Error();

    res.json({ ok: true, email: payload.email, role: payload.role });
  } catch (err) {
    res.json({ ok: false, erro: "Convite inválido ou expirado" });
  }
});

// Registrar usuário a partir do convite
app.post("/auth/register", async (req, res) => {
  const { invite, senha } = req.body || {};
  if (!invite || !senha) return res.status(400).json({ erro: "Convite e senha obrigatórios" });

  try {
    const payload = jwt.verify(invite, SECRET);
    if (payload.type !== "invite") throw new Error();

    const { email, role } = payload;

    // gera hash da senha
    const saltRounds = 10;
    const hash = await bcrypt.hash(senha, saltRounds);

    await pool.query(
      "INSERT INTO users (userName, passHash, roleName) VALUES ($1,$2,$3)",
      [email, hash, role || "user"]
    );

    res.json({ ok: true, msg: "Usuário registrado com sucesso!" });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(400).json({ erro: "Convite inválido ou expirado" });
  }
});


// --------- CRUD de usuários (exemplo: memória) ---------
app.get("/usuarios", autenticar, somenteAdmin, (req, res) => {
  res.json(usuarios);
});

// --------- Rotas do Elipse ---------
app.get("/", (req, res) => {
  res.send("API Elipse rodando no Render!");
});

app.get(["/dados", "/data"], autenticar, (req, res) => {
  res.json(dados);
});

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

// Testar conexão com PostgreSQL
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error("Erro ao conectar no banco:", err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// Listar usuários para debug (⚠️ só para teste!)
app.get("/test-users", async (req, res) => {
  try {
    const result = await pool.query("SELECT username, rolename FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ erro: err.message });
  }
});

// --------- 404 JSON amigável ---------
app.all("*", (req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada",
    method: req.method,
    url: req.originalUrl,
    dica: "Use /dados/... ou /data/... com POST para salvar e GET para ler.",
  });
});

// --------- Porta ---------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
