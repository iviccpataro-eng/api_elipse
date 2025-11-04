// routes/authRouter.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const authRouter = express.Router();

// 🔑 Configurações básicas
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 🔧 Middlewares auxiliares
function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ erro: "Token não enviado" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(403).json({ erro: "Token inválido" });
  }
}

function somenteAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ erro: "Apenas administradores têm acesso." });
  }
  next();
}

// -------------------------
// 🔐 ROTAS DE AUTENTICAÇÃO
// -------------------------

// Login
authRouter.post("/login", async (req, res) => {
  const { user, senha } = req.body || {};
  if (!user || !senha)
    return res.status(400).json({ erro: "Usuário e senha são obrigatórios" });

  try {
    const result = await pool.query(
      "SELECT username, passhash, rolename FROM users WHERE username = $1",
      [user]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ erro: "Credenciais inválidas" });

    const usuario = result.rows[0];
    const match = await bcrypt.compare(senha, usuario.passhash);
    if (!match)
      return res.status(401).json({ erro: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: usuario.username, user: usuario.username, role: usuario.rolename },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("[AUTH LOGIN] Erro:", err.message);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// Geração de convite (somente admin)
authRouter.post("/invite", autenticar, somenteAdmin, (req, res) => {
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

// Validação de convite
authRouter.get("/validate-invite", (req, res) => {
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

// Registro de usuário
authRouter.post("/register", async (req, res) => {
  const { invite, senha, username, fullName, registerNumb } = req.body || {};
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
    if (check.rows.length > 0)
      return res.status(400).json({ erro: "Usuário já existe." });

    await pool.query(
      `INSERT INTO users (username, passhash, rolename, fullname, registernumb)
       VALUES ($1,$2,$3,$4,$5)`,
      [username, hash, role || "user", fullName || "", registerNumb || ""]
    );

    res.json({ ok: true, msg: "Usuário registrado com sucesso!" });
  } catch (err) {
    console.error("[AUTH REGISTER] Erro:", err.message);
    res.status(400).json({ erro: "Convite inválido ou expirado" });
  }
});

// Perfil do usuário autenticado
authRouter.get("/me", autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT username, rolename, COALESCE(fullname,'') AS fullname,
              COALESCE(registernumb,'') AS registernumb,
              COALESCE(refreshtime,10) AS refreshtime,
              COALESCE(usertheme,'light') AS usertheme
       FROM users WHERE username = $1`,
      [req.user.user]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ ok: true, usuario: result.rows[0] });
  } catch (err) {
    console.error("[AUTH ME] Erro:", err.message);
    res.status(500).json({ erro: "Erro ao buscar perfil." });
  }
});

export default authRouter;
