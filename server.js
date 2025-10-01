// server.js
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pkg from "pg";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// --------- Middlewares globais ---------
const allowedOrigins = [
  "https://api-elipse.vercel.app", // frontend
  "http://localhost:5173"          // desenvolvimento local com Vite
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS bloqueado para origem: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Responde pré-flights corretamente
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

app.use(express.json({ limit: "1mb" }));

// --------- Config ---------
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";

// Conexão com PostgreSQL (Render já injeta DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Armazenamento em memória (para dados do Elipse)
let dados = {};

// Usuário admin inicial em memória (fallback)
let usuarios = [
  {
    id: 1,
    user: process.env.ADMIN_USER,
    senha: process.env.ADMIN_PASS,
    role: "admin",
  },
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

function normalizeBody(req) {
  let payload = req.body;
  if (payload && typeof payload.valor === "string") {
    const b64 = payload.valor;
    const buf = Buffer.from(b64, "base64");
    let txt = buf.toString("utf8");
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
const FIXED_TOKEN = jwt.sign(
  { id: "react-dashboard", user: "react", role: "reader" },
  SECRET
);
console.log("[BOOT] Token fixo para o React:", FIXED_TOKEN);

function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.warn("[AUTH] ❌ Nenhum token enviado");
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const token = authHeader.split(" ")[1];
  if (token === FIXED_TOKEN) {
    req.user = { id: "react-dashboard", user: "react", role: "reader" };
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(403).json({ erro: "Token inválido" });
  }
}

function somenteAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ erro: "Apenas administradores têm acesso." });
  }
  next();
}

// --------- Rotas de Autenticação ---------
app.post("/auth/login", async (req, res) => {
  const { user, senha } = req.body || {};
  if (!user || !senha)
    return res
      .status(400)
      .json({ erro: "Usuário e senha são obrigatórios" });

  try {
    const result = await pool.query(
      "SELECT username, passhash, rolename, fullname, matricula FROM users WHERE username = $1",
      [user]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = result.rows[0];
    const match = await bcrypt.compare(senha, usuario.passhash);
    if (!match) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      {
        id: usuario.username,
        user: usuario.username,
        role: usuario.rolename,
      },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

app.post("/auth/invite", autenticar, somenteAdmin, (req, res) => {
  const { role, expiresIn } = req.body || {};

  const payload = {
    type: "invite",
    createdBy: req.user.user,
    role: role || "user",
  };

  const token = jwt.sign(payload, SECRET, { expiresIn: expiresIn || "1h" });
  const link = `${
    process.env.FRONTEND_URL || "https://api-elipse.vercel.app"
  }/register?invite=${token}`;

  res.json({ msg: "Convite gerado", link, token, payload });
});

app.get("/auth/validate-invite", (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ ok: false, erro: "Token ausente" });

    const payload = jwt.verify(token, SECRET);
    if (payload.type !== "invite") throw new Error();

    res.json({ ok: true, role: payload.role });
  } catch {
    res.json({ ok: false, erro: "Convite inválido ou expirado" });
  }
});

app.post("/auth/register", async (req, res) => {
  const { invite, senha, username } = req.body || {};
  if (!invite || !senha || !username) {
    return res
      .status(400)
      .json({ erro: "Convite, usuário e senha são obrigatórios" });
  }

  try {
    const payload = jwt.verify(invite, SECRET);
    if (payload.type !== "invite") throw new Error();

    const { role } = payload;
    const hash = await bcrypt.hash(senha, 10);

    const check = await pool.query("SELECT 1 FROM users WHERE username = $1", [
      username,
    ]);
    if (check.rows.length > 0) {
      return res.status(400).json({ erro: "Usuário já existe." });
    }

    await pool.query(
      "INSERT INTO users (username, passhash, rolename) VALUES ($1,$2,$3)",
      [username, hash, role || "user"]
    );

    res.json({ ok: true, msg: "Usuário registrado com sucesso!" });
  } catch (err) {
    res.status(400).json({ erro: "Convite inválido ou expirado" });
  }
});

// --------- Atualização de Perfil ---------
app.post("/auth/update-profile", autenticar, async (req, res) => {
  const { fullname, matricula, username, senhaAtual, novaSenha } = req.body || {};

  if (!username) {
    return res.status(400).json({ erro: "Usuário é obrigatório" });
  }

  try {
    const result = await pool.query(
      "SELECT username, passhash FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const usuario = result.rows[0];

    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ erro: "Senha atual é obrigatória para trocar a senha." });
      }
      const match = await bcrypt.compare(senhaAtual, usuario.passhash);
      if (!match) {
        return res.status(401).json({ erro: "Senha atual incorreta." });
      }
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (fullname) {
      updates.push(`fullname = $${idx++}`);
      values.push(fullname);
    }
    if (matricula) {
      updates.push(`matricula = $${idx++}`);
      values.push(matricula);
    }
    if (novaSenha) {
      const hash = await bcrypt.hash(novaSenha, 10);
      updates.push(`passhash = $${idx++}`);
      values.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ erro: "Nenhuma alteração enviada." });
    }

    values.push(username);

    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE username = $${idx}`,
      values
    );

    // 🔄 Retorna perfil atualizado
    const updated = await pool.query(
      "SELECT username, rolename, fullname, matricula FROM users WHERE username = $1",
      [username]
    );

    res.json({ ok: true, msg: "Perfil atualizado com sucesso!", usuario: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao atualizar perfil." });
  }
});

// --------- Obter Perfil do Usuário ---------
app.get("/auth/me", autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT username, rolename, COALESCE(fullname, '') as fullname, COALESCE(matricula, '') as matricula FROM users WHERE username = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    res.json({ ok: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar perfil." });
  }
});

// --------- CRUD de usuários (apenas exemplo em memória) ---------
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
    return res
      .status(400)
      .json({ erro: e.message, detalhe: e.cause?.message });
  }

  if (typeof payload === "undefined") {
    return res.status(400).json({ erro: "Body vazio ou inválido." });
  }

  setByPath(dados, path, payload);
  res.json({ status: "OK", caminho: `/dados/${path}`, salvo: payload });
});

// --------- Testes ---------
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.get("/test-users", async (req, res) => {
  try {
    const result = await pool.query("SELECT username, rolename FROM users");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// --------- Servir React buildado ---------
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res, next) => {
  if (
    req.originalUrl.startsWith("/auth") ||
    req.originalUrl.startsWith("/dados") ||
    req.originalUrl.startsWith("/data") ||
    req.originalUrl.startsWith("/usuarios") ||
    req.originalUrl.startsWith("/test")
  ) {
    return next();
  }

  res.sendFile(path.join(clientBuildPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Erro interno ao servir o frontend.");
    }
  });
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
  console.log(`[BOOT] Servidor rodando na porta ${PORT}`);
});
