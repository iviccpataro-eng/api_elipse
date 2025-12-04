// modules/alarmManager.js
/**
 * Versão revisada com:
 * - notified (para banners e fila)
 * - reordenação por severity desc + timestamp asc
 * - atualização de alarm já ativo (message/severity/source)
 * - geração de message/source amigáveis se faltarem
 */

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

// -------------------- Helpers -------------------------

function rowToAlarmObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    tag: row.tag,
    name: row.name,
    severity: row.severity,
    active: row.active,
    timestampIn: row.timestamp_in?.toISOString() ?? null,
    timestampOut: row.timestamp_out?.toISOString() ?? null,
    ack: row.ack,
    ackUser: row.ack_user || null,
    ackTimestamp: row.ack_timestamp?.toISOString() ?? null,
    message: row.message || null,
    source: row.source || null,
    notified: row.notified ?? false,
  };
}

function tryExtractFriendly(tag) {
  const p = tag.split("/"); // exemplo: BUILDING/FLOOR/EQUIP/TAG
  return {
    building: p[1] || "",
    floor: p[2] || "",
    equip: p[3] || p[p.length - 1],
  };
}

function buildMessage(name, tag) {
  const f = tryExtractFriendly(tag);
  return `${name} - ${f.equip} - ${f.floor} - ${f.building}`;
}

function buildSource(tag) {
  const f = tryExtractFriendly(tag);
  return `${f.building} > ${f.floor} > ${f.equip}`;
}

// ------------------------------------------------------
// registerAlarm
// ------------------------------------------------------

export async function registerAlarm(tag, alarm) {
  try {
    if (!tag || !alarm?.name) return;

    const name = String(alarm.name);
    const severity = Number(
      typeof alarm.severity === "number"
        ? alarm.severity
        : alarm.priority ?? 0
    );

    const timestampIn = alarm.timestamp
      ? new Date(alarm.timestamp)
      : new Date();

    const message = alarm.message || buildMessage(name, tag);
    const source = alarm.source || buildSource(tag);

    // verificar se já existe ativo
    const existing = await pool.query(
      `SELECT * FROM alarms
       WHERE tag=$1 AND name=$2 AND active=true
       ORDER BY timestamp_in DESC
       LIMIT 1`,
      [tag, name]
    );

    if (existing.rowCount > 0) {
      // **Atualizar severity/message/source do alarme já ativo**
      const id = existing.rows[0].id;

      await pool.query(
        `UPDATE alarms
         SET severity=$1,
             message=$2,
             source=$3
         WHERE id=$4`,
        [severity, message, source, id]
      );

      return; // não criar novo registro
    }

    // Criar novo alarme
    const insert = await pool.query(
      `INSERT INTO alarms
        (tag, name, severity, active, timestamp_in, message, source, ack, notified)
       VALUES ($1,$2,$3,true,$4,$5,$6,false,false)
       RETURNING *`,
      [tag, name, severity, timestampIn, message, source]
    );

    const created = insert.rows[0];
    console.log(`🚨 Novo alarme: ${name} (${tag})`);
    return rowToAlarmObj(created);

  } catch (err) {
    console.error("[alarmManager.registerAlarm] ERRO:", err);
  }
}

// ------------------------------------------------------
// clearAlarm
// ------------------------------------------------------

export async function clearAlarm(tag, name) {
  try {
    if (!tag || !name) return;

    const existing = await pool.query(
      `SELECT id FROM alarms
       WHERE tag=$1 AND name=$2 AND active=true
       ORDER BY timestamp_in DESC
       LIMIT 1`,
      [tag, name]
    );

    if (existing.rowCount === 0) return;

    const id = existing.rows[0].id;
    const now = new Date();

    const updated = await pool.query(
      `UPDATE alarms
       SET active=false,
           timestamp_out=$1
       WHERE id=$2
       RETURNING *`,
      [now, id]
    );

    console.log(`✅ Alarme finalizado: ${name} (${tag})`);
    return rowToAlarmObj(updated.rows[0]);

  } catch (err) {
    console.error("[alarmManager.clearAlarm] ERRO:", err);
  }
}

// ------------------------------------------------------
// ackAlarm
// ------------------------------------------------------

export async function ackAlarm(tag, name, ackUser = null) {
  try {
    if (!tag || !name) return;

    const existing = await pool.query(
      `SELECT id FROM alarms
       WHERE tag=$1 AND name=$2 AND active=true
       ORDER BY timestamp_in DESC
       LIMIT 1`,
      [tag, name]
    );

    if (existing.rowCount === 0) return;

    const id = existing.rows[0].id;
    const now = new Date();

    const upd = await pool.query(
      `UPDATE alarms
       SET ack=true,
           ack_user=$1,
           ack_timestamp=$2
       WHERE id=$3
       RETURNING *`,
      [ackUser, now, id]
    );

    console.log(`🟡 ACK: ${name} (${tag}) por ${ackUser ?? "N/A"}`);
    return rowToAlarmObj(upd.rows[0]);

  } catch (err) {
    console.error("[alarmManager.ackAlarm] ERRO:", err);
  }
}

// ------------------------------------------------------
// markNotified (para banners)
// ------------------------------------------------------

export async function markNotified(id, value = true) {
  try {
    const upd = await pool.query(
      `UPDATE alarms
       SET notified=$1
       WHERE id=$2
       RETURNING *`,
      [value, id]
    );

    return rowToAlarmObj(upd.rows[0]);
  } catch (err) {
    console.error("[alarmManager.markNotified] ERRO:", err);
  }
}

// ------------------------------------------------------
// getActiveAlarms (ordenado por severidade DESC)
// ------------------------------------------------------

export async function getActiveAlarms() {
  try {
    const rows = await pool.query(
      `SELECT *
       FROM alarms
       WHERE active=true
       ORDER BY severity DESC, timestamp_in ASC`
    );

    return rows.rows.map(rowToAlarmObj);

  } catch (err) {
    console.error("[alarmManager.getActiveAlarms] ERRO:", err);
    return [];
  }
}

// ------------------------------------------------------
// Histórico
// ------------------------------------------------------

export async function getAlarmHistory({ limit = 500, offset = 0 } = {}) {
  try {
    const rows = await pool.query(
      `SELECT *
       FROM alarms
       ORDER BY timestamp_in DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return rows.rows.map(rowToAlarmObj);

  } catch (err) {
    console.error("[alarmManager.getAlarmHistory] ERRO:", err);
    return [];
  }
}

// ------------------------------------------------------

export async function clearRecognized() {
  try {
    const del = await pool.query(
      `DELETE FROM alarms
       WHERE ack=true AND active=false`
    );

    console.log(`[clearRecognized] removidos ${del.rowCount}`);
    return del.rowCount;

  } catch (err) {
    console.error("[alarmManager.clearRecognized] ERRO:", err);
  }
}

export async function shutdown() {
  try {
    await pool.end();
  } catch {}
}
