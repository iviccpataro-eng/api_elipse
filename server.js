// server/server.js
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// ---- Import das rotas ----
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import configRoutes from "./routes/config.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- CORS ----
const allowedOrigins = [
  "https://api-elipse.vercel.app",
  "http://localhost:5173", // ambiente local (Vite)
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("CORS bloqueado: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

app.use(express.json({ limit: "1mb" }));

// ---- Token fixo (para integração Elipse) ----
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
export const FIXED_TOKEN = jwt.sign(
  { id: "react-dashboard", user: "react", role: "reader" },
  SECRET
);
console.log("[BOOT] Token fixo interno gerado.");

// ---- Rotas principais ----
app.use("/auth", authRoutes);
app.use("/config", configRoutes);
app.use("/", dataRoutes);

// ---- Rota raiz ----
app.get("/", (req, res) => {
  const envToken = process.env.VITE_REACT_TOKEN
    ? "(Token fixo ativo)"
    : "(Token fixo não configurado)";
  res.json({
    status: "✅ API Elipse Online",
    envToken,
    localFixedToken: process.env.NODE_ENV === "production" ? undefined : FIXED_TOKEN,
  });
});

// ---- Servir build do React (produção) ----
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res, next) => {
  const blockedPaths = ["/auth", "/dados", "/data", "/config"];
  if (blockedPaths.some((prefix) => req.originalUrl.startsWith(prefix))) return next();
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ---- Inicialização ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`[BOOT] 🌐 Servidor rodando na porta ${PORT}`)
);
