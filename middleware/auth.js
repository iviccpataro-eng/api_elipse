// /middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Secret padrão usado nos tokens JWT de usuários normais
const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";

// Token fixo definido nas variáveis de ambiente do Render
const FIXED_ENV_TOKEN = process.env.VITE_REACT_TOKEN || null;

// Token fixo opcional (gerado internamente no server.js e exportado de lá)
import { FIXED_TOKEN } from "../server.js";

/**
 * Middleware de autenticação principal
 * - Aceita tokens JWT válidos de usuários cadastrados
 * - Aceita token fixo da variável de ambiente (usado pelo Elipse ou dashboard público)
 * - Aceita o token fixo local (gerado no boot)
 */
export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // --- Caso 1: Token fixo do ambiente (Render / Elipse)
    if (token === FIXED_ENV_TOKEN) {
      req.user = { id: "react-fixed", user: "react", role: "reader" };
      return next();
    }

    // --- Caso 2: Token fixo local (gerado no boot)
    if (token === FIXED_TOKEN) {
      req.user = { id: "react-dashboard", user: "react", role: "reader" };
      return next();
    }

    // --- Caso 3: Token JWT válido (usuário autenticado)
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.warn("[AUTH] Token inválido:", err.message);
    return res.status(403).json({ erro: "Token inválido" });
  }
}

/**
 * Middleware que restringe acesso apenas a administradores
 */
export function somenteAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ erro: "Apenas administradores têm acesso." });
  }
  next();
}
