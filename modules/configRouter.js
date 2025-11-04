// modules/configRouter.js
import express from "express";

export default function configRouter(pool) {
  const router = express.Router();

  router.get("/system", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM buildings LIMIT 1");
      res.json({ ok: true, config: result.rows[0] || {} });
    } catch (err) {
      console.error("[CONFIG GET] Erro:", err);
      res.status(500).json({ ok: false, erro: "Erro ao buscar configurações." });
    }
  });

  router.post("/system", async (req, res) => {
    const { buildingname, buildingaddress, adminenterprise, adminname, admincontact } = req.body || {};
    try {
      const check = await pool.query("SELECT buildingid FROM buildings LIMIT 1");
      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO buildings (buildingname, buildingaddress, adminenterprise, adminname, admincontact)
           VALUES ($1,$2,$3,$4,$5)`,
          [buildingname, buildingaddress, adminenterprise, adminname, admincontact]
        );
      } else {
        await pool.query(
          `UPDATE buildings SET buildingname=$1, buildingaddress=$2, adminenterprise=$3, adminname=$4, admincontact=$5 WHERE buildingid=$6`,
          [buildingname, buildingaddress, adminenterprise, adminname, admincontact, check.rows[0].buildingid]
        );
      }
      res.json({ ok: true, msg: "Configurações salvas com sucesso!" });
    } catch (err) {
      console.error("[CONFIG POST] Erro:", err);
      res.status(500).json({ ok: false, erro: "Erro ao salvar configurações." });
    }
  });

  return router;
}
