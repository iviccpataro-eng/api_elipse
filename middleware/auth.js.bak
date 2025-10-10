// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
// TOKEN FIXO do Elipse — **NÃO** usar VITE_ aqui (server-only)
const FIXED_ENV_TOKEN = process.env.ELIPSE_FIXED_TOKEN || null;

/**
 * Middleware de autenticação:
 * - Aceita token fixo (apenas para POST em /dados/* ou /data/*)
 * - Ou valida JWT de usuários normais
 */
export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.warn("[AUTH] Nenhum Authorization header recebido");
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const parts = authHeader.split(" ");
  const token = parts.length >= 2 ? parts[1] : parts[0];
  if (!token || token === "undefined") {
    console.warn("[AUTH] Token ausente ou indefinido");
    return res.status(401).json({ erro: "Token ausente ou inválido" });
  }

  try {
    // --- Caso: token fixo do Elipse ---
    if (FIXED_ENV_TOKEN && token === FIXED_ENV_TOKEN) {
      const method = (req.method || "").toUpperCase();
      const url = (req.originalUrl || req.url || "").toLowerCase();

      // Permitir SOMENTE: POST em /dados/* ou /data/*
      const allowed =
        method === "POST" &&
        (url === "/dados" ||
          url === "/data" ||
          url.startsWith("/dados/") ||
          url.startsWith("/data/"));

      if (!allowed) {
        console.warn(
          `[AUTH] Token fixo usado em rota/método não permitido: ${method} ${url}`
        );
        return res
          .status(403)
          .json({ erro: "Fixed token somente permitido para POST em /dados ou /data" });
      }

      // Autenticação bem-sucedida para integração Elipse
      req.user = {
        id: "elipse-post",
        user: "elipse",
        role: "system",
        authSource: "fixed-token",
      };
      return next();
    }

    // --- Caso: JWT normal ---
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.warn("[AUTH] Token inválido:", err && err.message ? err.message : err);
    return res.status(403).json({ erro: "Token inválido ou malformado" });
  }
}

/**
 * Middleware de permissão: restringe a administradores
 */
export function somenteAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  }
  next();
}
