// modules/configRouter.js
import express from "express";
import jwt from "jsonwebtoken";

export default function configRouter(pool) {
  const router = express.Router();

  // -------------------------
  // 🧠 Middleware de autenticação
  // -------------------------
  function autenticar(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ erro: "Token não enviado" });

    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "9a476d73d3f307125384a4728279ad9c");
      req.user = payload;
      next();
    } catch {
      return res.status(403).json({ erro: "Token inválido" });
    }
  }

  // -------------------------
  // ⚙️ GET /config/system
  // -------------------------
  router.get("/system", autenticar, async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM buildings LIMIT 1");
      if (result.rows.length === 0) {
        return res.json({
          ok: true,
          config: {
            buildingname: "",
            buildingaddress: "",
            adminenterprise: "",
            adminname: "",
            admincontact: "",
          },
        });
      }
      res.json({ ok: true, config: result.rows[0] });
    } catch (err) {
      console.error("[ERRO] /config/system GET:", err);
      res
        .status(500)
        .json({ ok: false, erro: "Erro ao buscar configurações." });
    }
  });

  // -------------------------
  // 💾 POST /config/system
  // -------------------------
  router.post("/system", autenticar, async (req, res) => {
    const {
      buildingname,
      buildingaddress,
      adminenterprise,
      adminname,
      admincontact,
    } = req.body || {};

    try {
      if (!["admin", "supervisor"].includes(req.user.role)) {
        return res.status(403).json({
          ok: false,
          erro:
            "Apenas administradores e supervisores podem editar as configurações.",
        });
      }

      const check = await pool.query("SELECT buildingid FROM buildings LIMIT 1");

      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO buildings (buildingname, buildingaddress, adminenterprise, adminname, admincontact)
           VALUES ($1,$2,$3,$4,$5)`,
          [buildingname, buildingaddress, adminenterprise, adminname, admincontact]
        );
      } else {
        const id = check.rows[0].buildingid;
        await pool.query(
          `UPDATE buildings
           SET buildingname=$1, buildingaddress=$2, adminenterprise=$3, adminname=$4, admincontact=$5
           WHERE buildingid=$6`,
          [buildingname, buildingaddress, adminenterprise, adminname, admincontact, id]
        );
      }

      // ✅ Retorno consistente em JSON
      res.json({ ok: true, msg: "Configurações atualizadas com sucesso!" });
    } catch (err) {
      console.error("[ERRO] /config/system POST:", err);
      res
        .status(500)
        .json({ ok: false, erro: "Erro ao salvar configurações." });
    }
  });

  return router;
}
