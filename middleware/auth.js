// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";
const FIXED_ENV_TOKEN = process.env.VITE_REACT_TOKEN || null;

export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.warn("[AUTH] Nenhum header Authorization recebido");
    return res.status(401).json({ erro: "Token não enviado" });
  }

  const token = authHeader.split(" ")[1];
  console.log(`[AUTH] Header recebido: ${authHeader}`);

  if (!token) {
    console.warn("[AUTH] Token ausente após split");
    return res.status(401).json({ erro: "Token ausente" });
  }

  try {
    // Token fixo do Render (para o Elipse POST)
    if (token === FIXED_ENV_TOKEN) {
      console.log("[AUTH] Token fixo do Render detectado");
      req.user = { id: "elipse-post", user: "elipse", role: "system" };
      return next();
    }

    // JWT válido de usuário
    const payload = jwt.verify(token, SECRET);
    console.log("[AUTH] JWT decodificado:", payload);
    req.user = payload;
    return next();
  } catch (err) {
    console.warn("[AUTH] Token inválido:", err.message);
    return res.status(403).json({ erro: "Token inválido ou malformado" });
  }
}

export function somenteAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ erro: "Acesso restrito a administradores." });
  next();
}
