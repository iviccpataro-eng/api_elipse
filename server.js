// server.js

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pkg from "pg";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { generateFrontendData, getDisciplineData } from "./modules/structureBuilder.js";

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

global.dados = {};
const dados = global.dados;

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

// --- Função normalizeBody aprimorada ---
// Suporte a Base64 (Elipse), JSON direto e proteção de tamanho
function normalizeBody(req) {
  const payload = req.body;

  // Limite de tamanho extra (1MB)
  const MAX_BYTES = 1 * 1024 * 1024;
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > MAX_BYTES) {
    throw new Error('Payload muito grande');
  }

  // Caso: body com campo "valor" (padrão Elipse codificado em Base64)
  if (payload && typeof payload.valor === 'string') {
    try {
      const decoded = Buffer.from(payload.valor, 'base64').toString('utf8').replace(/^\uFEFF/, '');
      const parsed = JSON.parse(decoded);
      return parsed;
    } catch (err) {
      console.error('Erro ao decodificar Base64 do Elipse:', err);
      throw new Error('Body Base64 inválido ou não é JSON válido.');
    }
  }

  // Caso: body já é objeto JSON
  if (payload && typeof payload === 'object') {
    return payload;
  }

  // Caso: body seja string JSON (sem Base64)
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (err) {
      throw new Error('Body é string, mas não é JSON válido.');
    }
  }

  // Caso não reconhecido
  console.warn('Body vazio ou formato desconhecido recebido.');
  return undefined;
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

// 🔧 Atualizado para suportar refreshTime e userTheme
// Atualizado: suporte a edição avançada de perfil e permissões
app.post("/auth/update-profile", autenticar, async (req, res) => {
  const {
    fullname,
    registernumb,
    username,
    senhaAtual,
    novaSenha,
    refreshtime,
    usertheme,
    role,
    newUsername,
  } = req.body || {};

  if (!username)
    return res.status(400).json({ erro: "Usuário é obrigatório" });

  try {
    const result = await pool.query(
      "SELECT username, passhash, rolename FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ erro: "Usuário não encontrado" });

    const usuario = result.rows[0];
    const updates = [];
    const values = [];
    let idx = 1;

    // 1️⃣ Atualização do próprio usuário
    if (req.user.user === username) {
      if (fullname) {
        updates.push(`fullname = $${idx++}`);
        values.push(fullname);
      }
      if (registernumb) {
        updates.push(`registernumb = $${idx++}`);
        values.push(registernumb);
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
    }

    // 2️⃣ Supervisor: pode alterar apenas o role
    if (req.user.role === "supervisor") {
      if (role && usuario.rolename !== role) {
        updates.push(`rolename = $${idx++}`);
        values.push(role);
      }
    }

    // 3️⃣ Admin: pode alterar tudo
    if (req.user.role === "admin") {
      if (fullname) {
        updates.push(`fullname = $${idx++}`);
        values.push(fullname);
      }
      if (registernumb) {
        updates.push(`registernumb = $${idx++}`);
        values.push(registernumb);
      }
      if (role && usuario.rolename !== role) {
        updates.push(`rolename = $${idx++}`);
        values.push(role);
      }
      if (newUsername && newUsername !== usuario.username) {
        updates.push(`username = $${idx++}`);
        values.push(newUsername);
      }
    }

    if (updates.length === 0)
      return res.status(400).json({ erro: "Nenhuma alteração enviada." });

    values.push(username);
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

// 🔍 Buscar dados de um usuário específico (para admin e supervisor)
app.get("/auth/user/:username", autenticar, async (req, res) => {
  try {
    const { username } = req.params;

    if (!["admin", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ ok: false, erro: "Acesso negado." });
    }

    const result = await pool.query(
      `SELECT username, rolename, COALESCE(fullname,'') AS fullname,
              COALESCE(registernumb,'') AS registernumb,
              COALESCE(refreshtime,10) AS refreshtime,
              COALESCE(usertheme,'light') AS usertheme
       FROM users WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ ok: false, erro: "Usuário não encontrado." });

    res.json({ ok: true, usuario: result.rows[0] });
  } catch (err) {
    console.error("[AUTH USER/:USERNAME] Erro:", err.message);
    res.status(500).json({ ok: false, erro: "Erro ao buscar usuário." });
  }
});

// 🔍 Listar todos os usuários (somente admin e supervisor)
app.get("/auth/list-users", autenticar, async (req, res) => {
  try {
    const callerRole = req.user.role;

    if (!["admin", "supervisor"].includes(callerRole)) {
      return res.status(403).json({ ok: false, erro: "Acesso negado." });
    }

    const result = await pool.query(`
      SELECT username, rolename, COALESCE(fullname, '') AS fullname,
             COALESCE(registernumb, '') AS reginternumb
      FROM users
      ORDER BY username ASC
    `);

    res.json({ ok: true, usuarios: result.rows });
  } catch (err) {
    console.error("[AUTH LIST-USERS] Erro:", err.message);
    res.status(500).json({ ok: false, erro: "Erro ao listar usuários." });
  }
});

// 🔧 Admin / Supervisor: atualizar outro usuário
app.post("/auth/admin-update-user", autenticar, async (req, res) => {
  try {
    const { targetUser, fullname, registernumb, username, role } = req.body || {};
    const callerRole = req.user.role;

    if (!["admin", "supervisor"].includes(callerRole)) {
      return res.status(403).json({ ok: false, erro: "Acesso negado." });
    }

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

    if (callerRole === "admin" && username) {
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
// 6️⃣ ROTAS DO ELIPSE
// -------------------------

// Dicionário global de rotas e disciplinas
const friendlyDisciplineRoutes = {
  eletrica: "EL",
  iluminacao: "IL",
  arcondicionado: "AC",
  hidraulica: "HI",
  deteccaoincendio: "DT",
  comunicacao: "CM",
  seguranca: "SC",
  ferramentas: "FR",
};

app.get("/", (req, res) => res.send("API Elipse rodando no Render!"));

// Retorna objeto `dados` em memória (dados brutos)
app.get(["/dados", "/data"], autenticar, (req, res) => res.json(dados));

// Retorna um caminho específico dentro de `dados`
app.get(["/dados/*", "/data/*"], autenticar, (req, res) => {
  const path = req.params[0] || "";
  const ref = getByPath(dados, path);
  if (typeof ref === "undefined")
    return res.status(404).json({ erro: "Caminho não encontrado" });
  res.json(ref);
});

// Recebe envio do Elipse / outras fontes
app.post(["/dados/*", "/data/*"], autenticar, (req, res) => {
  try {
    const payload = normalizeBody(req);
    if (typeof payload === "undefined")
      return res.status(400).json({ erro: "Body inválido" });

    const path = req.params[0] || "";
    setByPath(dados, path, payload);

    // =======================================
    // 🧠 NOVA LÓGICA DE TAGSLIST + ESTRUTURA
    // =======================================
    try {
      // Atualiza lista de tags automaticamente ao receber novos dados
      const disciplina = path.split("/")[0]?.toUpperCase();
      if (["EL", "IL", "AC", "HI", "DT", "CM"].includes(disciplina)) {
        console.log(`⚡ [${disciplina}] Atualizando estrutura com base em ${path}...`);

        // Gera a lista de tags automaticamente
        const tagsList = gerarTagsListAutomaticamente(dados);
        dados.tagsList = tagsList;

        // Atualiza estrutura e detalhes com base nas tags
        const generated = generateFrontendData(tagsList);
        dados.structure = generated.structure;
        dados.structureDetails = generated.details;

        console.log(`✅ Estrutura da disciplina ${disciplina} atualizada (${tagsList.length} tags).`);
      }
    } catch (gErr) {
      console.error("[TAGS] Erro ao armazenar lista:", gErr);
    }

    res.json({ status: "OK", caminho: `/dados/${path}`, salvo: payload });
  } catch (e) {
    console.error("[POST /dados/*] Erro:", e);
    res.status(400).json({ erro: e.message });
  }
});

// 🧩 Função auxiliar para gerar lista de tags automaticamente
function gerarTagsListAutomaticamente(base) {
  const lista = [];

  const percorrer = (obj, caminho = "") => {
    for (const chave in obj) {
      if (!Object.hasOwn(obj, chave)) continue;
      const valor = obj[chave];
      const novoCaminho = caminho ? `${caminho}/${chave}` : chave;

      // Se for um objeto intermediário (sem info nem data), continua descendo
      if (
        valor &&
        typeof valor === "object" &&
        !Array.isArray(valor) &&
        !valor.info &&
        !valor.data
      ) {
        percorrer(valor, novoCaminho);
      }

      // Se tiver .info (como é padrão dos equipamentos), adiciona à lista
      else if (valor?.info) {
        lista.push(novoCaminho);
      }
    }
  };

  percorrer(base);
  return lista;
}

// 🧩 Nova rota para fornecer dados estruturados de disciplina
app.get(
  [
    "/discipline/:code",
    "/dashboard/:code",
    "/:friendlyCode", // adiciona suporte a /eletrica, /hidraulica, etc.
  ],
  autenticar,
  async (req, res) => {
    try {
      const { code, friendlyCode } = req.params;

      // Determina o código real
      const disciplineCode =
        (code || friendlyDisciplineRoutes[friendlyCode?.toLowerCase()])?.toUpperCase();

      if (!disciplineCode)
        return res.status(400).json({ ok: false, erro: "Disciplina inválida." });

      // Gera estrutura se não existir
      let structure = dados.structure;
      let details = dados.structureDetails;

      if (!structure || !details) {
        let tagsList =
        dados.tagsList || getByPath(dados, "tags") || getByPath(dados, "Tags");
        if (!Array.isArray(tagsList) || tagsList.length === 0) {
          console.log("⚙️ Nenhuma tagsList detectada — gerando automaticamente...");
          tagsList = gerarTagsListAutomaticamente(dados);
          dados.tagsList = tagsList;
          console.log(`✅ ${tagsList.length} tags identificadas automaticamente.`);
        }
        if (Array.isArray(tagsList)) {
          console.log("[DISCIPLINE] Regenerando estrutura...");
          const generated = generateFrontendData(tagsList);
          dados.structure = generated.structure;
          dados.structureDetails = generated.details;
          structure = generated.structure;
          details = generated.details;
        } else {
          return res.status(400).json({
            ok: false,
            erro: "Nenhuma lista de tags encontrada para gerar estrutura.",
          });
        }
      }

      const result = getDisciplineData(dados, disciplineCode);
      if (!result || Object.keys(result).length === 0) {
        return res.status(404).json({
          ok: false,
          erro: `Nenhum dado encontrado para a disciplina ${disciplineCode}.`,
        });
      }

      res.json({ ok: true, disciplina: disciplineCode, dados: result });
    } catch (err) {
      console.error("[DISCIPLINE DATA] Erro:", err);
      res.status(500).json({ ok: false, erro: "Erro ao montar estrutura da disciplina." });
    }
  }
);

// ✅ Endpoint universal de leitura de equipamento
app.get("/equipamento/:tag", autenticar, async (req, res) => {
  try {
    const { tag } = req.params;
    if (!tag) {
      return res.status(400).json({
        ok: false,
        erro: "Tag do equipamento não especificada.",
      });
    }

    const tagDecoded = decodeURIComponent(tag);
    console.log("[EQUIPAMENTO] Buscando:", tagDecoded);

    // 1️⃣ Verifica se o equipamento existe no cache/estrutura
    const equipamento =
      dados.structureDetails?.[tagDecoded] ||
      dados.structureDetails?.[`EL/${tagDecoded}`] ||
      null;

    if (!equipamento || Object.keys(equipamento).length === 0) {
      return res.status(404).json({
        ok: false,
        erro: `Equipamento '${tagDecoded}' não encontrado.`,
      });
    }

    // 2️⃣ Informações gerais do equipamento
    const info = {
      tag: tagDecoded,
      name: equipamento.name || tagDecoded.split("/").pop(),
      descricao: equipamento.descricao || "",
      pavimento: equipamento.pavimento,
      fabricante: equipamento.fabricante,
      modelo: equipamento.modelo,
      statusComunicacao: equipamento.statusComunicacao || "OK",
      ultimaAtualizacao: equipamento.ultimaAtualizacao || new Date().toISOString(),
    };

    // 3️⃣ Normalização das grandezas
    const grandezas = equipamento.grandezas || {};
    const unidades = equipamento.unidades || {};

    const data = [];

    for (const [nome, valor] of Object.entries(grandezas)) {
      const unidade = unidades?.[nome] || "";
      let tipo = "AI"; // padrão (analógica de entrada)
      let mostrarGrafico = false;
      let referencia = null;

      // Detecta o tipo pelo prefixo ou metadado
      // Exemplo: nome pode vir com [AI], [DI], etc.
      const matchTipo = nome.match(/^(AI|AO|DI|DO|MI|MO)\s*[:\-]/i);
      if (matchTipo) {
        tipo = matchTipo[1].toUpperCase();
      }

      // Simulação de dados padrão (poderá ser sobrescrito pelo Elipse)
      switch (tipo) {
        case "AI":
        case "AO":
          mostrarGrafico = true;
          referencia = equipamento?.nominais?.[nome] || 220;
          data.push([tipo, nome.replace(/^(AI|AO)\s*[:\-]/i, "").trim(), valor, unidade, mostrarGrafico, referencia]);
          break;

        case "DI":
        case "DO":
          // Estrutura: [tipo, nome, valor, "LIGADO/DESLIGADO", showIcon, ref]
          referencia = true;
          data.push([tipo, nome.replace(/^(DI|DO)\s*[:\-]/i, "").trim(), !!valor, "LIGADO/DESLIGADO", true, referencia]);
          break;

        case "MI":
        case "MO":
          // Estrutura: [tipo, nome, valor, "ESTADO1/ESTADO2/...", showIcon, ref]
          const estados =
            equipamento?.estados?.[nome] ||
            "DESLIGADO/OPERANDO/LIGADO COM ALARME/DESLIGADO POR ALARME/FALHA CRÍTICA";
          referencia = 1;
          data.push([tipo, nome.replace(/^(MI|MO)\s*[:\-]/i, "").trim(), valor ?? 0, estados, true, referencia]);
          break;

        default:
          data.push(["AI", nome, valor, unidade, false, 0]);
          break;
      }
    }

    return res.json({
      ok: true,
      dados: {
        info,
        data,
      },
    });
  } catch (err) {
    console.error("[EQUIPAMENTO] Erro:", err);
    res.status(500).json({
      ok: false,
      erro: "Erro ao obter informações do equipamento.",
    });
  }
});


let lastAutoUpdate = null;
let autoUpdateInterval = null;

// 🔹 Função que atualiza dados.structure e dados.structureDetails
async function regenerateStructure() {
  try {
    const tagsList =
      dados.tagsList ||
      getByPath(dados, "tags") ||
      getByPath(dados, "Tags");

    if (!Array.isArray(tagsList) || tagsList.length === 0) {
      console.log("⚠️ Nenhuma tagsList disponível — ignorando atualização automática.");
      return;
    }

    console.log("♻️ Atualizando estrutura global das disciplinas...");

    const generated = generateFrontendData(tagsList);
    dados.structure = generated.structure;
    dados.structureDetails = generated.details;
    lastAutoUpdate = new Date();

    console.log(
      `✅ Estrutura atualizada em ${lastAutoUpdate.toLocaleTimeString()} (${tagsList.length} tags)`
    );
  } catch (err) {
    console.error("❌ Erro ao regenerar estrutura automática:", err);
  }
}

// 🔹 Recupera o refreshTime do banco
async function getUserRefreshTime() {
  try {
    const [rows] = await pool.query(
      "SELECT refreshTime FROM users WHERE active = 1 LIMIT 1"
    );
    const refresh = rows?.[0]?.refreshTime || 10;
    return Math.max(5, parseInt(refresh)); // mínimo 5 segundos
  } catch (err) {
    console.error("⚠️ Falha ao obter refreshTime, usando padrão (10s)", err);
    return 30;
  }
}

// 🔹 Inicia o auto-refresh periódico
async function startAutoUpdater() {
  const refreshTime = await getUserRefreshTime();
  console.log(`⏱️ Atualização automática a cada ${refreshTime}s`);
  if (autoUpdateInterval) clearInterval(autoUpdateInterval);

  autoUpdateInterval = setInterval(regenerateStructure, refreshTime * 1000);
}

// 🔹 Atualiza quando um novo POST é recebido do Elipse
app.post(["/dados/*", "/data/*"], autenticar, async (req, res) => {
  try {
    const payload = normalizeBody(req);
    if (typeof payload === "undefined")
      return res.status(400).json({ erro: "Body inválido" });

    const path = req.params[0] || "";
    setByPath(dados, path, payload);

    // ====== Armazenamento das TAGs ======
    try {
      const isArray = Array.isArray(payload) && payload.every((p) => typeof p === "string");
      const endsWithTags = path.toLowerCase().endsWith("tags");

      if (isArray || endsWithTags) {
        const tagsArray = isArray ? payload : getByPath(dados, path);
        if (Array.isArray(tagsArray)) {
          setByPath(dados, "tagsList", tagsArray);
          console.log("[TAGS] Lista de tags atualizada (", tagsArray.length, "itens)");
          await regenerateStructure();
        }
      } else {
        // 🔹 Se o Elipse mandou dados de um equipamento, atualiza os detalhes
        if (path.startsWith("EL/") || path.startsWith("IL/") || path.startsWith("AC/")) {
          const tagPath = path.split("/").slice(0, 4).join("/");
          if (!dados.structureDetails) dados.structureDetails = {};
          dados.structureDetails[tagPath] = {
            ...dados.structureDetails[tagPath],
            info: payload.info?.[0] || payload.info || {},
            data: payload.data || {},
          };
          console.log("🔧 Atualizado detalhe:", tagPath);
        }
      }
    } catch (gErr) {
      console.error("[TAGS] Erro ao armazenar lista:", gErr);
    }

    res.json({ status: "OK", caminho: `/dados/${path}`, salvo: payload });
  } catch (e) {
    console.error("[POST /dados] Erro:", e);
    res.status(400).json({ erro: e.message });
  }
});

// 🔹 Inicia o ciclo de atualização automática
await startAutoUpdater();

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
    req.originalUrl.startsWith("/test") ||
    req.originalUrl.startsWith("/structure")
  ) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// -------------------------
// 🔟 PORTA
// -------------------------
const PORT = process.env.PORT || 3000;
console.log(`[BOOT] API Elipse iniciando ambiente: ${process.env.NODE_ENV || "local"}`);
app.listen(PORT, () =>
  console.log(`[BOOT] Servidor rodando na porta ${PORT}`)
);
