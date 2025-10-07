// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
const FIXED_ENV_TOKEN = process.env.VITE_REACT_TOKEN || null;

// Middleware principal
export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ erro: "Token não enviado" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ erro: "Token ausente" });

  try {
    // Caso 1: Token fixo do Render (apenas para POST)
    if (token === FIXED_ENV_TOKEN) {
      if (req.method !== "POST") {
        return res
          .status(403)
          .json({ erro: "Token fixo só pode ser usado para POST do Elipse" });
      }
      console.log("[AUTH] Token fixo do Render detectado (acesso de sistema)");
      req.user = { id: "elipse-post", user: "elipse", role: "system" };
      return next();
    }

    // Caso 2: Token JWT de usuário autenticado
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();

  } catch (err) {
    console.warn("[AUTH] Token inválido:", err.message);
    return res.status(403).json({ erro: "Token inválido ou malformado" });
  }
}

// Middleware de acesso restrito
export function somenteAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  }
  next();
}
