// routes/system.js
import express from "express";
import { autenticar, somenteAdmin } from "../middleware/auth.js";
import { pool } from "../config/db.js";

const router = express.Router();

// Armazena os dados básicos do empreendimento
router.post("/system", autenticar, somenteAdmin, async (req, res) => {
  const { buildingName, address, adminName, contactName, contactPhone } = req.body || {};

  try {
    await pool.query(
      `INSERT INTO system_config (id, building_name, address, admin_name, contact_name, contact_phone)
       VALUES (1, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         building_name = EXCLUDED.building_name,
         address = EXCLUDED.address,
         admin_name = EXCLUDED.admin_name,
         contact_name = EXCLUDED.contact_name,
         contact_phone = EXCLUDED.contact_phone`,
      [buildingName, address, adminName, contactName, contactPhone]
    );

    res.json({ ok: true, msg: "Configurações do empreendimento salvas com sucesso!" });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao salvar configurações." });
  }
});

router.get("/system", autenticar, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM system_config WHERE id = 1");
    res.json({ ok: true, config: result.rows[0] || {} });
  } catch {
    res.status(500).json({ erro: "Erro ao carregar configurações." });
  }
});

export default router;
