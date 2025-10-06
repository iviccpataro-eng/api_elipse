// routes/config.js
import express from "express";
import { autenticar, somenteAdmin } from "../middleware/auth.js";
import pkg from "pg";

const { Pool } = pkg;
const router = express.Router();

// Conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * GET /config/system
 * Retorna o último registro de configuração do sistema
 */
router.get("/system", autenticar, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT building_name, address, admin_name, responsavel_nome, 
              responsavel_telefone, refresh_time, modified_by, updated_at
       FROM system_config
       ORDER BY updated_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        ok: true,
        config: {
          building_name: "",
          address: "",
          admin_name: "",
          responsavel_nome: "",
          responsavel_telefone: "",
          refresh_time: 10,
          modified_by: "",
          updated_at: null,
        },
      });
    }

    res.json({ ok: true, config: result.rows[0] });
  } catch (err) {
    console.error("[CONFIG] ❌ Erro ao buscar configuração:", err.message);
    res.status(500).json({ ok: false, erro: "Erro ao buscar configuração" });
  }
});

/**
 * POST /config/system
 * Atualiza ou insere nova configuração do sistema
 * Somente administradores podem alterar
 */
router.post("/system", autenticar, somenteAdmin, async (req, res) => {
  const {
    building_name,
    address,
    admin_name,
    responsavel_nome,
    responsavel_telefone,
    refresh_time,
  } = req.body || {};

  const modified_by = req.user?.user || "sistema";

  try {
    await pool.query(
      `INSERT INTO system_config 
       (building_name, address, admin_name, responsavel_nome, responsavel_telefone, refresh_time, modified_by, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,now())`,
      [
        building_name || "",
        address || "",
        admin_name || "",
        responsavel_nome || "",
        responsavel_telefone || "",
        refresh_time || 10,
        modified_by,
      ]
    );

    console.log(`[CONFIG] ✅ Configuração salva por ${modified_by}`);
    res.json({ ok: true, msg: "Configurações salvas com sucesso!" });
  } catch (err) {
    console.error("[CONFIG] ❌ Erro ao salvar configuração:", err.message);
    res.status(500).json({ ok: false, erro: "Erro ao salvar configuração" });
  }
});

export default router;
