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
  "https://api-elipse.vercel.app",
  "http://localhost:5173" // útil no desenvolvimento local com Vite
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
  console.log("[AUTH] Token recebido:", token);

  if (token === FIXED_TOKEN) {
    console.log("[AUTH] ✅ Token fixo reconhecido");
    req.user = { id: "react-dashboard", user: "react", role: "reader" };
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET);
    console.log("[AUTH] ✅ Token de usuário válido:", payload);
    req.user = payload;
    next();
  } catch (err) {
    console.error("[AUTH] ❌ Token inválido:", err.message);
    res.status(403).json({ erro: "Token inválido" });
  }
}

function somenteAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    console.warn("[AUTH] ❌ Acesso negado. Usuário não é admin:", req.user);
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
      "SELECT username, passhash, rolename FROM users WHERE username = $1",
      [user]
    );
    if (result.rows.length === 0) {
      console.warn("[LOGIN] ❌ Usuário não encontrado:", user);
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = result.rows[0];
    const match = await bcrypt.compare(senha, usuario.passhash);
    if (!match) {
      console.warn("[LOGIN] ❌ Senha incorreta para:", user);
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: usuario.username, user: usuario.username, role: usuario.rolename },
      SECRET,
      { expiresIn: "8h" }
    );

    console.log("[LOGIN] ✅ Usuário autenticado:", usuario.username);
    res.json({ token });
  } catch (err) {
    console.error("[LOGIN] ❌ Erro:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// --------- (restante do seu código igual) ---------

// --------- Porta ---------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[BOOT] Servidor rodando na porta ${PORT}`);
});
