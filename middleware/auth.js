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
  const { username, role } = req.body || {};

  if (!username || !role)
    return res.status(400).json({ erro: "Usuário e papel são obrigatórios" });

  try {
    // Gera um token temporário de convite (expira em 24 horas)
    const inviteToken = jwt.sign(
      { invited_user: username, invited_role: role, invited_by: req.user.user },
      SECRET,
      { expiresIn: "24h" }
    );

    console.log(`[AUTH] Convite gerado por ${req.user.user} → ${username} (${role})`);
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

export default router;
