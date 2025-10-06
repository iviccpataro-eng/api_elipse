// /routes/config.js
import express from "express";
import { pool } from "../config/db.js";
import { autenticar, somenteAdmin } from "../middleware/auth.js";

const router = express.Router();

/* --- GET --- */
router.get("/system", autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM system_config ORDER BY updated_at DESC LIMIT 1"
    );
    res.json({ ok: true, config: result.rows[0] || {} });
  } catch (err) {
    console.error("Erro ao buscar config:", err);
    res.status(500).json({ erro: "Erro ao buscar configuração." });
  }
});

/* --- POST --- */
router.post("/system", autenticar, somenteAdmin, async (req, res) => {
  const {
    building_name,
    address,
    admin_name,
    responsavel_nome,
    responsavel_telefone,
    refresh_time,
  } = req.body || {};
  const modified_by = req.user.user;

  try {
    await pool.query(
      `INSERT INTO system_config (
        building_name, address, admin_name, responsavel_nome,
        responsavel_telefone, refresh_time, modified_by, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,now())`,
      [
        building_name || null,
        address || null,
        admin_name || null,
        responsavel_nome || null,
        responsavel_telefone || null,
        refresh_time || 10,
        modified_by,
      ]
    );
    res.json({ ok: true, msg: "Configuração salva com sucesso." });
  } catch (err) {
    console.error("Erro ao salvar configuração:", err);
    res.status(500).json({ erro: "Erro ao salvar configuração." });
  }
});

export default router;
