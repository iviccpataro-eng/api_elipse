// src/hooks/useAlarms.js
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * useAlarms
 * -------------------------------------------
 * Hook responsável por:
 * ✔ Buscar /alarms/actives
 * ✔ Detectar novos alarmes
 * ✔ Criar fila de banners
 * ✔ Somar sons
 * ✔ Timeout automático para severidades 0-1-2
 * ✔ Sem timeout para severidade 3
 * ✔ Atualizar "notified" no backend
 * ✔ Banner clicável → leva ao equipamento
 * -------------------------------------------
 */

export default function useAlarms(interval = 3000) {
  const navigate = useNavigate();

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://api-elipse.onrender.com";

  const [alarms, setAlarms] = useState([]);
  const [hasNew, setHasNew] = useState(false);

  const [bannerQueue, setBannerQueue] = useState([]);
  const [banner, setBanner] = useState(null);

  const shownRef = useRef({});
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  /* ============================================================
     🔊 SOM DO ALARME
  ============================================================ */
  const lastSoundRef = useRef(null);

  function playAlarmSound(sev, key) {
    try {
      if (lastSoundRef.current === key) return;
      lastSoundRef.current = key;

      let path =
        sev >= 3
          ? "/sounds/critical.mp3"
          : sev === 2
          ? "/sounds/high.mp3"
          : "/sounds/low.mp3";

      const audio = new Audio(path);
      audio.volume = sev >= 3 ? 1 : 0.6;
      audio.play().catch(() => {});
    } catch {}
  }

  /* ============================================================
     📡 FETCH DE ALARMES
  ============================================================ */
  async function fetchAlarms() {
    try {
      const res = await fetch(`${API_BASE}/alarms/actives`);
      const json = await res.json();

      if (!json.ok) return;

      const list = json.alarms || [];
      setAlarms(list);

      list.forEach((a) => {
        const key = `${a.tag}|${a.name}`;

        // Detecção de novo alarme não notificado
        if (a.active && !shownRef.current[key]) {
          shownRef.current[key] = true;

          playAlarmSound(a.severity, key);

          // Adiciona ao bannerQueue
          setBannerQueue((q) => [
            ...q,
            {
              tag: a.tag,
              name: a.name,
              id: a.id,
              message: a.message,
              severity: a.severity,
              source: a.source,
              notified: a.notified,
            },
          ]);

          setHasNew(true);
        }
      });

      // Limpa alarmes que não estão ativos
      Object.keys(shownRef.current).forEach((key) => {
        const exists = list.find(
          (a) => `${a.tag}|${a.name}` === key && a.active
        );
        if (!exists) delete shownRef.current[key];
      });
    } catch (err) {
      console.error("Erro ao buscar alarmes:", err);
    }
  }

  /* ============================================================
     🔄 POLLING
  ============================================================ */
  useEffect(() => {
    fetchAlarms();
    pollRef.current = setInterval(fetchAlarms, interval);
    return () => clearInterval(pollRef.current);
  }, [interval]);

  /* ============================================================
     🟧 ATUALIZAR NOTIFIED NO BACKEND
  ============================================================ */
  async function markAsNotified(id) {
    if (!id) return;
    try {
      await fetch(`${API_BASE}/alarms/notified`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notified: true }),
      });
    } catch (err) {
      console.warn("Erro ao atualizar notified:", err);
    }
  }

  /* ============================================================
     🎯 SISTEMA DE FILA + PRIORIDADE + TIMEOUT
  ============================================================ */
  useEffect(() => {
    if (banner) return;
    if (bannerQueue.length === 0) return;

    // Ordena por severidade
    const sorted = [...bannerQueue].sort(
      (a, b) => b.severity - a.severity
    );

    const next = sorted[0];

    // Remove da fila
    setBannerQueue((q) => q.filter((x) => x !== next));

    // Exibe banner
    setBanner(next);

    // Marca como "notified"
    if (next.id) markAsNotified(next.id);

    // Severidade 3 (CRÍTICO) → sem timeout
    if (next.severity >= 3) return;

    // Timeout de 5s para 0-1-2
    timerRef.current = setTimeout(() => {
      setBanner(null);
    }, 5000);

    return () => clearTimeout(timerRef.current);
  }, [bannerQueue, banner]);

  /* ============================================================
     ❌ FECHAR BANNER MANUALMENTE
  ============================================================ */
  function closeBanner() {
    clearTimeout(timerRef.current);
    setBanner(null);
  }

  /* ============================================================
     🟦 CLICK → IR PARA EQUIPAMENTO
  ============================================================ */
  function goToEquipment(tag) {
    try {
      const parts = tag.split("/");
      const disciplina = parts[0];
      const building = parts[1];
      const floor = parts[2];
      const equip = parts[3];

      navigate(
        `/equipamento/${disciplina}/${building}/${floor}/${equip}`
      );
    } catch (err) {
      console.warn("Erro ao navegar para equipamento:", err);
    }
  }

  /* ============================================================
     🔧 AÇÕES (ACK / CLEAR)
  ============================================================ */
  async function ack(tag, name) {
    await fetch(`${API_BASE}/alarms/ack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, name }),
    });
    fetchAlarms();
  }

  async function clear(tag, name) {
    await fetch(`${API_BASE}/alarms/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, name }),
    });
    fetchAlarms();
  }

  async function clearRecognized() {
    await fetch(`${API_BASE}/alarms/clear-recognized`, {
      method: "POST",
    });
    fetchAlarms();
  }

  return {
    alarms,
    hasNew,
    banner,
    closeBanner,
    goToEquipment,
    ack,
    clear,
    clearRecognized,
  };
}
