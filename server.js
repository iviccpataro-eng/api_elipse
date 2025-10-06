// server/server.js
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { FIXED_TOKEN } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import dataRoutes from "./routes/data.js";
import configRoutes from "./routes/config.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- CORS ----
const allowedOrigins = [
  "https://api-elipse.vercel.app",
  "http://localhost:5173",
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

// ---- Rotas ----
app.use("/auth", authRoutes);
app.use("/", dataRoutes);
app.use("/config", configRoutes);

// ---- Info ----
app.get("/", (req, res) =>
  res.json({ status: "API Elipse Online", fixedToken: FIXED_TOKEN })
);

// ---- Servir build do React ----
import { fileURLToPath as furl } from "url";
const clientBuildPath = path.resolve(__dirname, "elipse-dashboard", "dist");
app.use(express.static(clientBuildPath));

app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/auth") || req.originalUrl.startsWith("/dados") || req.originalUrl.startsWith("/config"))
    return next();
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ---- Inicialização ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`[BOOT] Servidor rodando na porta ${PORT}`)
);
