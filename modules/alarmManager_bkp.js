// modules/alarmManager.js
const activeAlarms = new Map(); // tag -> { name, message, timestamp }

export function registerAlarm(tag, alarm) {
  if (!tag || !alarm?.name) return;
  const key = `${tag}:${alarm.name}`;
  activeAlarms.set(key, {
    tag,
    name: alarm.name,
    message: alarm.message || "",
    source: alarm.source || tag,
    timestamp: new Date().toISOString(),
  });
  console.log(`🚨 Novo alarme: ${alarm.name} (${tag})`);
}

export function clearAlarm(tag, name) {
  const key = `${tag}:${name}`;
  if (activeAlarms.has(key)) {
    activeAlarms.delete(key);
    console.log(`✅ Alarme resolvido: ${name} (${tag})`);
  }
}

export function getActiveAlarms() {
  return Array.from(activeAlarms.values());
}

export function hasActiveAlarms() {
  return activeAlarms.size > 0;
}
