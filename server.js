// server.js
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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
  "http://localhost:5173",
  "https://api-elipse.onrender.com",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("CORS bloqueado: " + origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// ---- Rotas principais ----
app.use("/auth", authRoutes);
app.use("/", dataRoutes);
app.use("/config", configRoutes);

// ---- Status ----
app.get("/status", (req, res) =>
  res.json({ status: "API Elipse Online", env: process.env.NODE_ENV })
);

// ---- Servir build do React ----
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

// ✅ Importante: qualquer rota não-API deve retornar o index.html (React Router)
app.get("*", (req, res, next) => {
  if (
    req.originalUrl.startsWith("/auth") ||
    req.originalUrl.startsWith("/dados") ||
    req.originalUrl.startsWith("/config") ||
    req.originalUrl.startsWith("/api")
  ) {
    return next();
  }

  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ---- Inicialização ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[BOOT] Servidor rodando na porta ${PORT}`);
  console.log(`[INFO] Ambiente: ${process.env.NODE_ENV}`);
});
