// server/server.js
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// ✅ Carrega .env apenas localmente (Render já injeta variáveis)
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

// ---- Imports dos módulos ----
import { FIXED_TOKEN } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import configRoutes from "./routes/config.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- Configuração de CORS ----
const allowedOrigins = [
  "https://api-elipse.vercel.app", // frontend deployado
  "http://localhost:5173",         // ambiente local (Vite)
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
app.use("/config", configRoutes);
app.use("/", dataRoutes);

// ---- Endpoint raiz ----
app.get("/", (req, res) => {
  res.json({
    status: "✅ API Elipse Online",
    version: "2.0",
    fixedToken: FIXED_TOKEN ? "Ativo (Render)" : "Não configurado",
  });
});

// ---- Servir build do React ----
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res, next) => {
  // Ignora chamadas de API
  if (
    req.originalUrl.startsWith("/auth") ||
    req.originalUrl.startsWith("/dados") ||
    req.originalUrl.startsWith("/data") ||
    req.originalUrl.startsWith("/config")
  ) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ---- Inicialização do servidor ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[BOOT] Servidor rodando na porta ${PORT}`);
  console.log(`[INFO] Ambiente: ${process.env.NODE_ENV}`);
  console.log(
    `[INFO] Token fixo ${
      process.env.VITE_REACT_TOKEN ? "carregado do Render" : "não definido"
    }`
  );
});
