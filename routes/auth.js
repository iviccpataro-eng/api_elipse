// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { autenticar, somenteAdmin, SECRET } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { user, senha } = req.body || {};
  if (!user || !senha)
    return res.status(400).json({ erro: "Usuário e senha são obrigatórios" });

  try {
    const result = await pool.query(
      "SELECT username, passhash, rolename, COALESCE(theme, 'light') AS theme FROM users WHERE username = $1",
      [user]
    );
    if (result.rows.length === 0) return res.status(401).json({ erro: "Credenciais inválidas" });

    const usuario = result.rows[0];
    const match = await bcrypt.compare(senha, usuario.passhash);
    if (!match) return res.status(401).json({ erro: "Credenciais inválidas" });

    const token = jwt.sign(
      { id: usuario.username, user: usuario.username, role: usuario.rolename, theme: usuario.theme },
      SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

router.post("/invite", autenticar, somenteAdmin, (req, res) => {
  const { role, expiresIn } = req.body || {};
  const payload = { type: "invite", createdBy: req.user.user, role: role || "user" };
  const token = jwt.sign(payload, SECRET, { expiresIn: expiresIn || "1h" });
  const link = `${process.env.FRONTEND_URL || "https://api-elipse.vercel.app"}/register?invite=${token}`;
  res.json({ msg: "Convite gerado", link, token, payload });
});

router.get("/validate-invite", (req, res) => {
  try {
    const { token } = req.query;
    const payload = jwt.verify(token, SECRET);
    if (payload.type !== "invite") throw new Error();
    res.json({ ok: true, role: payload.role });
  } catch {
    res.json({ ok: false, erro: "Convite inválido ou expirado" });
  }
});

router.post("/register", async (req, res) => {
  const { invite, senha, username } = req.body || {};
  if (!invite || !senha || !username)
    return res.status(400).json({ erro: "Convite, usuário e senha são obrigatórios" });

  try {
    const payload = jwt.verify(invite, SECRET);
    if (payload.type !== "invite") throw new Error();
    const { role } = payload;
    const hash = await bcrypt.hash(senha, 10);

    const check = await pool.query("SELECT 1 FROM users WHERE username = $1", [username]);
    if (check.rows.length > 0) return res.status(400).json({ erro: "Usuário já existe." });

    await pool.query(
      "INSERT INTO users (username, passhash, rolename) VALUES ($1,$2,$3)",
      [username, hash, role || "user"]
    );

    res.json({ ok: true, msg: "Usuário registrado com sucesso!" });
  } catch {
    res.status(400).json({ erro: "Convite inválido ou expirado" });
  }
});

router.post("/update-profile", autenticar, async (req, res) => {
  const { fullname, matricula, username, senhaAtual, novaSenha, theme } = req.body || {};
  if (!username) return res.status(400).json({ erro: "Usuário é obrigatório" });

  try {
    const result = await pool.query("SELECT username, passhash FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) return res.status(404).json({ erro: "Usuário não encontrado" });

    const usuario = result.rows[0];
    const updates = [];
    const values = [];
    let idx = 1;

    if (fullname) { updates.push(`fullname = $${idx++}`); values.push(fullname); }
    if (matricula) { updates.push(`matricula = $${idx++}`); values.push(matricula); }
    if (theme) { updates.push(`theme = $${idx++}`); values.push(theme); }
    if (novaSenha) {
      const match = await bcrypt.compare(senhaAtual, usuario.passhash);
      if (!match) return res.status(401).json({ erro: "Senha atual incorreta" });
      const hash = await bcrypt.hash(novaSenha, 10);
      updates.push(`passhash = $${idx++}`); values.push(hash);
    }

    if (!updates.length) return res.status(400).json({ erro: "Nenhuma alteração enviada." });

    values.push(username);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE username = $${idx}`, values);

    res.json({ ok: true, msg: "Perfil atualizado com sucesso!" });
  } catch {
    res.status(500).json({ erro: "Erro ao atualizar perfil." });
  }
});

router.get("/me", autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT username, rolename, COALESCE(fullname,'') as fullname, COALESCE(matricula,'') as matricula, COALESCE(theme,'light') as theme 
       FROM users WHERE username = $1`,
      [req.user.user]
    );
    if (!result.rows.length) return res.status(404).json({ erro: "Usuário não encontrado" });
    res.json({ ok: true, usuario: result.rows[0] });
  } catch {
    res.status(500).json({ erro: "Erro ao buscar perfil." });
  }
});

export default router;
