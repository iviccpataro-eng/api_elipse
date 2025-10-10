import express from "express";
import { autenticar } from "../middleware/auth.js";
import { setByPath, getByPath, normalizeBody } from "../utils/helpers.js";
import crypto from "crypto";

const router = express.Router();

// Dados em memória (sem persistência)
let dados = {};

/* ----------------------------
   Helpers internos
---------------------------- */
function sha256Hex(obj) {
  const txt = typeof obj === "string" ? obj : JSON.stringify(obj || "");
  return crypto.createHash("sha256").update(txt).digest("hex");
}

/* ----------------------------
   Rotas
---------------------------- */

// GET raiz: retorna todo o objeto (requer autenticação)
router.get(["/dados", "/data"], autenticar, (req, res) => {
  return res.json(dados);
});

// GET /dados/* ou /data/* : retorna nó específico
router.get(["/dados/*", "/data/*"], autenticar, (req, res) => {
  const path = req.params[0] || "";
  const ref = getByPath(dados, path);
  if (typeof ref === "undefined")
    return res.status(404).json({ erro: "Caminho não encontrado" });
  return res.json(ref);
});

/**
 * POST /dados/* ou /data/* :
 * - aceita payloads JSON normais e também payloads com { valor: "<base64>" }
 *   (normalizeBody faz a conversão, conforme helpers.js do projeto).
 * - só permite gravação para roles diferentes de 'reader'.
 * - aceita também o token fixo do Elipse (conforme middleware) — porém o middleware
 *   já restringe o uso do fixed token apenas a POST /dados* e /data*.
 */
router.post(["/dados/*", "/data/*"], autenticar, (req, res) => {
  const path = req.params[0] || "";

  try {
    // Decodifica payload quando for Base64 (helper já no projeto)
    const payload = normalizeBody(req);

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ erro: "Payload inválido ou formato não suportado" });
    }

    // Autorização adicional: leitores não podem gravar
    const role = req.user?.role || "anonymous";
    if (role === "reader") {
      return res.status(403).json({ erro: "Role sem permissão para gravar" });
    }

    // Auditoria mínima: log com quem gravou, caminho, timestamp e hash do payload
    const who = req.user?.user || req.user?.id || "unknown";
    const ts = new Date().toISOString();
    const h = sha256Hex(payload);
    console.info(`[DATA][WRITE] user=${who} role=${role} path="/${path}" ts=${ts} hash=${h}`);

    // Grava em memória (igual ao comportamento original)
    setByPath(dados, path, payload);

    return res.json({ status: "OK", salvo: payload, meta: { path: `/${path}`, hash: h, savedAt: ts } });
  } catch (e) {
    console.error("[DATA] Erro ao processar POST /dados:", e && e.message ? e.message : e);
    return res.status(400).json({ erro: e.message || "Erro ao processar payload" });
  }
});

export default router;
