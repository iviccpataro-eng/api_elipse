// middleware/rateLimit.js
// Rate limit simples (sem dependências externas)
const requests = new Map();

// Limite padrão: 30 requisições por minuto por IP
const WINDOW_MS = 60 * 1000;
const MAX_REQ = 30;

export function limitElipse(req, res, next) {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const now = Date.now();

  if (!requests.has(ip)) {
    requests.set(ip, []);
  }

  const timestamps = requests.get(ip);

  // Remove registros antigos (mais de 1 min)
  while (timestamps.length > 0 && now - timestamps[0] > WINDOW_MS) {
    timestamps.shift();
  }

  if (timestamps.length >= MAX_REQ) {
    console.warn(`[RATE] IP bloqueado temporariamente: ${ip}`);
    return res
      .status(429)
      .json({ erro: "Limite de requisições excedido. Aguarde alguns segundos." });
  }

  timestamps.push(now);
  requests.set(ip, timestamps);
  next();
}
