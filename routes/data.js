// server/routes/data.js
import express from "express";
import { autenticar } from "../middleware/auth.js";

const router = express.Router();
let dados = {};

function setByPath(root, pathStr, value) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      ref[p] = value;
    } else {
      if (!ref[p] || typeof ref[p] !== "object") ref[p] = {};
      ref = ref[p];
    }
  }
}

function getByPath(root, pathStr) {
  const parts = pathStr.split("/").filter(Boolean);
  let ref = root;
  for (const p of parts) {
    if (ref && Object.prototype.hasOwnProperty.call(ref, p)) {
      ref = ref[p];
    } else {
      return undefined;
    }
  }
  return ref;
}

/* --- GET e POST --- */
router.get(["/dados", "/data"], autenticar, (req, res) => res.json(dados));

router.get(["/dados/*", "/data/*"], autenticar, (req, res) => {
  const path = req.params[0] || "";
  const ref = getByPath(dados, path);
  if (typeof ref === "undefined")
    return res.status(404).json({ erro: "Caminho não encontrado" });
  res.json(ref);
});

router.post(["/dados/*", "/data/*"], autenticar, (req, res) => {
  const path = req.params[0] || "";
  try {
    setByPath(dados, path, req.body);
    res.json({ status: "OK", salvo: req.body });
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

export default router;
