// server.js
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import systemRoutes from "./routes/system.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// -------- CORS --------
const allowedOrigins = [
  "https://api-elipse.vercel.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("CORS bloqueado para origem: " + origin));
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

// -------- Rotas --------
app.use("/auth", authRoutes);
app.use("/dados", dataRoutes);
app.use("/data", dataRoutes);
app.use("/config", systemRoutes);

// -------- React Build --------
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res, next) => {
  if (
    req.originalUrl.startsWith("/auth") ||
    req.originalUrl.startsWith("/dados") ||
    req.originalUrl.startsWith("/data") ||
    req.originalUrl.startsWith("/config")
  ) return next();
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// -------- Porta --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[BOOT] Servidor rodando na porta ${PORT}`));
