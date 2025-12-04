// modules/alarmProcessor.js
import { registerAlarm, clearAlarm } from "./alarmManager.js";

/**
 * Processa structureDetails vindo do Elipse E3
 * e mantém a tabela "alarms" sincronizada.
 *
 * - Se o alarme veio ativo → registerAlarm()
 * - Se NÃO veio ativo mas existia ativo → clearAlarm()
 */
export async function processIncomingAlarms(structureDetails) {
  if (!structureDetails || typeof structureDetails !== "object") {
    console.error("[alarmProcessor] structureDetails inválido");
    return;
  }

  const alarmsFound = []; // lista de { tag, name }

  for (const tag in structureDetails) {
    const dev = structureDetails[tag];
    if (!dev?.alarm) continue;

    for (const al of dev.alarm) {
      const active = Boolean(al.active);
      const name = al.name;

      // Criar chave única
      const key = `${tag}|${name}`;

      if (active) {
        alarmsFound.push(key);

        // REGISTRAR OU ATUALIZAR
        await registerAlarm(tag, {
          name,
          severity: al.severity ?? 0,
          timestamp: al.timestampIn ?? al.timestamp ?? new Date(),
          message: al.message || null,
          source: al.source || null
        });
      } else {
        // Se não está ativo -> será finalizado no ciclo abaixo
      }
    }
  }

  // FINALIZAR ALARMES QUE NÃO FORAM ENCONTRADOS ATIVOS
  await clearMissingAlarms(alarmsFound);
}

/**
 * Finaliza automaticamente alarmes que não apareceram ativos no ciclo.
 */
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

async function clearMissingAlarms(activeKeys) {
  try {
    const rows = await pool.query(
      `SELECT tag,name FROM alarms WHERE active=true`
    );

    for (const r of rows.rows) {
      const key = `${r.tag}|${r.name}`;
      if (!activeKeys.includes(key)) {
        // Alarme estava ativo mas não veio no payload -> finaliza
        await clearAlarm(r.tag, r.name);
      }
    }
  } catch (err) {
    console.error("[clearMissingAlarms] ERRO:", err);
  }
}
