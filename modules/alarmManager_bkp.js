const activeAlarms = new Map();   // alarmes ativos
const alarmHistory = [];          // histórico completo

export function registerAlarm(tag, alarm) {
  if (!tag || !alarm?.name) return;

  const key = `${tag}:${alarm.name}`;
  const now = new Date().toISOString();

  // Se o alarme não estava ativo → é novo
  if (!activeAlarms.has(key)) {
    activeAlarms.set(key, {
      tag,
      name: alarm.name,
      message: alarm.message || "",
      severity: alarm.severity ?? 0,
      source: alarm.source || tag,
      timestamp: now,
      ack: false,
    });

    // Adiciona histórico (entrada)
    alarmHistory.push({
      tag,
      name: alarm.name,
      severity: alarm.severity ?? 0,
      entered: now,
      cleared: null,
      ack: false,
    });

    console.log(`🚨 Novo alarme registrado: ${alarm.name} (${tag})`);
  }
}

export function clearAlarm(tag, name) {
  const key = `${tag}:${name}`;
  const now = new Date().toISOString();

  if (activeAlarms.has(key)) {
    activeAlarms.delete(key);

    // Atualiza histórico
    const hist = alarmHistory.find(
      (a) => a.tag === tag && a.name === name && !a.cleared
    );
    if (hist) hist.cleared = now;

    console.log(`✅ Alarme finalizado: ${name} (${tag})`);
  }
}

export function ackAlarm(tag, name) {
  const key = `${tag}:${name}`;
  if (activeAlarms.has(key)) {
    const alarm = activeAlarms.get(key);
    alarm.ack = true;

    const hist = alarmHistory.find(
      (a) => a.tag === tag && a.name === name && !a.cleared
    );
    if (hist) hist.ack = true;

    console.log(`🟡 Alarme reconhecido (ACK): ${name} (${tag})`);
  }
}

export function getActiveAlarms() {
  return Array.from(activeAlarms.values());
}

export function getAlarmHistory() {
  return alarmHistory;
}
