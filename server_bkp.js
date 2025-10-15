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

// -------------------------
// 1️⃣ CONFIGURAÇÃO CORS
// -------------------------
const allowedOrigins = [
  "https://api-elipse.vercel.app",
  "https://api-elipse.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("[CORS] Origem não permitida:", origin);
      return callback(new Error("CORS bloqueado para origem: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res.sendStatus(200);
});

app.use(express.json({ limit: "1mb" }));

// -------------------------
// 2️⃣ CONFIGURAÇÃO GERAL
// -------------------------
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let dados = {};

// -------------------------
// 3️⃣ HELPERS
// -------------------------
function setByPath(root, pathStr, value) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) ref[p] = value;
    else {
      if (!ref[p] || typeof ref[p] !== "object") ref[p] = {};
      ref = ref[p];
    }
  }
}

function getByPath(root, pathStr) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (const p of parts) {
    if (ref && Object.prototype.hasOwnProperty.call(ref, p)) ref = ref[p];
    else return undefined;
  }
  return ref;
}

function normalizeBody(req) {
  let payload = req.body;
  if (payload && typeof payload.valor === "string") {
    const b64 = payload.valor;
    const buf = Buffer.from(b64, "base64");
    let txt = buf.toString("utf8").replace(/^\uFEFF/, "");
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

// -------------------------
// 4️⃣ AUTENTICAÇÃO
// -------------------------
const ELIPSE_FIXED_TOKEN =
  process.env.ELIPSE_FIXED_TOKEN ||
  jwt.sign({ id: "elipse-system", user: "elipse", role: "system" }, SECRET);

console.log("[BOOT] Token fixo do Elipse definido.");

function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ erro: "Token não enviado" });

  const token = authHeader.split(" ")[1];

  // Permitir token fixo apenas no POST do Elipse
  if (
    token === ELIPSE_FIXED_TOKEN &&
    req.method === "POST" &&
    req.path.startsWith("/dados")
  ) {
    req.user = { id: "elipse-system", role: "system" };
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
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
// 5️⃣ ROTAS DE AUTENTICAÇÃO
// -------------------------
app.post("/auth/login", async (req, res) => {
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
    if (check.rows.length > 0)
      return res.status(400).json({ erro: "Usuário já existe." });

    await pool.query(
      "INSERT INTO users (username, passhash, rolename) VALUES ($1,$2,$3)",
      [username, hash, role || "user"]
    );

    res.json({ ok: true, msg: "Usuário registrado com sucesso!" });
  } catch (err) {
    console.error("[AUTH REGISTER] Erro:", err.message);
    res.status(400).json({ erro: "Convite inválido ou expirado" });
  }
});

// 🔧 Atualizado para suportar refreshTime e userTheme
app.post("/auth/update-profile", autenticar, async (req, res) => {
  const {
    fullname,
    matricula,
    username,
    senhaAtual,
    novaSenha,
    refreshtime,
    usertheme,
  } = req.body || {};

  // Usa o username do token JWT se não vier no body
  const targetUser = username || req.user?.user;
  if (!targetUser)
    return res.status(400).json({ erro: "Usuário é obrigatório" });

  try {
    const result = await pool.query(
      "SELECT username, passhash FROM users WHERE username = $1",
      [targetUser]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });

    const usuario = result.rows[0];
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
    if (refreshtime !== undefined) {
      updates.push(`refreshtime = $${idx++}`);
      values.push(refreshtime);
    }
    if (usertheme !== undefined) {
      updates.push(`usertheme = $${idx++}`);
      values.push(usertheme);
    }
    if (novaSenha) {
      if (!senhaAtual)
        return res.status(400).json({ erro: "Senha atual obrigatória" });
      const match = await bcrypt.compare(senhaAtual, usuario.passhash);
      if (!match)
        return res.status(401).json({ erro: "Senha atual incorreta" });
      const hash = await bcrypt.hash(novaSenha, 10);
      updates.push(`passhash = $${idx++}`);
      values.push(hash);
    }

    if (updates.length === 0)
      return res.status(400).json({ erro: "Nenhuma alteração enviada." });

    values.push(targetUser);
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE username = $${idx}`,
      values
    );

    res.json({ ok: true, msg: "Perfil atualizado com sucesso!" });
  } catch (err) {
    console.error("[AUTH UPDATE PROFILE] Erro:", err.message);
    res.status(500).json({ erro: "Erro ao atualizar perfil." });
  }
});


app.get("/auth/me", autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT username, rolename, COALESCE(fullname,'') AS fullname,
              COALESCE(matricula,'') AS matricula,
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
// 6️⃣ ROTAS DO ELIPSE
// -------------------------
app.get("/", (req, res) => res.send("API Elipse rodando no Render!"));

app.get(["/dados", "/data"], autenticar, (req, res) => res.json(dados));

app.get(["/dados/*", "/data/*"], autenticar, (req, res) => {
  const path = req.params[0] || "";
  const ref = getByPath(dados, path);
  if (typeof ref === "undefined")
    return res.status(404).json({ erro: "Caminho não encontrado" });
  res.json(ref);
});

app.post(["/dados/*", "/data/*"], autenticar, (req, res) => {
  try {
    const payload = normalizeBody(req);
    if (typeof payload === "undefined")
      return res.status(400).json({ erro: "Body inválido" });
    const path = req.params[0] || "";
    setByPath(dados, path, payload);
    res.json({ status: "OK", caminho: `/dados/${path}`, salvo: payload });
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

// -------------------------
// 7️⃣ TESTES
// -------------------------
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error("[TEST-DB] Erro:", err.message);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.get("/test-users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT username, rolename, refreshtime, usertheme FROM users"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[TEST-USERS] Erro:", err.message);
    res.status(500).json({ erro: err.message });
  }
});

// -------------------------
// 8️⃣ CONFIGURAÇÕES DO SISTEMA
// -------------------------
app.get("/config/system", autenticar, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM buildings LIMIT 1");
    if (result.rows.length === 0) {
      return res.json({
        ok: true,
        config: {
          buildingname: "",
          buildingaddress: "",
          adminenterprise: "",
          adminname: "",
          admincontact: "",
        },
      });
    }
    res.json({ ok: true, config: result.rows[0] });
  } catch (err) {
    console.error("[ERRO] /config/system GET:", err);
    res.status(500).json({ ok: false, erro: "Erro ao buscar configurações." });
  }
});

app.post("/config/system", autenticar, async (req, res) => {
  const {
    buildingname,
    buildingaddress,
    adminenterprise,
    adminname,
    admincontact,
  } = req.body || {};

  try {
    if (!["admin", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        erro: "Apenas administradores e supervisores podem editar as configurações.",
      });
    }

    const check = await pool.query("SELECT buildingid FROM buildings LIMIT 1");
    if (check.rows.length === 0) {
      await pool.query(
        `INSERT INTO buildings (buildingname, buildingaddress, adminenterprise, adminname, admincontact)
         VALUES ($1,$2,$3,$4,$5)`,
        [buildingname, buildingaddress, adminenterprise, adminname, admincontact]
      );
    } else {
      const id = check.rows[0].buildingid;
      await pool.query(
        `UPDATE buildings
         SET buildingname=$1, buildingaddress=$2, adminenterprise=$3, adminname=$4, admincontact=$5
         WHERE buildingid=$6`,
        [buildingname, buildingaddress, adminenterprise, adminname, admincontact, id]
      );
    }

    res.json({ ok: true, msg: "Configurações atualizadas com sucesso!" });
  } catch (err) {
    console.error("[ERRO] /config/system POST:", err);
    res.status(500).json({ ok: false, erro: "Erro ao salvar configurações." });
  }
});

// -------------------------
// 9️⃣ FRONT-END BUILD
// -------------------------
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res, next) => {
  if (
    req.originalUrl.startsWith("/auth") ||
    req.originalUrl.startsWith("/dados") ||
    req.originalUrl.startsWith("/data") ||
    req.originalUrl.startsWith("/test")
  ) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// -------------------------
// 🔟 PORTA
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[BOOT] Servidor rodando na porta ${PORT}`));
