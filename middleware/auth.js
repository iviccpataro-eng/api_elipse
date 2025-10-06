// middleware/auth.js
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c";

export const FIXED_TOKEN = jwt.sign(
  { id: "react-dashboard", user: "react", role: "reader" },
  SECRET
);

export function autenticar(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ erro: "Token não enviado" });

  const token = authHeader.split(" ")[1];
  if (token === FIXED_TOKEN) {
    req.user = { id: "react-dashboard", user: "react", role: "reader" };
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(403).json({ erro: "Token inválido" });
  }
}

export function somenteAdmin(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ erro: "Apenas administradores têm acesso." });
  next();
}

export { SECRET };
