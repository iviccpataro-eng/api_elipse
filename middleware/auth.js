// server/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// --- Configurações e tokens ---
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
const FIXED_ENV_TOKEN = process.env.VITE_REACT_TOKEN || null;

// Gera um token fixo interno opcional (para debug/local)
export const FIXED_TOKEN = jwt.sign(
  { id: "react-dashboard", user: "react", role: "reader" },
  SECRET,
  { expiresIn: "12h" }
);

/**
 * Middleware de autenticação
 */
export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // --- 1️⃣ Token fixo do ambiente (Render / Elipse E3)
    if (FIXED_ENV_TOKEN && token === FIXED_ENV_TOKEN) {
      req.user = { id: "react-fixed", user: "elipse", role: "reader" };
      return next();
    }

    // --- 2️⃣ Token fixo local (usado apenas em desenvolvimento)
    if (token === FIXED_TOKEN) {
      req.user = { id: "react-dashboard", user: "react", role: "reader" };
      return next();
    }

    // --- 3️⃣ Token JWT de usuário logado
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.warn("[AUTH] Token inválido:", err.message);
    return res.status(403).json({ erro: "Token inválido" });
  }
}

/**
 * Middleware para permitir apenas admins
 */
export function somenteAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  }
  next();
}
