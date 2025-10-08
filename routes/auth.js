// server/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import { autenticar, somenteAdmin } from "../middleware/auth.js";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";

/* --- LOGIN --- */
router.post("/login", async (req, res) => {
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
    if (!match) return res.status(401).json({ erro: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: usuario.username, user: usuario.username, role: usuario.rolename },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("[AUTH] Erro interno no login:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

/* --- PERFIL DO USUÁRIO --- */
router.get("/me", autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT username, rolename, 
              COALESCE(fullname,'') as fullname, 
              COALESCE(matricula,'') as matricula, 
              COALESCE(theme,'light') as theme 
         FROM users 
        WHERE username = $1`,
      [req.user.user]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });

    res.json({ ok: true, usuario: result.rows[0] });
  } catch (err) {
    console.error("[AUTH] Erro ao buscar perfil:", err);
    res.status(500).json({ erro: "Erro ao buscar perfil." });
  }
});

/* --- ATUALIZA PERFIL / TEMA --- */
router.post("/update-theme", autenticar, async (req, res) => {
  const { theme } = req.body || {};
  if (!theme) return res.status(400).json({ erro: "Tema é obrigatório" });

  try {
    await pool.query("UPDATE users SET theme = $1 WHERE username = $2", [
      theme,
      req.user.user,
    ]);
    res.json({ ok: true, msg: "Tema atualizado!" });
  } catch (err) {
    console.error("[AUTH] Erro ao atualizar tema:", err);
    res.status(500).json({ erro: "Erro ao atualizar tema." });
  }
});

/* --- GERAR CONVITE (ADMIN APENAS) --- */
router.post("/invite", autenticar, somenteAdmin, async (req, res) => {
  const { role } = req.body || {};

  if (!role)
    return res.status(400).json({ erro: "O papel do usuário é obrigatório" });

  try {
    // 🔒 Gera token de convite com ID aleatório (só para referência)
    const randomId = `invite_${Math.random().toString(36).substring(2, 10)}`;

    // Gera token temporário de convite (expira em 24 horas)
    const inviteToken = jwt.sign(
      {
        invited_role: role,
        invited_by: req.user.user,
        invite_id: randomId,
      },
      SECRET,
      { expiresIn: "24h" }
    );

    console.log(
      `[AUTH] Convite gerado por ${req.user.user} → (role: ${role}, token id: ${randomId})`
    );

    res.json({
      ok: true,
      msg: "Convite gerado com sucesso!",
      token: inviteToken,
      expires_in: "24h",
    });
  } catch (err) {
    console.error("[AUTH] Erro ao gerar convite:", err);
    res.status(500).json({ erro: "Erro ao gerar convite." });
  }
});

/* --- REGISTRAR NOVO USUÁRIO (USANDO CONVITE) --- */
router.post("/register", async (req, res) => {
  const { token, username, senha, fullname, matricula } = req.body || {};

  if (!token || !username || !senha)
    return res
      .status(400)
      .json({ erro: "Token de convite, usuário e senha são obrigatórios." });

  try {
    // Valida o token de convite
    const payload = jwt.verify(token, SECRET);

    if (!payload.invited_role) {
      return res.status(400).json({ erro: "Token de convite inválido." });
    }

    const role = payload.invited_role;

    // Verifica se usuário já existe
    const check = await pool.query(
      "SELECT username FROM users WHERE username = $1",
      [username]
    );
    if (check.rows.length > 0) {
      return res
        .status(409)
        .json({
          erro: "Nome de usuário já cadastrado.",
          erro_code: "USERNAME_TAKEN",
        });
    }

    // Cria o hash da senha
    const passhash = await bcrypt.hash(senha, 10);

    // Insere o novo usuário
    await pool.query(
      `INSERT INTO users (username, passhash, rolename, fullname, matricula, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [username, passhash, role, fullname || null, matricula || null]
    );

    console.log(
      `[AUTH] Novo usuário criado via convite: ${username} (role: ${role})`
    );
    res.json({
      ok: true,
      msg: "Usuário criado com sucesso!",
      created_user: username,
      invited_by: payload.invited_by,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ erro: "Token de convite expirado." });
    }
    console.error("[AUTH] Erro ao registrar novo usuário:", err);
    res.status(400).json({ erro: "Token de convite inválido ou malformado." });
  }
});

/* --- VALIDAR TOKEN DE CONVITE --- */
router.get("/validate-invite", async (req, res) => {
  const { token } = req.query || {};
  if (!token) return res.status(400).json({ erro: "Token não fornecido." });

  try {
    const payload = jwt.verify(token, SECRET);
    if (!payload.invited_role)
      return res.status(400).json({ erro: "Convite inválido." });

    res.json({ ok: true, role: payload.invited_role });
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ erro: "Convite expirado." });
    return res.status(400).json({ erro: "Token inválido." });
  }
});

export default router;
