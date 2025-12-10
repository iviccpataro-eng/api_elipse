// modules/authRouter.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { uploadAvatar } from "./uploadAvatar.js"; // multer single('avatar')
import { processAvatar } from "../services/processAvatar.js";
import path from "path";

/**
 * authRouter(pool, SECRET)
 * - pool: instancia do pg.Pool
 * - SECRET: secret jwt
 *
 * Retorna um express.Router com todas as rotas de autenticação / perfil.
 *
 * Observações principais:
 * - Evitar enviar string vazia ("") para colunas numéricas (BIGINT / SMALLINT).
 * - Campos numéricos: registernumb (bigint) e refreshtime (smallint).
 * - uploadAvatar é middleware multer.single('avatar'): se não houver arquivo, req.file = undefined.
 */
export default function authRouter(pool, SECRET) {
  const router = express.Router();

  // -------------------------
  // 🧠 Middlewares auxiliares
  // -------------------------
  function autenticar(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });

    const token = String(authHeader).split(" ")[1];
    try {
      const payload = jwt.verify(token, SECRET);

      // Bloqueia tokens do tipo 'invite'
      if (payload.type === "invite")
        return res.status(403).json({ erro: "Convites não têm permissão para acessar o sistema." });

      req.user = payload; // { id, user, role, ... }
      next();
    } catch (err) {
      console.warn("[AUTH] token inválido:", err?.message || err);
      return res.status(403).json({ erro: "Token inválido" });
    }
  }

  function somenteAdmin(req, res, next) {
    if (!req.user || !["admin", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ erro: "Apenas administradores ou supervisores têm acesso." });
    }
    next();
  }

  // -------------------------
  // 🔐 LOGIN
  // -------------------------
  router.post("/login", async (req, res) => {
    const { user, senha } = req.body || {};
    if (!user || !senha) return res.status(400).json({ erro: "Usuário e senha são obrigatórios" });

    try {
      const result = await pool.query(
        "SELECT username, passhash, rolename FROM users WHERE username = $1",
        [user]
      );
      if (result.rows.length === 0) return res.status(401).json({ erro: "Credenciais inválidas" });

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
      console.error("[AUTH LOGIN] Erro:", err.message || err);
      res.status(500).json({ erro: "Erro interno no servidor" });
    }
  });

  // -------------------------
  // 🎟️ Geração de convite (Admin)
  // -------------------------
  router.post("/invite", autenticar, somenteAdmin, (req, res) => {
    try {
      const { role, expiresIn } = req.body || {};
      const payload = {
        type: "invite",
        createdBy: req.user.user,
        role: role || "user",
      };
      const token = jwt.sign(payload, SECRET, { expiresIn: expiresIn || "1h" });
      const link = `${process.env.FRONTEND_URL || "https://api-elipse.onrender.com"}/register?invite=${token}`;
      res.json({ msg: "Convite gerado", link, token, payload });
    } catch (err) {
      console.error("[AUTH INVITE] Erro:", err);
      res.status(500).json({ erro: "Erro ao gerar convite" });
    }
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
    } catch (err) {
      res.json({ ok: false, erro: "Convite inválido ou expirado" });
    }
  });

  // -------------------------
  // 🧾 Registro de novo usuário
  // -------------------------
  router.post("/register", async (req, res) => {
    const { invite, senha, username, fullName, registerNumb } = req.body || {};
    if (!invite || !senha || !username)
      return res.status(400).json({ erro: "Convite, usuário e senha são obrigatórios" });

    try {
      const payload = jwt.verify(invite, SECRET);
      if (payload.type !== "invite") throw new Error();

      const { role } = payload;
      const hash = await bcrypt.hash(senha, 10);

      const check = await pool.query("SELECT 1 FROM users WHERE username = $1", [username]);
      if (check.rows.length > 0) return res.status(400).json({ erro: "Usuário já existe." });

      // Tratar registernumb: se vazio, inserir NULL (coluna bigint aceita NULL)
      const regNumValue =
        registerNumb === undefined || registerNumb === null || String(registerNumb).trim() === ""
          ? null
          : String(registerNumb).trim();

      await pool.query(
        `INSERT INTO users (username, passhash, rolename, fullname, registernumb)
         VALUES ($1,$2,$3,$4,$5)`,
        [username, hash, role || "user", fullName || "", regNumValue]
      );

      res.json({ ok: true, msg: "Usuário registrado com sucesso!" });
    } catch (err) {
      console.error("[AUTH REGISTER] Erro:", err.message || err);
      res.status(400).json({ erro: "Convite inválido ou expirado" });
    }
  });

  // -------------------------
  // 👤 Perfil do usuário autenticado (retorna avatarurl)
  // -------------------------
  router.get("/me", autenticar, async (req, res) => {
    try {
      // Suporte a diferentes formatos de token antigos/novos
      const username =
        req.user?.user || // tokens antigos
        req.user?.username ||
        req.user?.id ||
        null;

      if (!username) {
        return res.status(400).json({ erro: "Token inválido: usuário ausente." });
      }

      const result = await pool.query(
        `SELECT username, rolename,
                COALESCE(fullname, '') AS fullname,
                COALESCE(registernumb::text, '') AS registernumb,
                COALESCE(refreshtime::text, '10') AS refreshtime,
                COALESCE(usertheme, 'light') AS usertheme,
                COALESCE(avatarurl, '') AS avatarurl
         FROM users WHERE username = $1`,
        [username]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ erro: "Usuário não encontrado" });

      res.json({ ok: true, usuario: result.rows[0] });
    } catch (err) {
      console.error("[AUTH ME] ERRO COMPLETO:", err && err.message ? err.message : err);
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
               COALESCE(registernumb::text, '') AS registernumb
        FROM users ORDER BY username ASC
      `);
      res.json({ ok: true, usuarios: result.rows });
    } catch (err) {
      console.error("[AUTH LIST-USERS] Erro:", err.message || err);
      res.status(500).json({ ok: false, erro: "Erro ao listar usuários." });
    }
  });

  // -------------------------
  // 🧭 Buscar usuário específico (admin/supervisor)
  // -------------------------
  router.get("/user/:username", autenticar, somenteAdmin, async (req, res) => {
    try {
      const username = req.params.username;
      if (!username) return res.status(400).json({ ok: false, erro: "Usuário não informado." });

      const result = await pool.query(
        `SELECT username, rolename, COALESCE(fullname,'') AS fullname,
                COALESCE(registernumb::text,'') AS registernumb, COALESCE(avatarurl,'') AS avatarurl
        FROM users WHERE username = $1`,
        [username]
      );

      if (result.rows.length === 0) return res.status(404).json({ ok: false, erro: "Usuário não encontrado." });
      res.json({ ok: true, usuario: result.rows[0] });
    } catch (err) {
      console.error("[AUTH USER/:USERNAME] Erro:", err.message || err);
      res.status(500).json({ ok: false, erro: "Erro ao buscar usuário." });
    }
  });

  // -------------------------
  // 👥 Atualizar outro usuário (somente admin/supervisor)
  // - Se username for alterado, retornamos newToken no response para uso do front.
  // - Trata corretamente registernumb/refreshtime para não enviar ""
  // -------------------------
  router.post("/admin-update-user", autenticar, somenteAdmin, async (req, res) => {
    try {
      const { targetUser, fullname, registernumb, username, role, refreshtime, usertheme } = req.body || {};
      if (!targetUser) return res.status(400).json({ ok: false, erro: "Usuário alvo não informado." });

      const updates = [];
      const values = [];
      let idx = 1;
      let usernameChangedTo = null;

      // fullname
      if (fullname !== undefined) {
        updates.push(`fullname = $${idx++}`);
        values.push(fullname || "");
      }

      // username (rename) - only if provided and not empty
      if (username !== undefined && String(username).trim() !== "") {
        updates.push(`username = $${idx++}`);
        values.push(String(username).trim());
        usernameChangedTo = String(username).trim();
      }

      // registernumb (bigint) - accept NULL when empty
      if (registernumb !== undefined) {
        updates.push(`registernumb = $${idx++}`);
        if (registernumb === "" || registernumb === null) {
          values.push(null);
        } else {
          // keep as string (safer for big ints) or number if small
          const rn = String(registernumb).trim();
          values.push(rn === "" ? null : rn);
        }
      }

      // refreshtime (smallint)
      if (refreshtime !== undefined) {
        updates.push(`refreshtime = $${idx++}`);
        if (refreshtime === "" || refreshtime === null) {
          values.push(10);
        } else {
          const rt = Number(refreshtime);
          values.push(Number.isFinite(rt) ? rt : 10);
        }
      }

      // rolename
      if (role !== undefined) {
        updates.push(`rolename = $${idx++}`);
        values.push(role || null);
      }

      // usertheme (string)
      if (usertheme !== undefined) {
        updates.push(`usertheme = $${idx++}`);
        values.push(usertheme || "light");
      }

      if (updates.length === 0) return res.status(400).json({ ok: false, erro: "Nada a atualizar." });

      // finalize: WHERE targetUser
      values.push(targetUser);
      const sql = `UPDATE users SET ${updates.join(", ")} WHERE username = $${idx}`;
      await pool.query(sql, values);

      const resp = { ok: true, msg: "Usuário atualizado com sucesso!" };

      // Se username foi alterado, gerar token novo (útil para front)
      if (usernameChangedTo) {
        const r = await pool.query("SELECT username, rolename FROM users WHERE username = $1", [usernameChangedTo]);
        if (r.rows.length > 0) {
          const u = r.rows[0];
          const newToken = jwt.sign({ id: u.username, user: u.username, role: u.rolename }, SECRET, {
            expiresIn: "8h",
          });
          resp.newToken = newToken;
          resp.newUsername = u.username;
        }
      }

      res.json(resp);
    } catch (err) {
      console.error("[AUTH ADMIN-UPDATE-USER] Erro:", err && err.message ? err.message : err);
      res.status(500).json({ ok: false, erro: "Erro interno ao atualizar usuário." });
    }
  });

  // -------------------------------------------------------------
  // ⚙️ ROTA UNIFICADA: atualizar perfil (pref + senha + avatar)
  // - aceita multipart/form-data (avatar) ou request sem arquivo
  // - campos suportados:
  //    fullname, registernumb, refreshtime, usertheme
  //    senhaAtual, novaSenha
  //    avatar (file) - campo name = 'avatar'
  // -------------------------------------------------------------
  router.post(
    "/update-profile",
    autenticar,
    // multer middleware (se não houver arquivo, req.file = undefined)
    uploadAvatar,
    async (req, res) => {
      try {
        // DEBUG leve (útil para dev)
        console.log("BODY:", req.body);
        console.log("FILE:", req.file ? { filename: req.file.filename, size: req.file.size } : null);

        // 1) Ler campos
        const {
          fullname,
          registernumb,
          refreshtime,
          usertheme,
          senhaAtual,
          novaSenha,
        } = req.body || {};

        // 2) Se veio arquivo, processa avatar (sharp)
        if (req.file) {
          try {
            const processedRelativePath = await processAvatar(req.file.path, req.user.user);
            const serverBase = process.env.SERVER_URL?.trim() || `http://localhost:${process.env.PORT || 3000}`;
            const avatarUrl = `${serverBase}/${processedRelativePath.replace(/^[\\/]+/, "")}`;

            await pool.query(`UPDATE users SET avatarurl = $1 WHERE username = $2`, [avatarUrl, req.user.user]);
          } catch (errProcess) {
            // processAvatar pode lançar erro (ex: imagem pequena) — devolve 400 com mensagem clara
            console.error("[AUTH UPDATE-PROFILE] Erro ao processar avatar:", errProcess && errProcess.message ? errProcess.message : errProcess);
            return res.status(400).json({ ok: false, erro: errProcess.message || "Erro ao processar avatar." });
          }
        }

        // 3) Troca de senha (se solicitada)
        if (novaSenha !== undefined && String(novaSenha).length > 0) {
          if (!senhaAtual) return res.status(400).json({ ok: false, erro: "Senha atual é necessária para trocar a senha." });

          const r = await pool.query("SELECT passhash FROM users WHERE username = $1", [req.user.user]);
          if (r.rows.length === 0) return res.status(404).json({ ok: false, erro: "Usuário não encontrado." });

          const match = await bcrypt.compare(senhaAtual, r.rows[0].passhash);
          if (!match) return res.status(401).json({ ok: false, erro: "Senha atual incorreta." });

          const newHash = await bcrypt.hash(novaSenha, 10);
          await pool.query("UPDATE users SET passhash = $1 WHERE username = $2", [newHash, req.user.user]);
        }

        // 4) Atualizar campos textuais (fullname, registernumb, refreshtime, usertheme)
        const updates = [];
        const values = [];
        let idx = 1;

        if (fullname !== undefined) {
          updates.push(`fullname = $${idx++}`);
          values.push(fullname || "");
        }

        if (registernumb !== undefined) {
          updates.push(`registernumb = $${idx++}`);
          if (registernumb === "" || registernumb === null) {
            values.push(null);
          } else {
            // manter como string para bigint (mais seguro para números grandes)
            const rn = String(registernumb).trim();
            values.push(rn === "" ? null : rn);
          }
        }

        if (refreshtime !== undefined) {
          updates.push(`refreshtime = $${idx++}`);
          if (refreshtime === "" || refreshtime === null) {
            values.push(10);
          } else {
            const rt = Number(refreshtime);
            values.push(Number.isFinite(rt) ? rt : 10);
          }
        }

        if (usertheme !== undefined) {
          updates.push(`usertheme = $${idx++}`);
          values.push(usertheme || "light");
        }

        if (updates.length > 0) {
          values.push(req.user.user);
          const sql = `UPDATE users SET ${updates.join(", ")} WHERE username = $${idx}`;
          await pool.query(sql, values);
        }

        // 5) Ler dados recém-atualizados para retorno (inclui avatarurl)
        const result = await pool.query(
          `SELECT username, rolename, COALESCE(fullname,'') AS fullname,
                  COALESCE(registernumb::text,'') AS registernumb,
                  COALESCE(refreshtime::text,'10') AS refreshtime,
                  COALESCE(usertheme,'light') AS usertheme,
                  COALESCE(avatarurl,'') AS avatarurl
           FROM users WHERE username = $1`,
          [req.user.user]
        );

        res.json({
          ok: true,
          msg: "Perfil atualizado com sucesso!",
          usuario: result.rows[0],
        });
      } catch (err) {
        // Tratamento especial para erros de multer (por exemplo: file too large / invalid mimetype)
        console.error("[AUTH UPDATE-PROFILE] Erro:", err && err.message ? err.message : err);

        // Multer errors costumam ter name 'MulterError' ou message contendo 'File too large'
        if (err && err.name === "MulterError") {
          return res.status(400).json({ ok: false, erro: err.message });
        }
        // Se for erro relacionado a input -> devolve 400 com mensagem
        if (err && /invalid input syntax for type/i.test(String(err.message || ""))) {
          return res.status(400).json({ ok: false, erro: err.message });
        }

        return res.status(500).json({ ok: false, erro: "Erro ao atualizar perfil." });
      }
    }
  );

  return router;
}
