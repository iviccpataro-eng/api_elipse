// modules/utils.js
export function setByPath(root, pathStr, value) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) ref[p] = value;
    else {
      if (!ref[p] || typeof ref[p] !== "object") ref[p] = {};
      ref = ref[p];
    }
  }
}

export function getByPath(root, pathStr) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (const p of parts) {
    if (ref && Object.prototype.hasOwnProperty.call(ref, p)) ref = ref[p];
    else return undefined;
  }
  return ref;
}

// Decodifica e normaliza body (base64, JSON direto, string etc.)
export function normalizeBody(req) {
  const payload = req.body;
  const MAX_BYTES = 1 * 1024 * 1024;
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > MAX_BYTES) throw new Error("Payload muito grande");

  if (payload && typeof payload.valor === "string") {
    try {
      const decoded = Buffer.from(payload.valor, "base64").toString("utf8").replace(/^\uFEFF/, "");
      return JSON.parse(decoded);
    } catch (err) {
      console.error("Erro ao decodificar Base64:", err);
      throw new Error("Body Base64 inválido ou não é JSON válido.");
    }
  }

  if (payload && typeof payload === "object") return payload;

  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      throw new Error("Body é string, mas não é JSON válido.");
    }
  }

  console.warn("Body vazio ou formato desconhecido.");
  return undefined;
}
