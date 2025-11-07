// modules/authRouter.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export default function authRouter(pool, SECRET) {
  const router = express.Router();

  // -------------------------
  // 🧠 Middlewares auxiliares
  // -------------------------
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
    if (!req.user || !["admin", "supervisor"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ erro: "Apenas administradores ou supervisores têm acesso." });
    }
    next();
  }

  // -------------------------
  // 🔐 LOGIN
  // -------------------------
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

  // -------------------------
  // 🎟️ Geração de convite (Admin)
  // -------------------------
  router.post("/invite", autenticar, somenteAdmin, (req, res) => {
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

  // -------------------------
  // ✅ Validação de convite
  // -------------------------
  router.get("/validate-invite", (req, res) => {
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

  // -------------------------
  // 🧾 Registro de novo usuário
  // -------------------------
  router.post("/register", async (req, res) => {
    const { invite, senha, username, fullName, registerNumb } = req.body || {};
    if (!invite || !senha || !username)
      return res
        .status(400)
        .json({ erro: "Convite, usuário e senha são obrigatórios" });

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

  // -------------------------
  // 👤 Perfil do usuário autenticado
  // -------------------------
  router.get("/me", autenticar, async (req, res) => {
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

  // -------------------------
  // 👥 Listar todos os usuários (admin/supervisor)
  // -------------------------
  router.get("/list-users", autenticar, async (req, res) => {
    try {
      if (!["admin", "supervisor"].includes(req.user.role)) {
        return res.status(403).json({ ok: false, erro: "Acesso negado." });
      }
      const result = await pool.query(`
        SELECT username, rolename, COALESCE(fullname, '') AS fullname,
               COALESCE(registernumb, '') AS registernumb
        FROM users ORDER BY username ASC
      `);
      res.json({ ok: true, usuarios: result.rows });
    } catch (err) {
      console.error("[AUTH LIST-USERS] Erro:", err.message);
      res.status(500).json({ ok: false, erro: "Erro ao listar usuários." });
    }
  });

  // -------------------------
  // 🧭 Buscar dados detalhados de um usuário (admin/supervisor)
  // -------------------------
  router.get("/user/:username", autenticar, somenteAdmin, async (req, res) => {
    try {
      const username = req.params.username; // <-- parâmetro de rota
      if (!username) {
        return res.status(400).json({ ok: false, erro: "Usuário não informado." });
      }

      const result = await pool.query(
        `SELECT username, rolename, COALESCE(fullname,'') AS fullname,
                COALESCE(registernumb,'') AS registernumb
        FROM users WHERE username = $1`,
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ ok: false, erro: "Usuário não encontrado." });
      }

      res.json({ ok: true, usuario: result.rows[0] });
    } catch (err) {
      console.error("[AUTH USER/:USERNAME] Erro:", err.message);
      res.status(500).json({ ok: false, erro: "Erro ao buscar usuário." });
    }
  });


  // -------------------------
  // 👥 Atualizar outro usuário (somente admin/supervisor)
  // -------------------------
  router.post("/admin-update-user", autenticar, somenteAdmin, async (req, res) => {
    try {
      const { targetUser, fullname, registernumb, username, role } = req.body || {};
      if (!targetUser) {
        return res.status(400).json({ ok: false, erro: "Usuário alvo não informado." });
      }

      const updates = [];
      const values = [];
      let idx = 1;

      if (fullname) {
        updates.push(`fullname = $${idx++}`);
        values.push(fullname);
      }

      if (registernumb) {
        updates.push(`registernumb = $${idx++}`);
        values.push(registernumb);
      }

      if (role) {
        updates.push(`rolename = $${idx++}`);
        values.push(role);
      }

      if (req.user.role === "admin" && username) {
        updates.push(`username = $${idx++}`);
        values.push(username);
      }

      if (updates.length === 0) {
        return res.status(400).json({ ok: false, erro: "Nada a atualizar." });
      }

      values.push(targetUser);

      await pool.query(
        `UPDATE users SET ${updates.join(", ")} WHERE username = $${idx}`,
        values
      );

      res.json({ ok: true, msg: "Usuário atualizado com sucesso!" });
    } catch (err) {
      console.error("[AUTH ADMIN-UPDATE-USER] Erro:", err.message);
      res.status(500).json({ ok: false, erro: "Erro interno ao atualizar usuário." });
    }
  });

  // -------------------------
  // ⚙️ Atualizar preferências do usuário (tempo de recarga e tema)
  // -------------------------
  router.post("/update-profile", autenticar, async (req, res) => {
    try {
      const { refreshtime, usertheme } = req.body || {};

      if (!refreshtime && !usertheme) {
        return res.status(400).json({ ok: false, erro: "Nenhum campo para atualizar." });
      }

      const updates = [];
      const values = [];
      let idx = 1;

      if (refreshtime !== undefined) {
        updates.push(`refreshtime = $${idx++}`);
        values.push(refreshtime);
      }

      if (usertheme !== undefined) {
        updates.push(`usertheme = $${idx++}`);
        values.push(usertheme);
      }

      if (updates.length === 0) {
        return res.status(400).json({ ok: false, erro: "Nada a atualizar." });
      }

      values.push(req.user.user);

      await pool.query(
        `UPDATE users SET ${updates.join(", ")} WHERE username = $${idx}`,
        values
      );

      console.log(`[AUTH] Preferências atualizadas para ${req.user.user}`);

      res.json({
        ok: true,
        msg: "Preferências atualizadas com sucesso!",
        updated: { refreshtime, usertheme },
      });
    } catch (err) {
      console.error("[AUTH UPDATE-PROFILE] Erro:", err);
      res.status(500).json({ ok: false, erro: "Erro ao atualizar perfil." });
    }
  });

  return router;
}
