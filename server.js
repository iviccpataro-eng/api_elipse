// server.js
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import jwt from "jsonwebtoken";

import authRouter from "./modules/authRouter.js";
import dataRouter from "./modules/dataRouter.js";
import configRouter from "./modules/configRouter.js";
import { initUpdater } from "./modules/updater.js";
import alarmRouter from "./modules/alarmRouter.js";
import {
  registerAlarm,
  clearAlarm,
  getActiveAlarms,
  getAlarmHistory,
  ackAlarm
} from "./modules/alarmManager.js";
import { normalizeBody } from "./modules/utils.js";
import { generateFrontendData } from "./modules/structureBuilder.js";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -------------------------
// ⚙️ Configuração principal
// -------------------------
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// -------------------------
// 🌐 CORS
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

// Trata requisições OPTIONS manuais
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin))
    res.header("Access-Control-Allow-Origin", origin);
  else res.header("Access-Control-Allow-Origin", "*");

  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res.sendStatus(200);
});

// Middleware global extra: garante cabeçalhos CORS até mesmo em respostas de erro
app.use((req, res, next) => {
  if (!res.getHeader("Access-Control-Allow-Origin")) {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  next();
});

// -------------------------
// 🧠 Memória global
// -------------------------
global.dados = {};
const dados = global.dados;

// -------------------------
// 🔐 Token fixo do Elipse
// -------------------------
const ELIPSE_FIXED_TOKEN =
  process.env.ELIPSE_FIXED_TOKEN ||
  jwt.sign({ id: "elipse-system", user: "elipse", role: "system" }, SECRET);

console.log("[BOOT] Token fixo do Elipse definido.");

// -------------------------
// 🧩 Middlewares e Rotas
// -------------------------

// ✅ 1. Rota pública de status (antes de qualquer autenticação)
app.get("/", (req, res) => res.send("API Elipse rodando!"));

// ✅ 2. Rotas principais
app.use("/auth", authRouter(pool, SECRET));
app.use("/config", configRouter(pool));
app.use("/", dataRouter)

// ✅ 3. Rota de arquivos estáticos (imagens de avatar) 
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------
// 🚨 Rotas de Alarme
// -------------------------
app.use("/alarms", alarmRouter);

// -------------------------
// 🧭 Sistema e Front-end
// -------------------------
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res) => {
  if (
    req.originalUrl.startsWith("/auth") ||
    req.originalUrl.startsWith("/dados") ||
    req.originalUrl.startsWith("/data") ||
    req.originalUrl.startsWith("/alarms")
  )
    return;
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// -------------------------
// 🔁 Inicia auto-updater
// -------------------------
await initUpdater(dados, pool);

// ✅ 3. Geração automática de estrutura inicial (caso dados esteja vazio)
if (!dados.tagsList || dados.tagsList.length === 0) {
  console.log("⚙️ Gerando estrutura inicial...");
  try {
    dados.tagsList = [];
    dados.structure = {};
    dados.structureDetails = {};

    const generated = generateFrontendData(dados.tagsList);
    dados.structure = generated.structure;
    dados.structureDetails = generated.details;
    console.log("✅ Estrutura inicial pronta (vazia, aguardando dados do Elipse).");
  } catch (err) {
    console.error("❌ Erro ao gerar estrutura inicial:", err);
  }
}

// -------------------------
// 🚀 Inicialização
// -------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[BOOT] Servidor rodando na porta ${PORT}`);
  console.log(`🌐 API disponível em http://localhost:${PORT} ou Render URL`);
});