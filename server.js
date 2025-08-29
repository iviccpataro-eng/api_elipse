// server.js (trecho relevante)
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Carrega private/public PEM a partir das env vars
const PRIV_PEM = (process.env.PRIVATE_KEY || "").replace(/\\n/g, "\n").trim();
const PUB_PEM  = (process.env.PUBLIC_KEY  || "").replace(/\\n/g, "\n").trim();

// Helper para decrypt RSA (OAEP/SHA256)
function rsaDecryptBase64(b64) {
  const buf = Buffer.from(b64, "base64");
  return crypto.privateDecrypt(
    {
      key: PRIV_PEM,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buf
  ); // retorna Buffer com a chave AES original
}

// AES-256-CBC decrypt (recebe base64 data, base64 iv, Buffer key(32 bytes))
function aes256cbc_decrypt_b64(dataB64, ivB64, keyBuf) {
  const iv = Buffer.from(ivB64, "base64");
  const cipherBuf = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuf, iv);
  const out = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
  return out.toString("utf8");
}

// Expor a public key para clientes (VB) pegarem
app.get("/public-key", (req, res) => {
  if (!PUB_PEM) return res.status(500).send("public key not configured");
  res.type("text/plain").send(PUB_PEM);
});

// Endpoint que recebe payload cifrado (hybrid)
app.post("/encrypted", (req, res) => {
  // Expect body: { key: "<base64 RSA(AESkey)>", iv: "<base64 iv>", data: "<base64 ciphertext>" , path: ["EL","Principal",...] (opcional) }
  const { key, iv, data, path = [] } = req.body || {};
  if (!key || !iv || !data) return res.status(400).json({ error: "missing fields" });

  try {
    // 1) decrypt AES key with RSA private
    const aesKeyBuf = rsaDecryptBase64(key); // should be 32 bytes for AES-256
    // 2) decrypt data
    const jsonPlain = aes256cbc_decrypt_b64(data, iv, aesKeyBuf);
    const payload = JSON.parse(jsonPlain);

    // 3) store into your tree (adapt to your existing logic)
    // example: store at path if provided or root:
    let storageRef = global.store || (global.store = {});
    if (Array.isArray(path) && path.length > 0) {
      let ref = storageRef;
      for (const p of path) {
        if (!ref[p] || typeof ref[p] !== "object") ref[p] = {};
        ref = ref[p];
      }
      // store payload as leaf
      ref.info = payload.info || ref.info || [];
      ref.data = payload.data || ref.data || [];
    } else {
      // if no path provided, you can decide where to put it
      storageRef.latest = payload;
    }

    // respond success
    return res.json({ status: "ok" });
  } catch (e) {
    console.error("decrypt error:", e);
    return res.status(500).json({ error: "decrypt_failed", detail: e.message });
  }
});
