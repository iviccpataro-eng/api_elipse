import rateLimit from "express-rate-limit";

export const limitElipse = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // no máximo 30 requisições por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Limite de requisições excedido. Aguarde um momento." },
});
