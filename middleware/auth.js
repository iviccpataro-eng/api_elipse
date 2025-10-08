// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
const FIXED_ENV_TOKEN = process.env.VITE_REACT_TOKEN || null;

/**
 * Middleware de autenticação:
 * - Aceita o token fixo (Elipse → POST)
 * - Ou valida JWTs normais (usuários logados)
 */
export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.warn("[AUTH] Nenhum Authorization header recebido");
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const token = authHeader.split(" ")[1];
  if (!token || token === "undefined") {
    console.warn("[AUTH] Token ausente ou indefinido");
    return res.status(401).json({ erro: "Token ausente ou inválido" });
  }

  try {
    // Token fixo (para integração com o Elipse)
    if (token === FIXED_ENV_TOKEN) {
      console.log("[AUTH] Token fixo do Render detectado (para integração Elipse)");
      req.user = { id: "elipse-post", user: "elipse", role: "system" };
      return next();
    }

    // Token JWT válido de usuário logado
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.warn("[AUTH] Token inválido:", err.message);
    return res.status(403).json({ erro: "Token inválido ou malformado" });
  }
}

/**
 * Middleware de permissão:
 * - Restringe acesso a rotas exclusivas de administradores
 */
export function somenteAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  }
  next();
}
