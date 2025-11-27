// modules/alarmManager.js
/**
 * alarmManager.js
 *
 * Persistência de alarmes no PostgreSQL (Modelo A: um registro por evento).
 *
 * Requisitos:
 * - Ter a tabela `alarms` criada no banco (ver instruções no chat anterior).
 * - Variável de ambiente DATABASE_URL configurada (mesma do server.js).
 *
 * Exporta:
 * - registerAlarm(tag, alarm)
 * - clearAlarm(tag, name)
 * - ackAlarm(tag, name, ackUser)
 * - getActiveAlarms()
 * - getAlarmHistory({ limit, offset })
 *
 * Observações:
 * - Quando registerAlarm é chamado, se já existir um registro ativo (active = true)
 *   para o mesmo tag+name, o manager NÃO cria um novo row (evita duplicatas).
 * - clearAlarm fecha o registro ativo mais recente para tag+name.
 * - ackAlarm atualiza o registro ativo mais recente para tag+name (marca ack).
 */

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Helper para transformar row do DB no shape esperado pelo frontend
function rowToAlarmObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    tag: row.tag,
    name: row.name,
    severity: row.severity,
    active: row.active,
    timestampIn: row.timestamp_in ? row.timestamp_in.toISOString() : null,
    timestampOut: row.timestamp_out ? row.timestamp_out.toISOString() : null,
    ack: row.ack,
    ackUser: row.ack_user || null,
    ackTimestamp: row.ack_timestamp ? row.ack_timestamp.toISOString() : null,
    message: row.message || null,
    source: row.source || null,
  };
}

/**
 * registerAlarm(tag, alarm)
 * alarm: { name, message?, severity?, timestamp? }
 */
export async function registerAlarm(tag, alarm) {
  try {
    if (!tag || !alarm || !alarm.name) return;

    const name = String(alarm.name);
    const severity = typeof alarm.severity === "number" ? alarm.severity : (alarm.severity ? Number(alarm.severity) : 0);
    const message = alarm.message || null;
    const timestampIn = alarm.timestamp ? new Date(alarm.timestamp) : new Date();
    const source = alarm.source || tag;

    // Verifica se já existe um alarme ativo para o mesmo tag+name
    const findSql = `
      SELECT id
      FROM alarms
      WHERE tag = $1 AND name = $2 AND active = true
      ORDER BY timestamp_in DESC
      LIMIT 1
    `;
    const findRes = await pool.query(findSql, [tag, name]);

    if (findRes.rowCount > 0) {
      // já existe alarme ativo — não duplicar
      // opcional: poderia atualizar timestamp_in para "refresh", mas mantemos o comportamento de não duplicar
      // console.log(`[alarmManager] Alarme já ativo: ${name} (${tag})`);
      return;
    }

    // Insere novo evento de alarme
    const insertSql = `
      INSERT INTO alarms
        (tag, name, severity, active, timestamp_in, message, source, ack)
      VALUES ($1, $2, $3, true, $4, $5, $6, false)
      RETURNING *
    `;
    const insertRes = await pool.query(insertSql, [tag, name, severity, timestampIn, message, source]);
    const created = insertRes.rows[0];

    console.log(`🚨 Novo alarme inserido: ${name} (${tag}) [id=${created.id}]`);
    return rowToAlarmObj(created);
  } catch (err) {
    console.error("[alarmManager.registerAlarm] ERRO:", err);
    // não lançar erro para não quebrar o pipeline do recebimento de dados
  }
}

/**
 * clearAlarm(tag, name)
 * Fecha (timestamp_out / active = false) o registro ativo mais recente para tag+name.
 */
export async function clearAlarm(tag, name) {
  try {
    if (!tag || !name) return;

    // Encontra o registro ativo mais recente
    const findSql = `
      SELECT id
      FROM alarms
      WHERE tag = $1 AND name = $2 AND active = true
      ORDER BY timestamp_in DESC
      LIMIT 1
    `;
    const findRes = await pool.query(findSql, [tag, name]);

    if (findRes.rowCount === 0) {
      // nada a fechar
      return;
    }

    const id = findRes.rows[0].id;
    const now = new Date();

    const updateSql = `
      UPDATE alarms
      SET active = false, timestamp_out = $1
      WHERE id = $2
      RETURNING *
    `;
    const updRes = await pool.query(updateSql, [now, id]);
    const closed = updRes.rows[0];

    console.log(`✅ Alarme finalizado: ${name} (${tag}) [id=${id}]`);
    return rowToAlarmObj(closed);
  } catch (err) {
    console.error("[alarmManager.clearAlarm] ERRO:", err);
  }
}

/**
 * ackAlarm(tag, name, ackUser)
 * Marca ack = true, ack_user e ack_timestamp para o registro ativo mais recente.
 * ackUser é opcional (string).
 */
export async function ackAlarm(tag, name, ackUser = null) {
  try {
    if (!tag || !name) return;

    // Encontra registro ativo mais recente para atualizar
    const findSql = `
      SELECT id
      FROM alarms
      WHERE tag = $1 AND name = $2 AND active = true
      ORDER BY timestamp_in DESC
      LIMIT 1
    `;
    const findRes = await pool.query(findSql, [tag, name]);
    if (findRes.rowCount === 0) {
      // Se não há registro ativo, tenta reconhecer o último evento (opcional)
      // Aqui escolhemos não fazer nada.
      return;
    }

    const id = findRes.rows[0].id;
    const now = new Date();

    const updateSql = `
      UPDATE alarms
      SET ack = true,
          ack_user = $1,
          ack_timestamp = $2
      WHERE id = $3
      RETURNING *
    `;
    const updRes = await pool.query(updateSql, [ackUser, now, id]);
    const acked = updRes.rows[0];

    console.log(`🟡 Alarme reconhecido (ACK): ${name} (${tag}) [id=${id}] by ${ackUser || "unknown"} `);
    return rowToAlarmObj(acked);
  } catch (err) {
    console.error("[alarmManager.ackAlarm] ERRO:", err);
  }
}

/**
 * getActiveAlarms()
 * Retorna array de alarmes ativos (active = true).
 */
export async function getActiveAlarms() {
  try {
    const sql = `
      SELECT *
      FROM alarms
      WHERE active = true
      ORDER BY timestamp_in ASC
    `;
    const res = await pool.query(sql);
    return res.rows.map(rowToAlarmObj);
  } catch (err) {
    console.error("[alarmManager.getActiveAlarms] ERRO:", err);
    return [];
  }
}

/**
 * getAlarmHistory({ limit = 500, offset = 0 })
 * Retorna histórico (todos os registros). Ordenado por timestamp_in desc.
 * Use paginação se quiser.
 */
export async function getAlarmHistory({ limit = 500, offset = 0 } = {}) {
  try {
    const sql = `
      SELECT *
      FROM alarms
      ORDER BY timestamp_in DESC
      LIMIT $1 OFFSET $2
    `;
    const res = await pool.query(sql, [limit, offset]);
    return res.rows.map(rowToAlarmObj);
  } catch (err) {
    console.error("[alarmManager.getAlarmHistory] ERRO:", err);
    return [];
  }
}

/**
 * Optional: função para limpar alarmes reconhecidos (por exemplo pelo usuário)
 * remove definitivamente (DELETE) ou marca como archived — aqui faremos DELETE.
 *
 * clearRecognized() -> deleta linhas com ack = true e active = false (opcional)
 */
export async function clearRecognized() {
  try {
    const sql = `
      DELETE FROM alarms
      WHERE ack = true AND active = false
    `;
    const res = await pool.query(sql);
    console.log(`[alarmManager.clearRecognized] Removidos ${res.rowCount} registros reconhecidos e finalizados.`);
    return res.rowCount;
  } catch (err) {
    console.error("[alarmManager.clearRecognized] ERRO:", err);
    return 0;
  }
}

/**
 * Fechamento limpo do pool (se precisar)
 */
export async function shutdown() {
  try {
    await pool.end();
  } catch (err) {
    // ignore
  }
}
