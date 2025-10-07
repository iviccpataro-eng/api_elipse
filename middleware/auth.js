// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
const FIXED_ENV_TOKEN = process.env.VITE_REACT_TOKEN || null;

// Token gerado internamente (apenas referência, opcional)
export const FIXED_TOKEN = jwt.sign(
  { id: "react-dashboard", user: "react", role: "reader" },
  SECRET,
  { expiresIn: "12h" }
);

export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ erro: "Token não enviado" });

  const token = authHeader.split(" ")[1];

  try {
    // --- 1️⃣ Token fixo do ambiente (Render)
    if (FIXED_ENV_TOKEN && token === FIXED_ENV_TOKEN) {
      console.log("[AUTH] Token fixo do Render detectado (acesso liberado)");
      req.user = { id: "react-fixed", user: "react", role: "reader" };
      return next();
    }

    // --- 2️⃣ Token JWT válido (usuário autenticado)
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.warn("[AUTH] Token inválido:", err.message);
    return res.status(403).json({ erro: "Token inválido ou malformado" });
  }
}

export function somenteAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  }
  next();
}
