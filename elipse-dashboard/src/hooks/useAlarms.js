// src/hooks/useAlarms.js
import { useEffect, useState, useRef, useCallback } from "react";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

function normalizeAlarmFromServer(a) {
  // server already returns object when using DB manager
  if (!a) return null;

  // If it's an array like ["Name", true, 0, "in", "out"]
  if (Array.isArray(a)) {
    const [name, active, severity, inT, outT] = a;
    return {
      name,
      active: Boolean(active),
      severity: typeof severity === "number" ? severity : (severity ? Number(severity) : 0),
      timestampIn: inT || null,
      timestampOut: outT || null,
      ack: false,
      ackUser: null,
      ackTimestamp: null,
      tag: a.tag || null,
    };
  }

  // If server already returned DB rows shaped by alarmManager.rowToAlarmObj
  const alarm = {
    id: a.id ?? null,
    tag: a.tag ?? a.source ?? null,
    name: a.name ?? "",
    active: a.active ?? false,
    severity: a.severity ?? 0,
    timestampIn: a.timestampIn ?? a.timestamp_in ?? null,
    timestampOut: a.timestampOut ?? a.timestamp_out ?? null,
    ack: a.ack ?? false,
    ackUser: a.ackUser ?? a.ack_user ?? null,
    ackTimestamp: a.ackTimestamp ?? a.ack_timestamp ?? null,
    message: a.message ?? null,
  };
  return alarm;
}

export default function useAlarms(pollInterval = 3000) {
  const [alarms, setAlarms] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const [banner, setBanner] = useState(null);
  const lastCountRef = useRef(0);

  const fetchAlarms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/alarms/active`);
      if (!res.ok) throw new Error("Erro ao buscar alarmes");
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : data).map(normalizeAlarmFromServer);

      // Detect new alarm(s)
      if (normalized.length > lastCountRef.current) {
        const newest = normalized[normalized.length - 1];
        setBanner(`Novo alarme: ${newest.name}`);
        setHasNew(true);
        setTimeout(() => setHasNew(false), 3500);
      }

      lastCountRef.current = normalized.length;
      setAlarms(normalized);
    } catch (err) {
      console.warn("useAlarms fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchAlarms();
    const t = setInterval(fetchAlarms, pollInterval);
    return () => clearInterval(t);
  }, [fetchAlarms, pollInterval]);

  // ACK
  const ack = async (tag, name, user = null) => {
    try {
      await fetch(`${API_BASE}/alarms/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, name, user }),
      });
      // Optimistic update: mark local alarm as acked
      setAlarms((prev) =>
        prev.map((a) => (a.tag === tag && a.name === name ? { ...a, ack: true, ackUser: user, ackTimestamp: new Date().toISOString() } : a))
      );
    } catch (err) {
      console.warn("ack error", err);
    }
  };

  // Clear specific alarm (finalizar)
  const clear = async (tag, name) => {
    try {
      await fetch(`${API_BASE}/alarms/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, name }),
      });
      // optimistic update: set active false locally (will be removed from active list on next poll if DB closed)
      setAlarms((prev) => prev.map((a) => (a.tag === tag && a.name === name ? { ...a, active: false, timestampOut: new Date().toISOString() } : a)));
    } catch (err) {
      console.warn("clear error", err);
    }
  };

  // Clear recognized (DELETE on DB)
  const clearRecognized = async () => {
    try {
      const res = await fetch(`${API_BASE}/alarms/clear-recognized`, {
        method: "POST",
      });
      if (res.ok) {
        // remove from UI those that are ack && not active (we prefer to reload)
        fetchAlarms();
      }
    } catch (err) {
      console.warn("clearRecognized error", err);
    }
  };

  return {
    alarms,
    hasNew,
    banner,
    setBanner,
    ack,
    clear,
    clearRecognized,
    refresh: fetchAlarms,
  };
}
